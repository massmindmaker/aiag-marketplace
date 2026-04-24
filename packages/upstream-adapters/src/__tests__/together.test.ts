import { describe, it, expect } from 'vitest';
import { TogetherAdapter } from '../adapters/together';
import { createFetchMock } from './fetch-mock';

describe('TogetherAdapter', () => {
  it('lists models with pricing', async () => {
    const mock = createFetchMock([
      {
        status: 200,
        body: [
          {
            id: 'meta-llama/Llama-3.3-70B-Instruct-Turbo',
            display_name: 'Llama 3.3 70B Turbo',
            context_length: 131072,
            type: 'chat',
            pricing: { input: 0.88, output: 0.88 },
          },
          {
            id: 'BAAI/bge-large-en-v1.5',
            type: 'embedding',
            pricing: { input: 0.01 },
          },
        ],
      },
    ]);
    const adapter = new TogetherAdapter({ apiKey: 'k', fetch: mock.fetch });
    const models = await adapter.listModels();
    expect(models).toHaveLength(2);
    expect(models[0].modality).toBe('chat');
    expect(models[1].modality).toBe('embedding');
    expect(models[0].capabilities?.tools).toBe(true);
  });

  it('posts chat/completions', async () => {
    const mock = createFetchMock([{ status: 200, body: { choices: [] } }]);
    const adapter = new TogetherAdapter({ apiKey: 'tgp-1', fetch: mock.fetch });
    await adapter.chatCompletions(
      { model: 'x', messages: [{ role: 'user', content: 'hi' }] },
      { request_id: 'r' },
    );
    expect(mock.calls[0].url).toContain('/chat/completions');
    expect(mock.calls[0].headers['authorization']).toBe('Bearer tgp-1');
  });

  it('embeddings endpoint', async () => {
    const mock = createFetchMock([{ status: 200, body: { data: [{ embedding: [1, 2] }] } }]);
    const adapter = new TogetherAdapter({ apiKey: 'k', fetch: mock.fetch });
    await adapter.embeddings(
      { model: 'bge', input: 'hello' },
      { request_id: 'r' },
    );
    expect(mock.calls[0].url).toContain('/embeddings');
  });
});
