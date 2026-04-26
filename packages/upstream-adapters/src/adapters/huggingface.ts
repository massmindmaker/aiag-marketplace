/**
 * HuggingFace Inference API adapter — secondary OSS backup per Plan 05 Task 9.
 *
 * API: https://huggingface.co/docs/api-inference/
 * - Base: https://api-inference.huggingface.co
 * - Chat completions (router endpoint, OpenAI-compatible for supported models):
 *     POST /models/{model_id}/v1/chat/completions
 * - Embeddings: POST /models/{model_id}/pipeline/feature-extraction
 * - Image-to-text / text-to-image: POST /models/{model_id} with raw body
 * - Auth: `Authorization: Bearer hf_***`
 *
 * Notes:
 * - HF free tier is often cold-started / rate-limited — default timeout 90s.
 * - No pricing API; admin fills via manual import (Task 13).
 * - Markup 1.40-1.45 budget buffer (set by caller; default 1.4).
 */
import { UpstreamAdapterBase, type AdapterConfig } from '../base/UpstreamAdapterBase';
import type {
  ChatCompletionRequest,
  CostEstimate,
  EmbeddingRequest,
  HealthStatus,
  ImageRequest,
  Modality,
  ModelMeta,
  UpstreamInvokeOptions,
} from '../base/UpstreamAdapter';

export interface HuggingFaceConfig extends Omit<AdapterConfig, 'baseUrl' | 'auth_scheme'> {
  baseUrl?: string;
}

export class HuggingFaceAdapter extends UpstreamAdapterBase {
  readonly name = 'huggingface';
  readonly supports_modalities: readonly Modality[] = ['chat', 'embedding', 'image'];

  constructor(cfg: HuggingFaceConfig) {
    super({
      baseUrl: cfg.baseUrl ?? 'https://api-inference.huggingface.co',
      apiKey: cfg.apiKey,
      markup: cfg.markup ?? 1.4,
      usd_rate: cfg.usd_rate,
      userAgent: cfg.userAgent ?? 'AIAG-HF/0.5',
      // HF cold-starts can take tens of seconds; bump default timeout.
      default_timeout_ms: cfg.default_timeout_ms ?? 90_000,
      fetch: cfg.fetch,
      auth_scheme: 'bearer',
      extra_headers: cfg.extra_headers,
      retry: cfg.retry,
    });
  }

  async listModels(): Promise<ModelMeta[]> {
    // HF hub is vast — admin picks specific models via import UI (Plan 05 Task 13).
    return [];
  }

  async chatCompletions(
    req: ChatCompletionRequest,
    opts: UpstreamInvokeOptions,
  ): Promise<Response> {
    return this.request({
      path: `/models/${encodeURIComponent(req.model)}/v1/chat/completions`,
      method: 'POST',
      body: {
        model: req.model,
        messages: req.messages,
        max_tokens: req.max_tokens,
        temperature: req.temperature,
        top_p: req.top_p,
        stream: !!opts.stream,
      },
      byok_key: opts.byok_key,
      signal: opts.signal,
      timeout_ms: opts.timeout_ms,
      stream: !!opts.stream,
      headers: { 'x-request-id': opts.request_id },
    });
  }

  async embeddings(
    req: EmbeddingRequest,
    opts: UpstreamInvokeOptions,
  ): Promise<Response> {
    return this.request({
      path: `/models/${encodeURIComponent(req.model)}/pipeline/feature-extraction`,
      method: 'POST',
      body: { inputs: req.input },
      byok_key: opts.byok_key,
      timeout_ms: opts.timeout_ms,
      headers: { 'x-request-id': opts.request_id },
    });
  }

  /**
   * Text-to-image — HF returns binary (image/*) on success. We return the
   * raw Response so the gateway can stream the blob to S3 and build the
   * final URL itself (S3 upload helper is gateway-side).
   */
  async imageGenerations(
    req: ImageRequest,
    opts: UpstreamInvokeOptions,
  ): Promise<Response> {
    return this.request({
      path: `/models/${encodeURIComponent(req.model)}`,
      method: 'POST',
      body: {
        inputs: req.prompt,
        parameters: {
          negative_prompt: req.negative_prompt,
          num_inference_steps: 30,
          seed: req.seed,
        },
      },
      byok_key: opts.byok_key,
      timeout_ms: opts.timeout_ms ?? 120_000,
      headers: { 'x-request-id': opts.request_id, accept: 'image/png' },
    });
  }

  async healthCheck(): Promise<HealthStatus> {
    const start = Date.now();
    try {
      const apiKey = await this.getApiKey();
      const url = new URL('/api/whoami-v2', 'https://huggingface.co').toString();
      const res = await (this.config.fetch ?? fetch)(url, {
        headers: { authorization: `Bearer ${apiKey}` },
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

  /**
   * HF has no pricing API. estimateCost uses model.pricing if admin filled
   * it in manually; otherwise returns 0 credits (caller should warn).
   */
  async estimateCost(
    req: Record<string, unknown>,
    model: ModelMeta,
  ): Promise<CostEstimate> {
    if (!model.pricing) {
      this.log.warn(
        { model: model.id },
        'HF model has no pricing — admin must fill manually',
      );
      return {
        credits: 0,
        upstream_cost_usd: 0,
        breakdown: { upstream: 0, markup: this.markup, usd_rate: this.usd_rate },
      };
    }
    return super.estimateCost(req, model);
  }

  async pricingSync(): Promise<Array<{ model_id: string; pricing: NonNullable<ModelMeta['pricing']> }>> {
    return [];
  }
}
