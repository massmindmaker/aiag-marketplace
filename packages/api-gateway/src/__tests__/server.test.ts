import { describe, it, expect } from 'vitest';
import { Hono } from 'hono';
import { AiagError, errors } from '../lib/errors';
import { requestIdMiddleware } from '../middleware/request-id';

/**
 * Lightweight server-shape test that doesn't import ../server.ts (which wires
 * the full middleware stack — those are tested individually). We verify the
 * boot-time pieces: request-id passthrough + AiagError serialization.
 */
function build(): Hono {
  const app = new Hono();
  app.use('*', requestIdMiddleware());
  app.onError((err, c) => {
    if (err instanceof AiagError)
      return c.json(err.toResponseBody(), err.status as any);
    return c.json({ error: { code: 'INTERNAL' } }, 500);
  });
  app.get('/health', (c) =>
    c.json({
      ok: true,
      runtime: `node ${process.version}`,
      uptime_s: 0,
    })
  );
  app.get('/boom', () => {
    throw errors.paymentRequired();
  });
  return app;
}

describe('gateway server shape', () => {
  it('GET /health → 200 + json body with runtime + uptime', async () => {
    const app = build();
    const r = await app.fetch(new Request('http://x/health'));
    expect(r.status).toBe(200);
    const j = (await r.json()) as {
      ok: boolean;
      runtime: string;
      uptime_s: number;
    };
    expect(j.ok).toBe(true);
    expect(j.runtime).toMatch(/node|bun/);
    expect(typeof j.uptime_s).toBe('number');
  });

  it('requestIdMiddleware echoes custom X-Request-Id', async () => {
    const app = build();
    const r = await app.fetch(
      new Request('http://x/health', {
        headers: { 'X-Request-Id': 'req-abc-123' },
      })
    );
    expect(r.headers.get('X-Request-Id')).toBe('req-abc-123');
  });

  it('requestIdMiddleware generates one when absent', async () => {
    const app = build();
    const r = await app.fetch(new Request('http://x/health'));
    expect(r.headers.get('X-Request-Id')).toMatch(/^req_/);
  });

  it('AiagError rendered with code + status', async () => {
    const app = build();
    const r = await app.fetch(new Request('http://x/boom'));
    expect(r.status).toBe(402);
    const j = (await r.json()) as { error: { code: string } };
    expect(j.error.code).toBe('PAYMENT_REQUIRED');
  });
});
