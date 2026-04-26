import { translateError } from './error-translation';
import { withRetry, type RetryOptions } from './retry';
import { createLogger, type Logger } from './logger';
import type {
  CostEstimate,
  HealthStatus,
  Modality,
  ModelMeta,
  ModelPricing,
  UpstreamAdapter,
  UsageBreakdown,
} from './UpstreamAdapter';

export type ApiKeyResolver = string | (() => string | Promise<string>);

export interface AdapterConfig {
  baseUrl: string;
  apiKey: ApiKeyResolver;
  markup?: number;
  usd_rate?: number;
  userAgent?: string;
  default_timeout_ms?: number;
  /** Override fetch (tests) */
  fetch?: typeof fetch;
  /** Auth header style: Bearer (default) | x-api-key | custom */
  auth_scheme?: 'bearer' | 'x-api-key' | 'none';
  extra_headers?: Record<string, string>;
  retry?: RetryOptions;
}

export interface RequestOptions {
  path: string;
  method?: string;
  headers?: Record<string, string>;
  body?: unknown;
  timeout_ms?: number;
  byok_key?: string;
  signal?: AbortSignal;
  no_retry?: boolean;
  /** Treat response as stream — do NOT consume body, return Response directly */
  stream?: boolean;
}

export abstract class UpstreamAdapterBase implements UpstreamAdapter {
  abstract readonly name: string;
  abstract readonly supports_modalities: readonly Modality[];
  abstract listModels(): Promise<ModelMeta[]>;
  abstract healthCheck(): Promise<HealthStatus>;

  protected log: Logger;
  protected readonly markup: number;
  protected readonly usd_rate: number;
  private readonly _fetch: typeof fetch;

  constructor(protected config: AdapterConfig) {
    this.log = createLogger(this.constructor.name);
    this.markup = config.markup ?? 1.2;
    this.usd_rate = config.usd_rate ?? Number(process.env.USD_RUB_RATE ?? 95);
    this._fetch = config.fetch ?? fetch;
  }

  protected async getApiKey(byok?: string): Promise<string> {
    if (byok) return byok;
    const raw = this.config.apiKey;
    return typeof raw === 'function' ? await raw() : raw;
  }

  protected buildHeaders(
    apiKey: string,
    overrides?: Record<string, string>,
  ): Record<string, string> {
    const h: Record<string, string> = {
      'user-agent': this.config.userAgent ?? 'AIAG/0.5',
      ...(this.config.extra_headers ?? {}),
    };
    const scheme = this.config.auth_scheme ?? 'bearer';
    if (scheme === 'bearer') h['authorization'] = `Bearer ${apiKey}`;
    else if (scheme === 'x-api-key') h['x-api-key'] = apiKey;
    if (overrides) Object.assign(h, overrides);
    return h;
  }

  protected async request(opts: RequestOptions): Promise<Response> {
    const apiKey = await this.getApiKey(opts.byok_key);
    const baseHeaders = this.buildHeaders(apiKey, opts.headers);
    const timeout = opts.timeout_ms ?? this.config.default_timeout_ms ?? 60_000;

    const url = new URL(opts.path, this.config.baseUrl).toString();

    const exec = async (): Promise<Response> => {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), timeout);
      const upstream_signal = opts.signal;
      if (upstream_signal) {
        upstream_signal.addEventListener('abort', () => ctrl.abort(), { once: true });
      }
      try {
        const init: RequestInit = {
          method: opts.method ?? 'GET',
          headers: baseHeaders,
          signal: ctrl.signal,
        };
        if (opts.body !== undefined && opts.body !== null) {
          if (typeof opts.body === 'string' || opts.body instanceof ArrayBuffer) {
            init.body = opts.body as NonNullable<RequestInit['body']>;
          } else {
            init.body = JSON.stringify(opts.body);
            (init.headers as Record<string, string>)['content-type'] ??= 'application/json';
          }
        }
        const res = await this._fetch(url, init);
        if (!res.ok) throw await translateError(res, this.name);
        return res;
      } finally {
        clearTimeout(timer);
      }
    };

    if (opts.no_retry) return exec();
    return withRetry(exec, this.config.retry);
  }

  /**
   * Default cost computation: markup + USD→RUB conversion.
   * Adapters may override for batch discounts / per-second billing.
   */
  async computeActualCost(
    usage: UsageBreakdown,
    model: ModelMeta,
    markup: number = this.markup,
  ): Promise<CostEstimate> {
    const p: ModelPricing = model.pricing ?? {};
    let upstream = 0;
    if (p.input_per_1k && usage.input_tokens) {
      upstream += (usage.input_tokens / 1000) * p.input_per_1k;
    }
    if (p.output_per_1k && usage.output_tokens) {
      upstream += (usage.output_tokens / 1000) * p.output_per_1k;
    }
    if (p.per_image && usage.images) upstream += p.per_image * usage.images;
    if (p.per_second && usage.seconds) upstream += p.per_second * usage.seconds;
    if (p.per_call) upstream += p.per_call;
    const final_usd = upstream * markup;
    const credits = Math.round(final_usd * this.usd_rate * 100) / 100;
    return {
      credits,
      upstream_cost_usd: upstream,
      breakdown: {
        upstream,
        markup,
        usd_rate: this.usd_rate,
      },
    };
  }

  async estimateCost(
    req: Record<string, unknown>,
    model: ModelMeta,
  ): Promise<CostEstimate> {
    // Conservative upper-bound: use max_tokens if provided, else context_length/2
    const maxOut = (req.max_tokens as number) ?? Math.floor((model.context_length ?? 2048) / 2);
    const estimatedInput = estimateInputTokens(req);
    return this.computeActualCost(
      { input_tokens: estimatedInput, output_tokens: maxOut },
      model,
    );
  }
}

function estimateInputTokens(req: Record<string, unknown>): number {
  const messages = req.messages as Array<{ content: unknown }> | undefined;
  if (!messages) {
    const prompt = (req.prompt ?? req.input) as string | undefined;
    return prompt ? Math.ceil(prompt.length / 4) : 0;
  }
  let chars = 0;
  for (const m of messages) {
    if (typeof m.content === 'string') chars += m.content.length;
    else if (Array.isArray(m.content)) chars += JSON.stringify(m.content).length;
  }
  return Math.ceil(chars / 4);
}
