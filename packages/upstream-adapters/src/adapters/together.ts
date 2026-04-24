/**
 * Together.ai adapter — OSS LLMs, embeddings, vision.
 *
 * API docs: https://docs.together.ai/reference
 * - Chat: POST /v1/chat/completions (OpenAI-compatible, supports streaming)
 * - Embeddings: POST /v1/embeddings
 * - Models: GET /v1/models
 * - Auth: Bearer <TOGETHER_API_KEY>
 *
 * Required env:
 *   TOGETHER_API_KEY
 */
import { UpstreamAdapterBase, type AdapterConfig } from '../base/UpstreamAdapterBase';
import type {
  ChatCompletionRequest,
  EmbeddingRequest,
  HealthStatus,
  Modality,
  ModelMeta,
  UpstreamInvokeOptions,
} from '../base/UpstreamAdapter';

export interface TogetherConfig extends Omit<AdapterConfig, 'baseUrl'> {
  baseUrl?: string;
}

interface TogetherModelRaw {
  id: string;
  display_name?: string;
  context_length?: number;
  type?: string;
  pricing?: { input?: number; output?: number; hourly?: number; base?: number };
}

export class TogetherAdapter extends UpstreamAdapterBase {
  readonly name = 'together';
  readonly supports_modalities: readonly Modality[] = ['chat', 'embedding', 'multimodal'];

  constructor(cfg: TogetherConfig) {
    super({
      baseUrl: cfg.baseUrl ?? 'https://api.together.xyz/v1/',
      apiKey: cfg.apiKey,
      markup: cfg.markup,
      usd_rate: cfg.usd_rate,
      userAgent: cfg.userAgent ?? 'AIAG-Together/0.5',
      default_timeout_ms: cfg.default_timeout_ms ?? 120_000,
      fetch: cfg.fetch,
      auth_scheme: 'bearer',
      retry: cfg.retry,
    });
  }

  async listModels(): Promise<ModelMeta[]> {
    const res = await this.request({ path: 'models', method: 'GET' });
    const data = (await res.json()) as TogetherModelRaw[];
    return data.map((m) => ({
      id: m.id,
      name: m.display_name ?? m.id,
      context_length: m.context_length,
      modality: mapType(m.type),
      pricing: {
        // Together pricing is per-token in USD
        input_per_1k: m.pricing?.input,
        output_per_1k: m.pricing?.output,
      },
      capabilities: {
        streaming: m.type !== 'embedding',
        tools: /llama-3|mixtral/i.test(m.id),
        vision: /vision|llava/i.test(m.id),
      },
      raw: m as unknown as Record<string, unknown>,
    }));
  }

  async chatCompletions(
    req: ChatCompletionRequest,
    opts: UpstreamInvokeOptions,
  ): Promise<Response> {
    return this.request({
      path: 'chat/completions',
      method: 'POST',
      body: { ...req, stream: opts.stream ?? req.stream ?? false },
      byok_key: opts.byok_key,
      timeout_ms: opts.timeout_ms,
      signal: opts.signal,
      headers: { 'x-request-id': opts.request_id },
      stream: opts.stream ?? req.stream,
    });
  }

  async embeddings(req: EmbeddingRequest, opts: UpstreamInvokeOptions): Promise<Response> {
    return this.request({
      path: 'embeddings',
      method: 'POST',
      body: req,
      byok_key: opts.byok_key,
      timeout_ms: opts.timeout_ms,
      headers: { 'x-request-id': opts.request_id },
    });
  }

  async healthCheck(): Promise<HealthStatus> {
    const start = Date.now();
    try {
      const res = await this.request({ path: 'models', method: 'GET', no_retry: true, timeout_ms: 10_000 });
      await res.json();
      return { status: 'healthy', latency_ms: Date.now() - start, checked_at: new Date().toISOString() };
    } catch (err) {
      return {
        status: 'unhealthy',
        latency_ms: Date.now() - start,
        checked_at: new Date().toISOString(),
        last_error: (err as Error).message,
      };
    }
  }
}

function mapType(t?: string): Modality {
  if (t === 'embedding') return 'embedding';
  if (t === 'image') return 'image';
  if (t === 'moderation') return 'chat';
  return 'chat';
}
