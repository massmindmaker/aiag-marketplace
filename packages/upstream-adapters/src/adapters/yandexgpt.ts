/**
 * YandexGPT adapter — Yandex Cloud Foundation Models.
 *
 * API docs: https://yandex.cloud/docs/foundation-models/api-ref/
 * - Completion: POST https://llm.api.cloud.yandex.net/foundationModels/v1/completion
 * - Async completion: POST .../completionAsync
 * - Embeddings: POST .../textEmbedding
 * - Auth: `Authorization: Bearer <IAM_TOKEN>` (short-lived, refreshed by YandexIamTokenManager)
 * - Model URI: gpt://<folder_id>/yandexgpt/latest, gpt://<folder_id>/yandexgpt-lite/latest
 *
 * Required env:
 *   YC_SA_KEY_JSON       — JSON with service-account key
 *   YC_FOLDER_ID
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
import type { YandexIamTokenManager } from './yandex-iam';

export interface YandexGPTConfig extends Omit<AdapterConfig, 'apiKey' | 'baseUrl' | 'auth_scheme'> {
  iam: YandexIamTokenManager;
  folder_id: string;
  baseUrl?: string;
}

export class YandexGPTAdapter extends UpstreamAdapterBase {
  readonly name = 'yandexgpt';
  readonly supports_modalities: readonly Modality[] = ['chat', 'embedding'];
  private iam: YandexIamTokenManager;
  private folder_id: string;

  constructor(cfg: YandexGPTConfig) {
    super({
      baseUrl: cfg.baseUrl ?? 'https://llm.api.cloud.yandex.net/foundationModels/v1/',
      apiKey: async () => cfg.iam.getToken(),
      markup: cfg.markup,
      usd_rate: cfg.usd_rate,
      userAgent: cfg.userAgent ?? 'AIAG-YandexGPT/0.5',
      default_timeout_ms: cfg.default_timeout_ms ?? 60_000,
      fetch: cfg.fetch,
      auth_scheme: 'bearer',
      retry: cfg.retry,
    });
    this.iam = cfg.iam;
    this.folder_id = cfg.folder_id;
  }

  /** Hardcoded — Yandex doesn't expose a public catalog API. */
  async listModels(): Promise<ModelMeta[]> {
    const base = [
      { id: 'yandexgpt/latest', ctx: 32_000, rub_in: 1.2, rub_out: 1.2 },
      { id: 'yandexgpt-lite/latest', ctx: 32_000, rub_in: 0.2, rub_out: 0.2 },
      { id: 'yandexgpt-32k/latest', ctx: 32_000, rub_in: 1.2, rub_out: 1.2 },
    ];
    // per-1k RUB → USD (approximate). Pricing module handles exact conversion.
    return base.map((m) => ({
      id: `gpt://${this.folder_id}/${m.id}`,
      name: m.id,
      context_length: m.ctx,
      modality: 'chat' as const,
      pricing: { input_per_1k: m.rub_in / this.usd_rate, output_per_1k: m.rub_out / this.usd_rate },
      capabilities: { streaming: true, tools: false },
    }));
  }

  async chatCompletions(
    req: ChatCompletionRequest,
    opts: UpstreamInvokeOptions,
  ): Promise<Response> {
    // Translate OpenAI-style → YandexGPT format
    const body = {
      modelUri: req.model,
      completionOptions: {
        stream: opts.stream ?? req.stream ?? false,
        temperature: req.temperature ?? 0.6,
        maxTokens: String(req.max_tokens ?? 2000),
      },
      messages: req.messages.map((m) => ({
        role: m.role === 'assistant' ? 'assistant' : m.role === 'system' ? 'system' : 'user',
        text: typeof m.content === 'string' ? m.content : JSON.stringify(m.content),
      })),
    };
    return this.request({
      path: 'completion',
      method: 'POST',
      body,
      byok_key: opts.byok_key,
      timeout_ms: opts.timeout_ms,
      signal: opts.signal,
      headers: {
        'x-folder-id': this.folder_id,
        'x-request-id': opts.request_id,
      },
      stream: body.completionOptions.stream,
    });
  }

  async embeddings(req: EmbeddingRequest, opts: UpstreamInvokeOptions): Promise<Response> {
    const inputs = Array.isArray(req.input) ? req.input : [req.input];
    // Yandex embeddings take a single `text` per request — batch on caller side.
    const body = { modelUri: req.model, text: inputs[0] };
    return this.request({
      path: 'textEmbedding',
      method: 'POST',
      body,
      byok_key: opts.byok_key,
      headers: { 'x-folder-id': this.folder_id },
    });
  }

  async healthCheck(): Promise<HealthStatus> {
    const start = Date.now();
    try {
      const token = await this.iam.getToken();
      // Trivial request — invalid model URI returns 400; means auth+network OK.
      const url = new URL('completion', this.config.baseUrl).toString();
      const res = await (this.config.fetch ?? fetch)(url, {
        method: 'POST',
        headers: {
          authorization: `Bearer ${token}`,
          'content-type': 'application/json',
          'x-folder-id': this.folder_id,
        },
        body: JSON.stringify({ modelUri: 'healthcheck', completionOptions: {}, messages: [] }),
      });
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
