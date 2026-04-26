import { describe, it, expect } from 'vitest';
import { UpstreamAdapterBase } from '../base/UpstreamAdapterBase';
import { AdapterError } from '../base/error-translation';
import { withRetry } from '../base/retry';
import type { Modality, ModelMeta, HealthStatus } from '../base/UpstreamAdapter';
import { createFetchMock } from './fetch-mock';

class TestAdapter extends UpstreamAdapterBase {
  readonly name = 'test';
  readonly supports_modalities: readonly Modality[] = ['chat'];
  async listModels(): Promise<ModelMeta[]> {
    return [];
  }
  async healthCheck(): Promise<HealthStatus> {
    return { status: 'healthy', latency_ms: 0, checked_at: new Date().toISOString() };
  }
  async hit(path: string, opts: { no_retry?: boolean } = {}) {
    const res = await this.request({ path, method: 'GET', no_retry: opts.no_retry });
    return res.json();
  }
}

describe('UpstreamAdapterBase', () => {
  it('retries on 5xx up to 3 times with exponential backoff', async () => {
    const mock = createFetchMock([
      { status: 503 },
      { status: 503 },
      { status: 200, body: { ok: true } },
    ]);
    const adapter = new TestAdapter({
      baseUrl: 'https://test.example/',
      apiKey: 'k',
      fetch: mock.fetch,
      retry: { base_delay_ms: 1, jitter: false },
    });
    const data = await adapter.hit('/v1/ping');
    expect(data).toEqual({ ok: true });
    expect(mock.calls).toHaveLength(3);
  });

  it('does NOT retry on 4xx client errors', async () => {
    const mock = createFetchMock([{ status: 400, body: { error: 'bad' } }]);
    const adapter = new TestAdapter({
      baseUrl: 'https://test.example/',
      apiKey: 'k',
      fetch: mock.fetch,
    });
    await expect(adapter.hit('/v1/ping')).rejects.toBeInstanceOf(AdapterError);
    expect(mock.calls).toHaveLength(1);
  });

  it('maps 429 with Retry-After header', async () => {
    const mock = createFetchMock([
      { status: 429, headers: { 'retry-after': '0' } },
      { status: 429, headers: { 'retry-after': '0' } },
      { status: 429, headers: { 'retry-after': '0' } },
    ]);
    const adapter = new TestAdapter({
      baseUrl: 'https://test.example/',
      apiKey: 'k',
      fetch: mock.fetch,
      retry: { base_delay_ms: 1, jitter: false },
    });
    await expect(adapter.hit('/v1/ping')).rejects.toMatchObject({
      status: 429,
      code: 'upstream_rate_limited',
    });
  });

  it('builds Authorization: Bearer header by default', async () => {
    const mock = createFetchMock([{ status: 200, body: {} }]);
    const adapter = new TestAdapter({
      baseUrl: 'https://test.example/',
      apiKey: 'sk-test',
      fetch: mock.fetch,
    });
    await adapter.hit('/v1/ping');
    expect(mock.calls[0].headers['authorization']).toBe('Bearer sk-test');
  });

  it('supports x-api-key auth scheme', async () => {
    const mock = createFetchMock([{ status: 200, body: {} }]);
    const adapter = new TestAdapter({
      baseUrl: 'https://test.example/',
      apiKey: 'abc',
      auth_scheme: 'x-api-key',
      fetch: mock.fetch,
    });
    await adapter.hit('/v1/ping');
    expect(mock.calls[0].headers['x-api-key']).toBe('abc');
    expect(mock.calls[0].headers['authorization']).toBeUndefined();
  });

  it('resolves apiKey from async function', async () => {
    let called = 0;
    const mock = createFetchMock([{ status: 200, body: {} }]);
    const adapter = new TestAdapter({
      baseUrl: 'https://test.example/',
      apiKey: async () => {
        called++;
        return 'dynamic-token';
      },
      fetch: mock.fetch,
    });
    await adapter.hit('/v1/ping');
    expect(called).toBe(1);
    expect(mock.calls[0].headers['authorization']).toBe('Bearer dynamic-token');
  });

  it('honors no_retry flag', async () => {
    const mock = createFetchMock([{ status: 503 }]);
    const adapter = new TestAdapter({
      baseUrl: 'https://test.example/',
      apiKey: 'k',
      fetch: mock.fetch,
    });
    await expect(adapter.hit('/v1/ping', { no_retry: true })).rejects.toMatchObject({
      status: 503,
    });
    expect(mock.calls).toHaveLength(1);
  });

  it('computes cost with markup + USD→RUB conversion', async () => {
    const adapter = new TestAdapter({
      baseUrl: 'https://t/',
      apiKey: 'k',
      markup: 1.25,
      usd_rate: 100,
    });
    const model: ModelMeta = {
      id: 'm1',
      name: 'm1',
      modality: 'chat',
      pricing: { input_per_1k: 0.001, output_per_1k: 0.002 },
    };
    const cost = await adapter.computeActualCost(
      { input_tokens: 1000, output_tokens: 500 },
      model,
    );
    // upstream = 0.001 + 0.5*0.002 = 0.002 USD
    expect(cost.upstream_cost_usd).toBeCloseTo(0.002, 6);
    // credits = 0.002 * 1.25 * 100 = 0.25
    expect(cost.credits).toBeCloseTo(0.25, 3);
  });
});

describe('withRetry', () => {
  it('honors AdapterError.retry_after_ms', async () => {
    let attempts = 0;
    const sleeps: number[] = [];
    await expect(
      withRetry(
        async () => {
          attempts++;
          throw new AdapterError(429, 'upstream_rate_limited', 'rl', 'test', 500);
        },
        {
          max_attempts: 2,
          base_delay_ms: 10,
          jitter: false,
          sleep: async (ms) => {
            sleeps.push(ms);
          },
        },
      ),
    ).rejects.toBeInstanceOf(AdapterError);
    expect(attempts).toBe(2);
    expect(sleeps[0]).toBe(500);
  });
});
