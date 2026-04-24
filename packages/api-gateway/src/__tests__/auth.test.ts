import { describe, it, expect, beforeEach } from 'vitest';
import { Hono } from 'hono';
import IORedisMock from 'ioredis-mock';
import { setRedisFactory } from '../lib/redis';
import { requireApiKey, setApiKeyResolver } from '../middleware/auth-plan04';
import { generateApiKey } from '../lib/api-key';
import { AiagError } from '../lib/errors';

beforeEach(() => {
  const instance = new (IORedisMock as any)();
  setRedisFactory(() => instance as any);
  setApiKeyResolver(null);
});

function build(): { app: Hono } {
  const app = new Hono();
  app.onError((err, c) => {
    if (err instanceof AiagError)
      return c.json(err.toResponseBody(), err.status as any);
    return c.json({ error: { code: 'INTERNAL', message: String(err) } }, 500);
  });
  app.use('/v1/*', requireApiKey);
  app.get('/v1/ping', (c) => c.json({ ok: true }));
  return { app };
}

describe('requireApiKey middleware', () => {
  it('401 when Authorization header missing', async () => {
    const { app } = build();
    const res = await app.fetch(new Request('http://x/v1/ping'));
    expect(res.status).toBe(401);
    const body = (await res.json()) as { error: { code: string } };
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  it('401 when key has wrong prefix', async () => {
    const { app } = build();
    const res = await app.fetch(
      new Request('http://x/v1/ping', {
        headers: { Authorization: 'Bearer sk_openai_xxx' },
      })
    );
    expect(res.status).toBe(401);
  });

  it('200 when resolver returns a valid key', async () => {
    const { key } = generateApiKey('test');
    setApiKeyResolver(async () => ({
      id: '11111111-1111-1111-1111-111111111111',
      org_id: '22222222-2222-2222-2222-222222222222',
      policies: {},
      rpm_limit: 60,
      daily_usd_cap: null,
      batch_rpm_limit: 10,
    }));
    const { app } = build();
    const res = await app.fetch(
      new Request('http://x/v1/ping', {
        headers: { Authorization: `Bearer ${key}` },
      })
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean };
    expect(body.ok).toBe(true);
  });

  it('401 when resolver returns null (unknown/revoked key)', async () => {
    const { key } = generateApiKey('live');
    setApiKeyResolver(async () => null);
    const { app } = build();
    const res = await app.fetch(
      new Request('http://x/v1/ping', {
        headers: { Authorization: `Bearer ${key}` },
      })
    );
    expect(res.status).toBe(401);
  });

  it('surfaces BYOK header into context (byok=true)', async () => {
    const { key } = generateApiKey('test');
    setApiKeyResolver(async () => ({
      id: '11111111-1111-1111-1111-111111111111',
      org_id: '22222222-2222-2222-2222-222222222222',
      policies: {},
      rpm_limit: 60,
      daily_usd_cap: null,
      batch_rpm_limit: 10,
    }));
    const { app } = build();
    app.get('/v1/byok-check', (c) => {
      return c.json({
        byok: c.get('byok' as never) ?? false,
        hasKey: Boolean(c.get('byokKey' as never)),
      });
    });
    app.use('/v1/byok-check', requireApiKey);
    const res = await app.fetch(
      new Request('http://x/v1/byok-check', {
        headers: {
          Authorization: `Bearer ${key}`,
          'X-Upstream-Key': 'sk-openai-real-xxxx',
        },
      })
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { byok: boolean; hasKey: boolean };
    expect(body.byok).toBe(true);
    expect(body.hasKey).toBe(true);
  });
});
