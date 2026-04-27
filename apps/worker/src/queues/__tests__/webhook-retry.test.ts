import { describe, it, expect, vi } from 'vitest';
import {
  buildWebhookRetryProcessor,
  MAX_WEBHOOK_ATTEMPTS,
  type WebhookFetcher,
} from '../webhook-retry.js';

function makeJob(data: Record<string, unknown>, queueAdd = vi.fn()) {
  return {
    name: 'wh',
    data,
    queue: { add: queueAdd },
  } as unknown as Parameters<ReturnType<typeof buildWebhookRetryProcessor>>[0];
}

describe('webhook-retry processor', () => {
  it('marks ok=true on 2xx and does not requeue', async () => {
    const queueAdd = vi.fn();
    const fetcher: WebhookFetcher = vi
      .fn()
      .mockResolvedValue({ ok: true, status: 200, text: async () => '' });
    const sink = vi.fn().mockResolvedValue(undefined);
    const proc = buildWebhookRetryProcessor({ fetcher, sink });
    const r = await proc(
      makeJob({ url: 'https://x.test/cb', body: { a: 1 } }, queueAdd),
      'tok'
    );
    expect(r.ok).toBe(true);
    expect(queueAdd).not.toHaveBeenCalled();
    expect(sink).toHaveBeenCalledOnce();
  });

  it('re-enqueues with delay when fetch fails and attempt < MAX', async () => {
    const queueAdd = vi.fn().mockResolvedValue(undefined);
    const fetcher: WebhookFetcher = vi.fn().mockRejectedValue(new Error('ECONN'));
    const proc = buildWebhookRetryProcessor({ fetcher });
    await proc(
      makeJob({ url: 'https://x.test/cb', body: {}, attempt: 0 }, queueAdd),
      'tok'
    );
    expect(queueAdd).toHaveBeenCalledOnce();
    const [, payload, opts] = queueAdd.mock.calls[0];
    expect(payload.attempt).toBe(1);
    expect(opts.delay).toBeGreaterThan(0);
  });

  it('stops retrying after MAX_WEBHOOK_ATTEMPTS', async () => {
    const queueAdd = vi.fn();
    const fetcher: WebhookFetcher = vi
      .fn()
      .mockResolvedValue({ ok: false, status: 500, text: async () => 'oops' });
    const sink = vi.fn().mockResolvedValue(undefined);
    const proc = buildWebhookRetryProcessor({ fetcher, sink });
    await proc(
      makeJob({ url: 'https://x.test/cb', body: {}, attempt: MAX_WEBHOOK_ATTEMPTS - 1 }, queueAdd),
      'tok'
    );
    expect(queueAdd).not.toHaveBeenCalled();
    expect(sink).toHaveBeenCalledWith(expect.objectContaining({ ok: false, attempt: MAX_WEBHOOK_ATTEMPTS }));
  });
});
