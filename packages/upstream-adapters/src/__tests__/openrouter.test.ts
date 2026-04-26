import { describe, it, expect } from 'vitest';
import { OpenRouterAdapter } from '../adapters/openrouter';
import { createFetchMock } from './fetch-mock';

describe('OpenRouterAdapter', () => {
  it('lists models with pricing parsed to per-1k USD', async () => {
    const mock = createFetchMock([
      {
        status: 200,
        body: {
          data: [
            {
              id: 'anthropic/claude-3.5-sonnet',
              name: 'Claude 3.5 Sonnet',
              context_length: 200_000,
              pricing: { prompt: '0.000003', completion: '0.000015' },
              architecture: { modality: 'text' },
            },
            {
              id: 'openai/gpt-4o',
              context_length: 128_000,
              pricing: { prompt: '0.0000025', completion: '0.00001' },
              architecture: { modality: 'multimodal' },
            },
          ],
        },
      },
    ]);
    const adapter = new OpenRouterAdapter({ apiKey: 'k', fetch: mock.fetch });
    const models = await adapter.listModels();
    expect(models).toHaveLength(2);
    expect(models[0].pricing?.input_per_1k).toBeCloseTo(0.003, 6);
    expect(models[0].pricing?.output_per_1k).toBeCloseTo(0.015, 6);
    expect(models[1].modality).toBe('multimodal');
  });

  it('sends chat/completions with stream flag and attribution headers', async () => {
    const mock = createFetchMock([{ status: 200, body: { choices: [{ message: { content: 'hi' } }] } }]);
    const adapter = new OpenRouterAdapter({
      apiKey: 'sk-or-v1-abc',
      fetch: mock.fetch,
      app_url: 'https://aiag.ru',
      app_name: 'AIAG',
    });
    await adapter.chatCompletions(
      { model: 'x', messages: [{ role: 'user', content: 'hi' }] },
      { request_id: 'req-1', stream: true },
    );
    expect(mock.calls).toHaveLength(1);
    const { url, method, headers, body } = mock.calls[0];
    expect(url).toContain('/chat/completions');
    expect(method).toBe('POST');
    expect(headers['authorization']).toBe('Bearer sk-or-v1-abc');
    expect(headers['http-referer']).toBe('https://aiag.ru');
    expect(headers['x-title']).toBe('AIAG');
    expect(headers['x-request-id']).toBe('req-1');
    const parsed = JSON.parse(body!);
    expect(parsed.stream).toBe(true);
  });

  it('uses BYOK key when provided', async () => {
    const mock = createFetchMock([{ status: 200, body: {} }]);
    const adapter = new OpenRouterAdapter({ apiKey: 'admin-key', fetch: mock.fetch });
    await adapter.chatCompletions(
      { model: 'x', messages: [{ role: 'user', content: 'hi' }] },
      { request_id: 'r', byok_key: 'user-byok' },
    );
    expect(mock.calls[0].headers['authorization']).toBe('Bearer user-byok');
  });

  it('healthCheck returns healthy on 200', async () => {
    const mock = createFetchMock([{ status: 200, body: { data: [] } }]);
    const adapter = new OpenRouterAdapter({ apiKey: 'k', fetch: mock.fetch });
    const h = await adapter.healthCheck();
    expect(h.status).toBe('healthy');
    expect(h.latency_ms).toBeGreaterThanOrEqual(0);
  });

  it('healthCheck returns unhealthy on 5xx (no retry)', async () => {
    const mock = createFetchMock([{ status: 503 }]);
    const adapter = new OpenRouterAdapter({ apiKey: 'k', fetch: mock.fetch });
    const h = await adapter.healthCheck();
    expect(h.status).toBe('unhealthy');
    expect(mock.calls).toHaveLength(1);
  });
});
