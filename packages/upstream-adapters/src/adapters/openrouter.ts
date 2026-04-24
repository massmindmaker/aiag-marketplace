/**
 * OpenRouter adapter — primary closed-LLM channel.
 *
 * API docs: https://openrouter.ai/docs/api-reference
 * - Chat completions: POST /api/v1/chat/completions (OpenAI-compatible)
 * - Models list: GET /api/v1/models
 * - Streaming: SSE (text/event-stream) when `stream: true`
 * - Auth: `Authorization: Bearer sk-or-v1-...`
 * - Optional HTTP-Referer / X-Title headers for attribution
 *
 * Required env:
 *   OPENROUTER_API_KEY   — admin account sk-or-v1-...
 *   OPENROUTER_APP_URL   — optional, sent as HTTP-Referer
 *   OPENROUTER_APP_NAME  — optional, sent as X-Title
 */
import { UpstreamAdapterBase, type AdapterConfig } from '../base/UpstreamAdapterBase';
import type {
  ChatCompletionRequest,
  HealthStatus,
  Modality,
  ModelMeta,
  UpstreamInvokeOptions,
} from '../base/UpstreamAdapter';

export interface OpenRouterConfig extends Omit<AdapterConfig, 'baseUrl'> {
  baseUrl?: string;
  app_url?: string;
  app_name?: string;
}

interface OpenRouterModelRaw {
  id: string;
  name?: string;
  context_length?: number;
  pricing?: { prompt?: string; completion?: string; image?: string };
  architecture?: { modality?: string };
  top_provider?: Record<string, unknown>;
}

export class OpenRouterAdapter extends UpstreamAdapterBase {
  readonly name = 'openrouter';
  readonly supports_modalities: readonly Modality[] = ['chat', 'multimodal'];

  constructor(cfg: OpenRouterConfig) {
    const extra: Record<string, string> = { ...(cfg.extra_headers ?? {}) };
    if (cfg.app_url) extra['http-referer'] = cfg.app_url;
    if (cfg.app_name) extra['x-title'] = cfg.app_name;
    super({
      baseUrl: cfg.baseUrl ?? 'https://openrouter.ai/api/v1/',
      apiKey: cfg.apiKey,
      markup: cfg.markup,
      usd_rate: cfg.usd_rate,
      userAgent: cfg.userAgent ?? 'AIAG-OpenRouter/0.5',
      default_timeout_ms: cfg.default_timeout_ms ?? 120_000,
      fetch: cfg.fetch,
      auth_scheme: 'bearer',
      extra_headers: extra,
      retry: cfg.retry,
    });
  }

  async listModels(): Promise<ModelMeta[]> {
    const res = await this.request({ path: 'models', method: 'GET' });
    const data = (await res.json()) as { data: OpenRouterModelRaw[] };
    return data.data.map((m) => ({
      id: m.id,
      name: m.name ?? m.id,
      context_length: m.context_length,
      modality: mapModality(m.architecture?.modality),
      pricing: {
        input_per_1k: m.pricing?.prompt ? Number(m.pricing.prompt) * 1000 : undefined,
        output_per_1k: m.pricing?.completion ? Number(m.pricing.completion) * 1000 : undefined,
        per_image: m.pricing?.image ? Number(m.pricing.image) : undefined,
      },
      capabilities: { streaming: true, tools: true, vision: m.architecture?.modality === 'multimodal' },
      raw: m as unknown as Record<string, unknown>,
    }));
  }

  async chatCompletions(
    req: ChatCompletionRequest,
    opts: UpstreamInvokeOptions,
  ): Promise<Response> {
    const payload = { ...req, stream: opts.stream ?? req.stream ?? false };
    return this.request({
      path: 'chat/completions',
      method: 'POST',
      body: payload,
      byok_key: opts.byok_key,
      timeout_ms: opts.timeout_ms,
      signal: opts.signal,
      headers: { 'x-request-id': opts.request_id },
      stream: payload.stream,
    });
  }

  async healthCheck(): Promise<HealthStatus> {
    const start = Date.now();
    try {
      const res = await this.request({ path: 'models', method: 'GET', no_retry: true, timeout_ms: 10_000 });
      await res.json();
      return {
        status: 'healthy',
        latency_ms: Date.now() - start,
        checked_at: new Date().toISOString(),
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

  async pricingSync() {
    const models = await this.listModels();
    return models
      .filter((m) => m.pricing && (m.pricing.input_per_1k || m.pricing.output_per_1k))
      .map((m) => ({ model_id: m.id, pricing: m.pricing! }));
  }
}

function mapModality(raw?: string): Modality {
  switch (raw) {
    case 'multimodal':
      return 'multimodal';
    case 'text->image':
    case 'image':
      return 'image';
    case 'embedding':
      return 'embedding';
    default:
      return 'chat';
  }
}
