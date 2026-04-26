import { describe, it, expect } from 'vitest';
import { mockUpstream } from '../upstreams/mock';

describe('mockUpstream', () => {
  it('chat returns OpenAI-shaped response with usage', async () => {
    const r = await mockUpstream.chat({
      modelId: 'yandex/yandexgpt-pro',
      messages: [{ role: 'user', content: 'hello' }],
    });
    expect(r.object).toBe('chat.completion');
    expect(r.choices[0]?.message.role).toBe('assistant');
    expect(r.usage.total_tokens).toBe(
      r.usage.prompt_tokens + r.usage.completion_tokens
    );
  });

  it('chatStream yields chunks', async () => {
    const iter = mockUpstream.chatStream!({
      modelId: 'yandex/yandexgpt-pro',
      messages: [{ role: 'user', content: 'stream please' }],
      stream: true,
    });
    const chunks: unknown[] = [];
    for await (const c of iter) {
      chunks.push(c);
    }
    expect(chunks.length).toBeGreaterThan(1);
    // final chunk has usage
    const last = chunks[chunks.length - 1] as { usage?: unknown };
    expect(last.usage).toBeDefined();
  });

  it('embeddings returns list with embedding vectors', async () => {
    const r = await mockUpstream.embeddings!({
      modelId: 'yandex/embed',
      input: ['a', 'bb'],
    });
    expect(r.object).toBe('list');
    expect(r.data.length).toBe(2);
    expect(r.data[0]!.embedding.length).toBe(8);
  });
});
