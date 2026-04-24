import { describe, it, expect, beforeEach } from 'vitest';
import { YandexIamTokenManager } from '../adapters/yandex-iam';
import { createFetchMock } from './fetch-mock';

function makeRedisStub() {
  const store = new Map<string, string>();
  return {
    store,
    async get(k: string) {
      return store.get(k) ?? null;
    },
    async set(k: string, v: string) {
      store.set(k, v);
      return 'OK';
    },
    async setex(k: string, _ttl: number, v: string) {
      store.set(k, v);
      return 'OK';
    },
  };
}

describe('YandexIamTokenManager', () => {
  const key = {
    id: 'k1',
    service_account_id: 'sa-1',
    private_key: 'dummy',
  };

  it('refreshes token on first call and caches in memory', async () => {
    const expires = new Date(Date.now() + 3600_000).toISOString();
    const mock = createFetchMock([{ status: 200, body: { iamToken: 'iam-1', expiresAt: expires } }]);
    const mgr = new YandexIamTokenManager({
      serviceAccountKey: key,
      signJwt: async () => 'jwt-stub',
      fetch: mock.fetch,
    });
    const t1 = await mgr.getToken();
    const t2 = await mgr.getToken();
    expect(t1).toBe('iam-1');
    expect(t2).toBe('iam-1');
    expect(mock.calls).toHaveLength(1);
  });

  it('refreshes when cached token is near expiry', async () => {
    const soon = new Date(Date.now() + 60_000).toISOString(); // 1min
    const far = new Date(Date.now() + 3600_000).toISOString();
    const mock = createFetchMock([
      { status: 200, body: { iamToken: 'iam-soon', expiresAt: soon } },
      { status: 200, body: { iamToken: 'iam-far', expiresAt: far } },
    ]);
    const mgr = new YandexIamTokenManager({
      serviceAccountKey: key,
      signJwt: async () => 'jwt',
      fetch: mock.fetch,
      refresh_window_s: 600,
    });
    const a = await mgr.getToken();
    const b = await mgr.getToken();
    expect(a).toBe('iam-soon');
    expect(b).toBe('iam-far');
  });

  it('loads token from Redis if memory cache cleared', async () => {
    const expires = new Date(Date.now() + 3600_000).toISOString();
    const redis = makeRedisStub();
    const mock = createFetchMock([{ status: 200, body: { iamToken: 'iam-shared', expiresAt: expires } }]);
    const mgr1 = new YandexIamTokenManager({
      serviceAccountKey: key,
      signJwt: async () => 'jwt',
      fetch: mock.fetch,
      redis,
    });
    await mgr1.getToken();
    // new manager (simulates different pm2 worker)
    const mgr2 = new YandexIamTokenManager({
      serviceAccountKey: key,
      signJwt: async () => 'jwt',
      fetch: mock.fetch,
      redis,
    });
    const t = await mgr2.getToken();
    expect(t).toBe('iam-shared');
    // only first manager refreshed
    expect(mock.calls).toHaveLength(1);
  });

  it('coalesces concurrent refresh requests', async () => {
    const expires = new Date(Date.now() + 3600_000).toISOString();
    const mock = createFetchMock([
      { status: 200, body: { iamToken: 'iam-x', expiresAt: expires }, delay_ms: 20 },
    ]);
    const mgr = new YandexIamTokenManager({
      serviceAccountKey: key,
      signJwt: async () => 'jwt',
      fetch: mock.fetch,
    });
    const [a, b, c] = await Promise.all([mgr.getToken(), mgr.getToken(), mgr.getToken()]);
    expect([a, b, c]).toEqual(['iam-x', 'iam-x', 'iam-x']);
    expect(mock.calls).toHaveLength(1);
  });

  it('throws on refresh failure', async () => {
    const mock = createFetchMock([{ status: 401, body: { error: 'bad key' } }]);
    const mgr = new YandexIamTokenManager({
      serviceAccountKey: key,
      signJwt: async () => 'jwt',
      fetch: mock.fetch,
    });
    await expect(mgr.getToken()).rejects.toThrow(/IAM token refresh failed 401/);
  });
});
