/**
 * Mock upstream adapter — used until Plan 05 real adapters land. Gives
 * deterministic responses suitable for tests + wiring validation.
 */
import type {
  UpstreamAdapter,
  ChatRequest,
  ChatResponse,
  EmbeddingsRequest,
  EmbeddingsResponse,
} from './interface';

const lastTextContent = (messages: ChatRequest['messages']): string => {
  const last = messages[messages.length - 1];
  if (!last) return '';
  if (typeof last.content === 'string') return last.content;
  if (Array.isArray(last.content)) {
    return last.content
      .map((p) =>
        typeof p === 'string'
          ? p
          : typeof p === 'object' && p && 'text' in (p as Record<string, unknown>)
            ? String((p as Record<string, unknown>).text)
            : ''
      )
      .join(' ');
  }
  return '';
};

export const mockUpstream: UpstreamAdapter = {
  async chat(req: ChatRequest): Promise<ChatResponse> {
    const lastText = lastTextContent(req.messages);
    const reply = `Mock reply to: ${lastText}`;
    const prompt_tokens = Math.max(1, Math.ceil(lastText.length / 4));
    const completion_tokens = Math.max(1, Math.ceil(reply.length / 4));
    return {
      id: `chatcmpl-mock-${Date.now()}`,
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model: req.modelId,
      choices: [
        {
          index: 0,
          message: { role: 'assistant', content: reply },
          finish_reason: 'stop',
        },
      ],
      usage: {
        prompt_tokens,
        completion_tokens,
        total_tokens: prompt_tokens + completion_tokens,
      },
    };
  },

  async *chatStream(req: ChatRequest): AsyncIterable<unknown> {
    const lastText = lastTextContent(req.messages);
    const reply = `Mock stream reply to: ${lastText}`;
    const words = reply.split(' ');
    for (const w of words) {
      yield {
        id: `chatcmpl-mock-${Date.now()}`,
        object: 'chat.completion.chunk',
        choices: [{ index: 0, delta: { content: w + ' ' } }],
      };
      await new Promise((r) => setTimeout(r, 1));
    }
    yield {
      id: `chatcmpl-mock-${Date.now()}`,
      object: 'chat.completion.chunk',
      choices: [{ index: 0, delta: {}, finish_reason: 'stop' }],
      usage: {
        prompt_tokens: Math.max(1, Math.ceil(lastText.length / 4)),
        completion_tokens: words.length,
        total_tokens: Math.max(1, Math.ceil(lastText.length / 4)) + words.length,
      },
    };
  },

  async embeddings(req: EmbeddingsRequest): Promise<EmbeddingsResponse> {
    const inputs = Array.isArray(req.input) ? req.input : [req.input];
    const totalTokens = inputs.reduce(
      (sum, s) => sum + Math.max(1, Math.ceil(s.length / 4)),
      0
    );
    return {
      object: 'list',
      data: inputs.map((_, i) => ({
        object: 'embedding',
        embedding: Array.from({ length: 8 }, (_, k) => Math.sin(i * k + 1)),
        index: i,
      })),
      model: req.modelId,
      usage: { prompt_tokens: totalTokens, total_tokens: totalTokens },
    };
  },
};
