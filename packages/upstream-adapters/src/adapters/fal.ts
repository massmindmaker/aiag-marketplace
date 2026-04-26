/**
 * Fal.ai adapter — media (image/video) generation with async polling + webhooks.
 *
 * API docs: https://fal.ai/docs/
 * - Submit: POST https://queue.fal.run/<model_id>  (with optional ?fal_webhook=...)
 *   → { request_id, status_url, response_url }
 * - Poll: GET <status_url>  → { status: IN_QUEUE | IN_PROGRESS | COMPLETED | FAILED }
 * - Result: GET <response_url>  (when COMPLETED)
 * - Auth: `Authorization: Key <FAL_KEY>`
 *
 * Required env:
 *   FAL_KEY            — key-id:key-secret
 *   FAL_WEBHOOK_URL    — optional, our receiver endpoint
 */
import { UpstreamAdapterBase, type AdapterConfig } from '../base/UpstreamAdapterBase';
import type {
  AsyncJobHandle,
  AsyncJobResult,
  HealthStatus,
  ImageRequest,
  Modality,
  ModelMeta,
  UpstreamInvokeOptions,
  VideoRequest,
} from '../base/UpstreamAdapter';
import type { S3Uploader } from '../s3-upload';
import { mirrorMediaToS3 } from '../s3-upload';

export interface FalConfig extends Omit<AdapterConfig, 'baseUrl' | 'auth_scheme'> {
  baseUrl?: string;
  webhook_url?: string;
  /** Optional S3 uploader — when provided, completed media is mirrored to our bucket. */
  s3Uploader?: S3Uploader;
  /** Key prefix for S3 uploads (default: 'fal/{date}/'). */
  s3Prefix?: string;
}

interface FalSubmitResponse {
  request_id: string;
  status_url: string;
  response_url: string;
  cancel_url?: string;
}

interface FalStatusResponse {
  status: 'IN_QUEUE' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  request_id: string;
  queue_position?: number;
  response_url?: string;
  logs?: Array<{ message: string; level: string; timestamp: string }>;
  error?: string;
}

export class FalAdapter extends UpstreamAdapterBase {
  readonly name = 'fal';
  readonly supports_modalities: readonly Modality[] = ['image', 'video'];
  private webhook_url?: string;
  private s3Uploader?: S3Uploader;
  private s3Prefix: string;

  constructor(cfg: FalConfig) {
    super({
      baseUrl: cfg.baseUrl ?? 'https://queue.fal.run/',
      apiKey: cfg.apiKey,
      markup: cfg.markup,
      usd_rate: cfg.usd_rate,
      userAgent: cfg.userAgent ?? 'AIAG-Fal/0.5',
      default_timeout_ms: cfg.default_timeout_ms ?? 30_000,
      fetch: cfg.fetch,
      auth_scheme: 'none', // we set Authorization: Key <key> manually
      extra_headers: cfg.extra_headers,
      retry: cfg.retry,
    });
    this.webhook_url = cfg.webhook_url;
    this.s3Uploader = cfg.s3Uploader;
    this.s3Prefix = cfg.s3Prefix ?? `fal/${new Date().toISOString().slice(0, 10)}/`;
  }

  protected buildHeaders(apiKey: string, overrides?: Record<string, string>) {
    const h = super.buildHeaders(apiKey, overrides);
    h['authorization'] = `Key ${apiKey}`;
    return h;
  }

  /**
   * Fal has no public models list endpoint — we keep a curated catalog.
   * Admin UI imports from this list + allows custom model IDs.
   */
  async listModels(): Promise<ModelMeta[]> {
    return CURATED_FAL_MODELS;
  }

  async imageGenerations(
    req: ImageRequest,
    opts: UpstreamInvokeOptions,
  ): Promise<AsyncJobHandle> {
    return this.submitAsync(req.model, {
      prompt: req.prompt,
      negative_prompt: req.negative_prompt,
      image_size: req.size,
      num_images: req.n ?? 1,
      seed: req.seed,
      image_url: req.reference_image_url,
    }, opts);
  }

  async videoGenerations(
    req: VideoRequest,
    opts: UpstreamInvokeOptions,
  ): Promise<AsyncJobHandle> {
    return this.submitAsync(req.model, {
      prompt: req.prompt,
      duration: req.duration_s,
      aspect_ratio: req.aspect_ratio,
      image_url: req.image_url,
    }, opts);
  }

  private async submitAsync(
    modelId: string,
    body: Record<string, unknown>,
    opts: UpstreamInvokeOptions,
  ): Promise<AsyncJobHandle> {
    const path = this.webhook_url
      ? `${modelId}?fal_webhook=${encodeURIComponent(this.webhook_url)}`
      : modelId;
    const res = await this.request({
      path,
      method: 'POST',
      body,
      byok_key: opts.byok_key,
      timeout_ms: opts.timeout_ms,
      headers: { 'x-request-id': opts.request_id },
    });
    const data = (await res.json()) as FalSubmitResponse;
    return {
      task_id: data.request_id,
      poll_url: data.status_url,
    };
  }

  async pollAsync(task_id: string, opts: UpstreamInvokeOptions): Promise<AsyncJobResult> {
    // poll_url must be provided; fallback to status endpoint (requires model id)
    const poll_url = (opts as UpstreamInvokeOptions & { poll_url?: string }).poll_url;
    if (!poll_url) {
      throw new Error('fal.pollAsync requires poll_url in opts (from submit response)');
    }
    const statusRes = await this.request({
      path: poll_url,
      method: 'GET',
      no_retry: true,
    });
    const status = (await statusRes.json()) as FalStatusResponse;
    if (status.status === 'COMPLETED') {
      const resultUrl = status.response_url ?? poll_url.replace('/status', '');
      const resultRes = await this.request({ path: resultUrl, method: 'GET', no_retry: true });
      const output = (await resultRes.json()) as Record<string, unknown>;
      // If S3 uploader configured, mirror media URLs to our bucket
      if (this.s3Uploader) {
        const mirrored = await this.mirrorOutputToS3(output, task_id);
        return { status: 'completed', output: mirrored };
      }
      return { status: 'completed', output };
    }
    if (status.status === 'FAILED') {
      return { status: 'failed', error: status.error ?? 'fal job failed' };
    }
    return { status: 'pending' };
  }

  /**
   * Mirror provider-hosted media URLs in the Fal output to our S3 bucket.
   * Supports common Fal response shapes: { images: [{ url }] }, { video: { url } }, etc.
   */
  private async mirrorOutputToS3(
    output: Record<string, unknown>,
    task_id: string,
  ): Promise<Record<string, unknown>> {
    const urls = extractMediaUrls(output);
    if (urls.length === 0) return output;

    const mirrored: Record<string, string> = {};
    for (let i = 0; i < urls.length; i++) {
      const src = urls[i];
      const ext = src.split('?')[0].split('.').pop() ?? 'bin';
      const destKey = `${this.s3Prefix}${task_id}/${i}.${ext}`;
      try {
        const res = await mirrorMediaToS3(this.s3Uploader!, src, destKey, this.config.fetch ?? fetch);
        mirrored[src] = res.url;
      } catch (err) {
        this.log.warn({ src, error: (err as Error).message }, 'S3 mirror failed, keeping upstream URL');
      }
    }

    return replaceUrlsInOutput(output, mirrored) as Record<string, unknown>;
  }

  async healthCheck(): Promise<HealthStatus> {
    // Fal doesn't expose /health; use a trivial model status (404 on missing req-id is fast).
    const start = Date.now();
    try {
      const apiKey = await this.getApiKey();
      // request a known-fake status — we only care that auth + network succeed.
      const url = new URL('fal-ai/fast-lightning-sdxl/requests/healthcheck-probe', this.config.baseUrl).toString();
      const res = await (this.config.fetch ?? fetch)(url, {
        method: 'GET',
        headers: { authorization: `Key ${apiKey}` },
      });
      // 404 means service is reachable, auth valid
      const ok = res.status < 500;
      return {
        status: ok ? 'healthy' : 'unhealthy',
        latency_ms: Date.now() - start,
        checked_at: new Date().toISOString(),
        last_error: ok ? undefined : `status ${res.status}`,
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
}

const CURATED_FAL_MODELS: ModelMeta[] = [
  {
    id: 'fal-ai/flux-pro/v1.1',
    name: 'FLUX.1.1 Pro',
    modality: 'image',
    pricing: { per_image: 0.04 },
    capabilities: { vision: false, streaming: false },
  },
  {
    id: 'fal-ai/kling-video/v1.5/pro/text-to-video',
    name: 'Kling 1.5 Pro',
    modality: 'video',
    pricing: { per_second: 0.2 },
  },
  {
    id: 'fal-ai/fast-lightning-sdxl',
    name: 'Fast Lightning SDXL',
    modality: 'image',
    pricing: { per_image: 0.003 },
  },
];

/** Recursively collect HTTP(S) URLs that look like media assets. */
function extractMediaUrls(obj: unknown): string[] {
  const urls: string[] = [];
  if (typeof obj === 'string' && /^https?:\/\//.test(obj) && /\.(png|jpe?g|gif|webp|mp4|webm|mov|wav|mp3|ogg)/i.test(obj)) {
    urls.push(obj);
  } else if (Array.isArray(obj)) {
    for (const item of obj) urls.push(...extractMediaUrls(item));
  } else if (obj && typeof obj === 'object') {
    for (const v of Object.values(obj)) urls.push(...extractMediaUrls(v));
  }
  return urls;
}

/** Deep-clone an object, replacing every occurrence of oldUrl with newUrl. */
function replaceUrlsInOutput(obj: unknown, map: Record<string, string>): unknown {
  if (typeof obj === 'string') {
    return map[obj] ?? obj;
  }
  if (Array.isArray(obj)) {
    return obj.map((item) => replaceUrlsInOutput(item, map));
  }
  if (obj && typeof obj === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
      out[k] = replaceUrlsInOutput(v, map);
    }
    return out;
  }
  return obj;
}
