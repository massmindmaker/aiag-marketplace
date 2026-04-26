/**
 * Replicate adapter — author pass-through (Path 2 per Plan 05 §4.3, Task 8).
 *
 * Semantics:
 * - The author owns their Replicate account and supplies a Replicate API
 *   token at onboarding time. The token is encrypted with a per-author DEK
 *   (envelope encryption under KEK_ADMIN) and stored in `authors.dek_encrypted`
 *   + `ai_models.config.replicate_token_encrypted`.
 * - On invocation the gateway joins `authors` → model.config, passes both
 *   encrypted blobs to the adapter in `opts.model_meta.config`. Adapter
 *   envelope-decrypts (KEK_ADMIN → DEK → token) and calls Replicate as that
 *   author. We do NOT reseller — cost pass-through, commission is computed
 *   later by a monthly revshare worker.
 * - Hot-path decrypted tokens are cached in a pluggable `tokenCache`
 *   (Redis in prod, in-memory Map in tests) keyed by model_id, 10 min TTL.
 *   Cache invalidation on rotation: caller calls `adapter.invalidateToken(modelId)`.
 *
 * API: https://replicate.com/docs/reference/http
 * - POST https://api.replicate.com/v1/predictions
 *   { version: "<cog_version>", input: {...} } → { id, status, urls: { get } }
 * - GET https://api.replicate.com/v1/predictions/{id} → { status, output }
 * - GET https://api.replicate.com/v1/models/{owner}/{name} (cog schema validation)
 * - Auth: `Authorization: Token <r8_***>`
 */
import { UpstreamAdapterBase, type AdapterConfig } from '../base/UpstreamAdapterBase';
import { envelopeDecrypt, type EncryptedSecret, type KekInput } from '../byok/encryption';
import type {
  AsyncJobHandle,
  AsyncJobResult,
  CostEstimate,
  HealthStatus,
  ImageRequest,
  Modality,
  ModelMeta,
  UpstreamInvokeOptions,
  VideoRequest,
} from '../base/UpstreamAdapter';

export interface ReplicatePassthroughConfig extends Record<string, unknown> {
  replicate_version: string;
  replicate_token_encrypted: EncryptedSecret;
  author_dek_encrypted: EncryptedSecret;
  author_id: string;
}

export interface ReplicateModelMeta extends ModelMeta {
  config: ReplicatePassthroughConfig;
}

export interface TokenCache {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttl_seconds: number): Promise<void>;
  del(key: string): Promise<void>;
}

export class InMemoryTokenCache implements TokenCache {
  private map = new Map<string, { value: string; expires_at: number }>();
  async get(key: string): Promise<string | null> {
    const hit = this.map.get(key);
    if (!hit) return null;
    if (hit.expires_at < Date.now()) {
      this.map.delete(key);
      return null;
    }
    return hit.value;
  }
  async set(key: string, value: string, ttl_seconds: number): Promise<void> {
    this.map.set(key, { value, expires_at: Date.now() + ttl_seconds * 1000 });
  }
  async del(key: string): Promise<void> {
    this.map.delete(key);
  }
}

export interface ReplicateConfig extends Omit<AdapterConfig, 'baseUrl' | 'apiKey' | 'auth_scheme'> {
  baseUrl?: string;
  /** KEK_ADMIN — used to unwrap per-author DEKs. */
  kek_admin: KekInput;
  /** Plaintext admin Replicate token for healthCheck probe (optional). */
  admin_token?: string;
  /** Pluggable cache for decrypted author tokens (Redis in prod, in-memory in tests). */
  tokenCache?: TokenCache;
  /** TTL for cached decrypted tokens in seconds (default 600). */
  token_ttl_seconds?: number;
}

type InvokeOptsWithMeta = UpstreamInvokeOptions & {
  model_meta?: ReplicateModelMeta;
};

export class ReplicateAdapter extends UpstreamAdapterBase {
  readonly name = 'replicate-passthrough';
  readonly supports_modalities: readonly Modality[] = ['image', 'video', 'audio', 'chat'];

  private kek_admin: KekInput;
  private tokenCache: TokenCache;
  private token_ttl_seconds: number;
  private admin_token?: string;

  constructor(cfg: ReplicateConfig) {
    super({
      baseUrl: cfg.baseUrl ?? 'https://api.replicate.com/v1/',
      apiKey: cfg.admin_token ?? 'PLACEHOLDER',
      markup: cfg.markup ?? 1.0, // pass-through; commission handled separately
      usd_rate: cfg.usd_rate,
      userAgent: cfg.userAgent ?? 'AIAG-Replicate/0.5',
      default_timeout_ms: cfg.default_timeout_ms ?? 60_000,
      fetch: cfg.fetch,
      auth_scheme: 'none',
      extra_headers: cfg.extra_headers,
      retry: cfg.retry,
    });
    this.kek_admin = cfg.kek_admin;
    this.tokenCache = cfg.tokenCache ?? new InMemoryTokenCache();
    this.token_ttl_seconds = cfg.token_ttl_seconds ?? 600;
    this.admin_token = cfg.admin_token;
  }

  /**
   * Envelope decrypt the author's Replicate token, caching the plaintext for
   * TTL seconds. Idempotent — safe to call multiple times per request.
   */
  async tokenForModel(model: ReplicateModelMeta): Promise<string> {
    const cacheKey = `replicate_token:${model.id}`;
    const cached = await this.tokenCache.get(cacheKey);
    if (cached) return cached;

    const { replicate_token_encrypted, author_dek_encrypted } = model.config ?? {};
    if (!replicate_token_encrypted || !author_dek_encrypted) {
      throw new Error(
        `Replicate model ${model.id} missing author token or DEK (contract violation — see ReplicateModelMeta)`,
      );
    }
    const token = envelopeDecrypt(replicate_token_encrypted, author_dek_encrypted, this.kek_admin);
    await this.tokenCache.set(cacheKey, token, this.token_ttl_seconds);
    return token;
  }

  /** Invalidate cached decrypted token (called on author key rotation). */
  async invalidateToken(modelId: string): Promise<void> {
    await this.tokenCache.del(`replicate_token:${modelId}`);
  }

  async listModels(): Promise<ModelMeta[]> {
    // Production models live in ai_models table — admin Replicate account
    // is only used for health probe / admin UI sandbox.
    return [];
  }

  /**
   * Validate that a cog model exists and exposes an OpenAPI schema.
   * Used during author onboarding (Plan 07) to reject broken model submissions.
   */
  async validateCog(
    owner: string,
    name: string,
    token: string,
  ): Promise<{ ok: boolean; schema?: unknown; error?: string }> {
    try {
      const url = new URL(`models/${owner}/${name}`, this.config.baseUrl).toString();
      const res = await (this.config.fetch ?? fetch)(url, {
        headers: { authorization: `Token ${token}` },
      });
      if (!res.ok) return { ok: false, error: `HTTP ${res.status}` };
      const data = (await res.json()) as {
        latest_version?: { openapi_schema?: unknown };
      };
      if (!data.latest_version?.openapi_schema) {
        return { ok: false, error: 'no openapi_schema' };
      }
      return { ok: true, schema: data.latest_version.openapi_schema };
    } catch (err) {
      return { ok: false, error: (err as Error).message };
    }
  }

  private async submitPrediction(
    input: Record<string, unknown>,
    opts: InvokeOptsWithMeta,
  ): Promise<AsyncJobHandle> {
    const model = opts.model_meta;
    if (!model) {
      throw new Error('replicate.submitPrediction requires opts.model_meta (ReplicateModelMeta)');
    }
    const token = await this.tokenForModel(model);
    const url = new URL('predictions', this.config.baseUrl).toString();
    const res = await (this.config.fetch ?? fetch)(url, {
      method: 'POST',
      headers: {
        authorization: `Token ${token}`,
        'content-type': 'application/json',
        'x-request-id': opts.request_id,
      },
      body: JSON.stringify({
        version: model.config.replicate_version,
        input,
      }),
    });
    if (!res.ok) {
      const { translateError } = await import('../base/error-translation');
      throw await translateError(res, this.name);
    }
    const data = (await res.json()) as {
      id: string;
      status: string;
      urls?: { get?: string };
    };
    return {
      task_id: data.id,
      poll_url: data.urls?.get,
    };
  }

  async imageGenerations(
    req: ImageRequest,
    opts: InvokeOptsWithMeta,
  ): Promise<AsyncJobHandle> {
    return this.submitPrediction(
      {
        prompt: req.prompt,
        negative_prompt: req.negative_prompt,
        num_outputs: req.n ?? 1,
        seed: req.seed,
        image: req.reference_image_url,
      },
      opts,
    );
  }

  async videoGenerations(
    req: VideoRequest,
    opts: InvokeOptsWithMeta,
  ): Promise<AsyncJobHandle> {
    return this.submitPrediction(
      {
        prompt: req.prompt,
        duration: req.duration_s,
        aspect_ratio: req.aspect_ratio,
        image: req.image_url,
      },
      opts,
    );
  }

  async pollAsync(task_id: string, opts: InvokeOptsWithMeta): Promise<AsyncJobResult> {
    const model = opts.model_meta;
    if (!model) {
      throw new Error('replicate.pollAsync requires opts.model_meta for token lookup');
    }
    const token = await this.tokenForModel(model);
    const url = new URL(`predictions/${task_id}`, this.config.baseUrl).toString();
    const res = await (this.config.fetch ?? fetch)(url, {
      headers: { authorization: `Token ${token}` },
    });
    if (!res.ok) {
      return { status: 'failed', error: `HTTP ${res.status}` };
    }
    const data = (await res.json()) as {
      status: 'starting' | 'processing' | 'succeeded' | 'failed' | 'canceled';
      output?: unknown;
      error?: string;
    };
    if (data.status === 'succeeded') {
      return { status: 'completed', output: data.output };
    }
    if (data.status === 'failed' || data.status === 'canceled') {
      return { status: 'failed', error: data.error ?? data.status };
    }
    return { status: 'pending' };
  }

  async healthCheck(): Promise<HealthStatus> {
    const start = Date.now();
    if (!this.admin_token) {
      return {
        status: 'degraded',
        latency_ms: 0,
        checked_at: new Date().toISOString(),
        last_error: 'no admin_token configured (health probe skipped)',
      };
    }
    try {
      const url = new URL('account', this.config.baseUrl).toString();
      const res = await (this.config.fetch ?? fetch)(url, {
        headers: { authorization: `Token ${this.admin_token}` },
      });
      return {
        status: res.ok ? 'healthy' : 'unhealthy',
        latency_ms: Date.now() - start,
        checked_at: new Date().toISOString(),
        last_error: res.ok ? undefined : `status ${res.status}`,
      };
    } catch (err) {
      return {
        status: 'unhealthy',
        latency_ms: Date.now() - start,
        checked_at: new Date().toISOString(),
        last_error: (err as Error).message,
      };
    }
  }

  async estimateCost(
    req: Record<string, unknown>,
    model: ModelMeta,
  ): Promise<CostEstimate> {
    // Pass-through: what the client is charged IS the revenue. Author owns
    // Replicate billing; AIAG commission is computed monthly by settlement worker.
    const p = model.pricing ?? {};
    let revenue_usd = 0;
    if (p.per_image) {
      revenue_usd += p.per_image * ((req.n as number | undefined) ?? 1);
    }
    if (p.per_second) {
      revenue_usd += p.per_second * ((req.duration_s as number | undefined) ?? 0);
    }
    if (p.per_call) revenue_usd += p.per_call;
    // markup stays at 1.0 — client pays market price, commission to AIAG is
    // tracked out-of-band via the monthly settlement worker.
    const credits = Math.round(revenue_usd * this.usd_rate * 100) / 100;
    return {
      credits,
      upstream_cost_usd: revenue_usd,
      breakdown: { upstream: revenue_usd, markup: 1.0, usd_rate: this.usd_rate },
    };
  }

  async computeActualCost(
    usage: Parameters<UpstreamAdapterBase['computeActualCost']>[0],
    model: ModelMeta,
  ): Promise<CostEstimate> {
    // For pass-through we re-run estimateCost against the actual usage.
    return this.estimateCost(
      {
        n: usage.images,
        duration_s: usage.seconds,
      },
      model,
    );
  }

  async pricingSync(): Promise<Array<{ model_id: string; pricing: NonNullable<ModelMeta['pricing']> }>> {
    // Author-set pricing — nothing to sync from Replicate.
    return [];
  }
}
