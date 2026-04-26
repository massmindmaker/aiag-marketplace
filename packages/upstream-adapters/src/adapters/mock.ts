/**
 * Mock upstream adapter — returns fixed, deterministic responses for all
 * interface methods. Useful for local development, e2e tests, and CI
 * pipelines where real API keys are unavailable.
 */
import { UpstreamAdapterBase, type AdapterConfig } from '../base/UpstreamAdapterBase';
import type {
  AsyncJobHandle,
  AsyncJobResult,
  ChatCompletionRequest,
  ChatMessage,
  CostEstimate,
  EmbeddingRequest,
  HealthStatus,
  ImageRequest,
  Modality,
  ModelMeta,
  UpstreamInvokeOptions,
  UsageBreakdown,
  VideoRequest,
  AudioRequest,
} from '../base/UpstreamAdapter';

export interface MockAdapterConfig extends Omit<AdapterConfig, 'baseUrl' | 'apiKey'> {
  baseUrl?: string;
  /** Override the default model list */
  models?: ModelMeta[];
  /** Override the fixed chat response */
  chatResponse?: ChatMessage;
  /** Simulate latency (ms) */
  latencyMs?: number;
  /** Force every N-th request to fail (for resilience testing) */
  failEveryN?: number;
}

const DEFAULT_MODELS: ModelMeta[] = [
  {
    id: 'mock-gpt-4o',
    name: 'Mock GPT-4o',
    modality: 'chat',
    context_length: 128_000,
    pricing: { input_per_1k: 1.0, output_per_1k: 2.0 },
    capabilities: { streaming: true, tools: true, vision: true },
  },
  {
    id: 'mock-dall-e-3',
    name: 'Mock DALL·E 3',
    modality: 'image',
    pricing: { per_image: 2.0 },
    capabilities: { streaming: false, vision: true },
  },
  {
    id: 'mock-embedding-3',
    name: 'Mock Embedding 3',
    modality: 'embedding',
    pricing: { input_per_1k: 0.1 },
    capabilities: { streaming: false, embeddings: true },
  },
];

export class MockAdapter extends UpstreamAdapterBase {
  readonly name = 'mock';
  readonly supports_modalities: readonly Modality[] = ['chat', 'image', 'video', 'embedding', 'audio', 'multimodal'];

  private models: ModelMeta[];
  private chatResponse: ChatMessage;
  private latencyMs: number;
  private failEveryN?: number;
  private requestCount = 0;

  constructor(cfg: MockAdapterConfig = {}) {
    super({
      baseUrl: cfg.baseUrl ?? 'https://mock.aiag.ru',
      apiKey: 'mock-key',
      markup: cfg.markup,
      usd_rate: cfg.usd_rate,
      userAgent: cfg.userAgent ?? 'AIAG-Mock/0.5',
      default_timeout_ms: cfg.default_timeout_ms ?? 5_000,
      fetch: cfg.fetch,
      auth_scheme: 'none',
      extra_headers: cfg.extra_headers,
      retry: cfg.retry,
    });
    this.models = cfg.models ?? DEFAULT_MODELS;
    this.chatResponse = cfg.chatResponse ?? {
      role: 'assistant',
      content: 'This is a mock response from the MockAdapter.',
    };
    this.latencyMs = cfg.latencyMs ?? 0;
    this.failEveryN = cfg.failEveryN;
  }

  async listModels(): Promise<ModelMeta[]> {
    return structuredClone(this.models);
  }

  async chatCompletions(
    req: ChatCompletionRequest,
    opts: UpstreamInvokeOptions,
  ): Promise<Response> {
    this.maybeFail();
    await this.maybeSleep();

    const body = {
      id: `mock-chat-${opts.request_id}`,
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model: req.model,
      choices: [
        {
          index: 0,
          message: this.chatResponse,
          finish_reason: 'stop',
        },
      ],
      usage: {
        prompt_tokens: 10,
        completion_tokens: 10,
        total_tokens: 20,
      },
    };

    if (opts.stream) {
      // Minimal SSE stream
      const encoder = new TextEncoder();
      const chunks = [
        `data: ${JSON.stringify({ ...body, choices: [{ index: 0, delta: { role: 'assistant' }, finish_reason: null }] })}\n\n`,
        `data: ${JSON.stringify({ ...body, choices: [{ index: 0, delta: { content: this.chatResponse.content }, finish_reason: null }] })}\n\n`,
        'data: [DONE]\n\n',
      ];
      const stream = new ReadableStream({
        start(controller) {
          for (const c of chunks) controller.enqueue(encoder.encode(c));
          controller.close();
        },
      });
      return new Response(stream, {
        headers: { 'content-type': 'text/event-stream' },
      });
    }

    return new Response(JSON.stringify(body), {
      headers: { 'content-type': 'application/json' },
    });
  }

  async imageGenerations(
    _req: ImageRequest,
    opts: UpstreamInvokeOptions,
  ): Promise<AsyncJobHandle> {
    this.maybeFail();
    await this.maybeSleep();
    return {
      task_id: `mock-img-${opts.request_id}`,
      poll_url: `${this.config.baseUrl}/mock/poll/mock-img-${opts.request_id}`,
    };
  }

  async videoGenerations(
    _req: VideoRequest,
    opts: UpstreamInvokeOptions,
  ): Promise<AsyncJobHandle> {
    this.maybeFail();
    await this.maybeSleep();
    return {
      task_id: `mock-vid-${opts.request_id}`,
      poll_url: `${this.config.baseUrl}/mock/poll/mock-vid-${opts.request_id}`,
    };
  }

  async embeddings(
    req: EmbeddingRequest,
    _opts: UpstreamInvokeOptions,
  ): Promise<Response> {
    this.maybeFail();
    await this.maybeSleep();
    const inputs = Array.isArray(req.input) ? req.input : [req.input];
    const body = {
      object: 'list',
      data: inputs.map((_, i) => ({
        object: 'embedding',
        index: i,
        embedding: Array.from({ length: req.dimensions ?? 1536 }, (_, j) => Math.sin(i + j)),
      })),
      model: req.model,
      usage: { prompt_tokens: inputs.length * 4, total_tokens: inputs.length * 4 },
    };
    return new Response(JSON.stringify(body), {
      headers: { 'content-type': 'application/json' },
    });
  }

  async audioSpeech(_req: AudioRequest, _opts: UpstreamInvokeOptions): Promise<Response> {
    this.maybeFail();
    await this.maybeSleep();
    // Return a tiny synthetic WAV header
    const wavHeader = new Uint8Array([
      0x52, 0x49, 0x46, 0x46, 0x24, 0x00, 0x00, 0x00,
      0x57, 0x41, 0x56, 0x45, 0x66, 0x6d, 0x74, 0x20,
      0x10, 0x00, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00,
      0x44, 0xac, 0x00, 0x00, 0x88, 0x58, 0x01, 0x00,
      0x02, 0x00, 0x10, 0x00, 0x64, 0x61, 0x74, 0x61,
      0x00, 0x00, 0x00, 0x00,
    ]);
    return new Response(wavHeader, {
      headers: { 'content-type': 'audio/wav' },
    });
  }

  async audioTranscriptions(_req: AudioRequest, _opts: UpstreamInvokeOptions): Promise<Response> {
    this.maybeFail();
    await this.maybeSleep();
    const body = {
      text: 'This is a mock transcription.',
    };
    return new Response(JSON.stringify(body), {
      headers: { 'content-type': 'application/json' },
    });
  }

  async pollAsync(task_id: string, _opts: UpstreamInvokeOptions): Promise<AsyncJobResult> {
    this.maybeFail();
    await this.maybeSleep();
    if (task_id.startsWith('mock-img-')) {
      return {
        status: 'completed',
        output: { url: `${this.config.baseUrl}/mock/images/${task_id}.png` },
        usage: { images: 1 },
      };
    }
    if (task_id.startsWith('mock-vid-')) {
      return {
        status: 'completed',
        output: { url: `${this.config.baseUrl}/mock/videos/${task_id}.mp4` },
        usage: { seconds: 5 },
      };
    }
    return { status: 'pending' };
  }

  async healthCheck(): Promise<HealthStatus> {
    this.maybeFail();
    await this.maybeSleep();
    return {
      status: 'healthy',
      latency_ms: this.latencyMs,
      checked_at: new Date().toISOString(),
    };
  }

  async estimateCost(req: Record<string, unknown>, model: ModelMeta): Promise<CostEstimate> {
    return this.computeActualCost(
      {
        input_tokens: (req.messages as Array<unknown>)?.length ? 10 : undefined,
        output_tokens: 10,
        images: req.n as number | undefined,
        seconds: req.duration_s as number | undefined,
      },
      model,
    );
  }

  async computeActualCost(
    usage: UsageBreakdown,
    model: ModelMeta,
    markup?: number,
  ): Promise<CostEstimate> {
    // Mock always charges a flat 1.0 credit for simplicity in dev/tests
    const p = model.pricing ?? {};
    let upstream = 0;
    if (p.input_per_1k && usage.input_tokens) upstream += (usage.input_tokens / 1000) * p.input_per_1k;
    if (p.output_per_1k && usage.output_tokens) upstream += (usage.output_tokens / 1000) * p.output_per_1k;
    if (p.per_image && usage.images) upstream += p.per_image * usage.images;
    if (p.per_second && usage.seconds) upstream += p.per_second * usage.seconds;
    if (p.per_call) upstream += p.per_call;
    const final = upstream * (markup ?? this.markup);
    const credits = final > 0 ? Math.round(final * this.usd_rate * 100) / 100 : 1.0;
    return {
      credits,
      upstream_cost_usd: upstream,
      breakdown: { upstream, markup: markup ?? this.markup, usd_rate: this.usd_rate },
    };
  }

  private maybeFail(): void {
    if (!this.failEveryN) return;
    this.requestCount++;
    if (this.requestCount % this.failEveryN === 0) {
      throw new Error(`MockAdapter simulated failure (request #${this.requestCount})`);
    }
  }

  private async maybeSleep(): Promise<void> {
    if (this.latencyMs > 0) {
      await new Promise((r) => setTimeout(r, this.latencyMs));
    }
  }
}
