import { describe, it, expect, vi } from 'vitest';
import { buildEmailSendProcessor } from '../email-send.js';

function makeJob(data: Record<string, unknown>) {
  return { name: 'em', data } as unknown as Parameters<
    ReturnType<typeof buildEmailSendProcessor>
  >[0];
}

describe('email-send processor', () => {
  it('uses stub transport when none provided', async () => {
    const proc = buildEmailSendProcessor();
    const r = await proc(
      makeJob({ to: 'a@b.test', subject: 'hi', body: 'yo' }),
      'tok'
    );
    expect(r.ok).toBe(true);
    expect(r.messageId).toMatch(/^stub-/);
  });

  it('throws when transport fails', async () => {
    const transport = vi.fn().mockResolvedValue({ ok: false, error: 'smtp down' });
    const proc = buildEmailSendProcessor({ transport });
    await expect(
      proc(makeJob({ to: 'a@b.test', subject: 'x', body: 'y' }), 'tok')
    ).rejects.toThrow(/smtp down/);
  });
});
