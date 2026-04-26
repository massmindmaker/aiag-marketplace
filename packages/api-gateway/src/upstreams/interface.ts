/**
 * Upstream adapter interface (abstract). Plan 05 implements concrete
 * adapters (OpenRouter, Yandex, Fal, Together, etc.).
 */
export type ChatRequest = {
  modelId: string;
  messages: Array<{ role: string; content: unknown }>;
  stream?: boolean;
  temperature?: number;
  max_tokens?: number;
  byokKey?: string | undefined;
};

export type ChatUsage = {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  cached_input_tokens?: number;
};

export type ChatResponse = {
  id: string;
  object: 'chat.completion';
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: { role: 'assistant'; content: string };
    finish_reason: 'stop' | 'length' | 'content_filter';
  }>;
  usage: ChatUsage;
};

export type EmbeddingsRequest = {
  modelId: string;
  input: string | string[];
  byokKey?: string | undefined;
};

export type EmbeddingsResponse = {
  object: 'list';
  data: Array<{ object: 'embedding'; embedding: number[]; index: number }>;
  model: string;
  usage: { prompt_tokens: number; total_tokens: number };
};

export interface UpstreamAdapter {
  chat(req: ChatRequest): Promise<ChatResponse>;
  chatStream?(req: ChatRequest): AsyncIterable<unknown>;
  embeddings?(req: EmbeddingsRequest): Promise<EmbeddingsResponse>;
}
