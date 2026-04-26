/**
 * Shared types + contract for all upstream adapters.
 *
 * Gateway hits `UpstreamRegistry.get(provider)` → receives an `UpstreamAdapter`,
 * then calls `chatCompletions` / `imageGenerations` / etc. depending on modality.
 */

export type Modality =
  | 'chat'
  | 'image'
  | 'video'
  | 'audio'
  | 'embedding'
  | 'multimodal';

export interface ModelPricing {
  input_per_1k?: number;
  output_per_1k?: number;
  per_image?: number;
  per_second?: number;
  per_call?: number;
}

export interface ModelMeta {
  id: string;
  name: string;
  context_length?: number;
  pricing?: ModelPricing;
  modality: Modality;
  capabilities?: {
    streaming?: boolean;
    tools?: boolean;
    vision?: boolean;
    json_schema?: boolean;
    embeddings?: boolean;
  };
  /** Raw upstream metadata for debugging / admin UI */
  raw?: Record<string, unknown>;
}

export interface UsageBreakdown {
  input_tokens?: number;
  output_tokens?: number;
  total_tokens?: number;
  images?: number;
  seconds?: number;
}

export interface CostEstimate {
  /** final AIAG credits (1 credit == 1 RUB) */
  credits: number;
  upstream_cost_usd: number;
  breakdown: {
    upstream: number;
    markup: number;
    batch_discount?: number;
    usd_rate: number;
  };
}

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  latency_ms: number;
  checked_at: string;
  last_error?: string;
}

export interface UpstreamInvokeOptions {
  request_id: string;
  stream?: boolean;
  timeout_ms?: number;
  signal?: AbortSignal;
  /** If present, overrides stored admin key (BYOK per-request). */
  byok_key?: string;
  /** Override org for BYOK stored-key lookup */
  org_id?: string;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string | Array<Record<string, unknown>>;
  name?: string;
  tool_call_id?: string;
}

export interface ChatCompletionRequest {
  model: string;
  messages: ChatMessage[];
  max_tokens?: number;
  temperature?: number;
  top_p?: number;
  stream?: boolean;
  tools?: Array<Record<string, unknown>>;
  response_format?: Record<string, unknown>;
  user?: string;
}

export interface ImageRequest {
  model: string;
  prompt: string;
  n?: number;
  size?: string;
  negative_prompt?: string;
  seed?: number;
  reference_image_url?: string;
}

export interface VideoRequest {
  model: string;
  prompt: string;
  duration_s?: number;
  aspect_ratio?: string;
  image_url?: string;
}

export interface EmbeddingRequest {
  model: string;
  input: string | string[];
  dimensions?: number;
}

export interface AudioRequest {
  model: string;
  input?: string;
  file_url?: string;
  voice?: string;
  format?: string;
}

export interface AsyncJobHandle {
  task_id: string;
  poll_url?: string;
  /** ISO timestamp — provider-recommended initial poll delay */
  eta?: string;
}

export interface AsyncJobResult {
  status: 'pending' | 'completed' | 'failed';
  output?: unknown;
  error?: string;
  usage?: UsageBreakdown;
}

export interface UpstreamAdapter {
  readonly name: string;
  readonly supports_modalities: readonly Modality[];

  listModels(): Promise<ModelMeta[]>;
  chatCompletions?(req: ChatCompletionRequest, opts: UpstreamInvokeOptions): Promise<Response>;
  imageGenerations?(req: ImageRequest, opts: UpstreamInvokeOptions): Promise<Response | AsyncJobHandle>;
  videoGenerations?(req: VideoRequest, opts: UpstreamInvokeOptions): Promise<AsyncJobHandle>;
  embeddings?(req: EmbeddingRequest, opts: UpstreamInvokeOptions): Promise<Response>;
  audioSpeech?(req: AudioRequest, opts: UpstreamInvokeOptions): Promise<Response>;
  audioTranscriptions?(req: AudioRequest, opts: UpstreamInvokeOptions): Promise<Response>;
  pollAsync?(task_id: string, opts: UpstreamInvokeOptions): Promise<AsyncJobResult>;
  healthCheck(): Promise<HealthStatus>;
  pricingSync?(): Promise<Array<{ model_id: string; pricing: ModelPricing }>>;
  estimateCost?(req: Record<string, unknown>, model: ModelMeta): Promise<CostEstimate>;
  computeActualCost?(
    usage: UsageBreakdown,
    model: ModelMeta,
    markup: number,
  ): Promise<CostEstimate>;
}
