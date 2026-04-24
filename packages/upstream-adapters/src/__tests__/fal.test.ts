import { describe, it, expect } from 'vitest';
import { FalAdapter } from '../adapters/fal';
import { createFetchMock } from './fetch-mock';

describe('FalAdapter', () => {
  it('submits image job and returns async handle', async () => {
    const mock = createFetchMock([
      {
        status: 200,
        body: {
          request_id: 'req-abc',
          status_url: 'https://queue.fal.run/fal-ai/flux-pro/v1.1/requests/req-abc/status',
          response_url: 'https://queue.fal.run/fal-ai/flux-pro/v1.1/requests/req-abc',
        },
      },
    ]);
    const adapter = new FalAdapter({ apiKey: 'id:secret', fetch: mock.fetch });
    const handle = await adapter.imageGenerations(
      { model: 'fal-ai/flux-pro/v1.1', prompt: 'a cat' },
      { request_id: 'r1' },
    );
    expect(handle.task_id).toBe('req-abc');
    expect(handle.poll_url).toContain('status');
    expect(mock.calls[0].headers['authorization']).toBe('Key id:secret');
  });

  it('appends fal_webhook query when webhook_url configured', async () => {
    const mock = createFetchMock([
      {
        status: 200,
        body: {
          request_id: 'req-1',
          status_url: 'https://queue.fal.run/fal-ai/x/requests/req-1/status',
          response_url: 'https://queue.fal.run/fal-ai/x/requests/req-1',
        },
      },
    ]);
    const adapter = new FalAdapter({
      apiKey: 'k',
      fetch: mock.fetch,
      webhook_url: 'https://aiag.ru/webhooks/fal',
    });
    await adapter.videoGenerations(
      { model: 'fal-ai/kling-video/v1.5/pro/text-to-video', prompt: 'dog' },
      { request_id: 'r2' },
    );
    expect(mock.calls[0].url).toContain('fal_webhook=https%3A%2F%2Faiag.ru');
  });

  it('pollAsync: returns pending when IN_PROGRESS', async () => {
    const mock = createFetchMock([
      { status: 200, body: { status: 'IN_PROGRESS', request_id: 'x' } },
    ]);
    const adapter = new FalAdapter({ apiKey: 'k', fetch: mock.fetch });
    const result = await adapter.pollAsync('x', {
      request_id: 'r',
      poll_url: 'https://queue.fal.run/fal-ai/x/requests/x/status',
    } as any);
    expect(result.status).toBe('pending');
  });

  it('pollAsync: returns completed + fetches result on COMPLETED', async () => {
    const mock = createFetchMock([
      {
        status: 200,
        body: {
          status: 'COMPLETED',
          request_id: 'x',
          response_url: 'https://queue.fal.run/fal-ai/x/requests/x',
        },
      },
      { status: 200, body: { images: [{ url: 'https://fal.media/img.png' }] } },
    ]);
    const adapter = new FalAdapter({ apiKey: 'k', fetch: mock.fetch });
    const result = await adapter.pollAsync('x', {
      request_id: 'r',
      poll_url: 'https://queue.fal.run/fal-ai/x/requests/x/status',
    } as any);
    expect(result.status).toBe('completed');
    expect(mock.calls).toHaveLength(2);
  });

  it('pollAsync: returns failed on FAILED status', async () => {
    const mock = createFetchMock([
      { status: 200, body: { status: 'FAILED', request_id: 'x', error: 'oom' } },
    ]);
    const adapter = new FalAdapter({ apiKey: 'k', fetch: mock.fetch });
    const result = await adapter.pollAsync('x', {
      request_id: 'r',
      poll_url: 'https://queue.fal.run/fal-ai/x/requests/x/status',
    } as any);
    expect(result.status).toBe('failed');
    expect(result.error).toBe('oom');
  });

  it('listModels returns curated catalog', async () => {
    const adapter = new FalAdapter({ apiKey: 'k' });
    const models = await adapter.listModels();
    expect(models.length).toBeGreaterThan(0);
    expect(models.every((m) => m.id.startsWith('fal-ai/'))).toBe(true);
  });
});
