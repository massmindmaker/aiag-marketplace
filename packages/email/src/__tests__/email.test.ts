import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { sendEmail } from '../index.js';
import { verifyEmail } from '../templates/verify-email.js';
import { resetPassword } from '../templates/reset-password.js';
import { welcome } from '../templates/welcome.js';
import { paymentReceipt } from '../templates/payment-receipt.js';
import { subscriptionRenewal } from '../templates/subscription-renewal.js';

const ORIGINAL_KEY = process.env.UNISENDER_GO_API_KEY;

describe('templates', () => {
  it('verify-email renders subject + html + text', () => {
    const r = verifyEmail({ url: 'https://example.com/v?t=abc', name: 'Иван' });
    expect(r.subject).toContain('email');
    expect(r.html).toContain('https://example.com/v?t=abc');
    expect(r.html).toContain('Иван');
    expect(r.text).toContain('https://example.com/v?t=abc');
  });

  it('reset-password escapes HTML in name', () => {
    const r = resetPassword({ url: 'https://x/r', name: '<script>alert(1)</script>' });
    expect(r.html).not.toContain('<script>alert(1)</script>');
    expect(r.html).toContain('&lt;script&gt;');
  });

  it('welcome includes dashboard link', () => {
    const r = welcome({ name: 'Bob', dashboardUrl: 'https://x/d' });
    expect(r.html).toContain('https://x/d');
  });

  it('payment-receipt formats amount and currency', () => {
    const r = paymentReceipt({
      amount: 990,
      currency: 'RUB',
      description: 'Pro plan',
      paymentId: 'pay_123',
      date: '2026-04-26T10:00:00Z',
    });
    expect(r.subject).toContain('990');
    expect(r.html).toContain('Pro plan');
    expect(r.html).toContain('pay_123');
  });

  it('subscription-renewal includes plan name and renewal date', () => {
    const r = subscriptionRenewal({
      planName: 'Pro',
      amount: 990,
      renewalDate: '2026-05-01T00:00:00Z',
    });
    expect(r.html).toContain('Pro');
    expect(r.subject).toContain('Pro');
  });
});

describe('sendEmail mock mode (no API key)', () => {
  beforeEach(() => {
    delete process.env.UNISENDER_GO_API_KEY;
  });
  afterEach(() => {
    if (ORIGINAL_KEY) process.env.UNISENDER_GO_API_KEY = ORIGINAL_KEY;
  });

  it('returns console-mock when key absent', async () => {
    const r = await sendEmail({
      to: 'test@example.com',
      template: 'verify-email',
      data: { url: 'https://x/v' },
    });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.id).toBe('console-mock');
  });

  it('rejects unknown raw send without subject', async () => {
    const r = await sendEmail({ to: 'x@y.z' } as never);
    expect(r.ok).toBe(false);
  });

  it('accepts raw subject + html send', async () => {
    const r = await sendEmail({
      to: 'a@b.c',
      subject: 'Hi',
      html: '<b>Hello</b>',
    });
    expect(r.ok).toBe(true);
  });
});

describe('sendEmail with mocked fetch', () => {
  beforeEach(() => {
    process.env.UNISENDER_GO_API_KEY = 'test-key';
  });
  afterEach(() => {
    vi.restoreAllMocks();
    if (ORIGINAL_KEY) process.env.UNISENDER_GO_API_KEY = ORIGINAL_KEY;
    else delete process.env.UNISENDER_GO_API_KEY;
  });

  it('calls Unisender Go endpoint with X-API-KEY', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ job_id: 'job_42' }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    );

    const r = await sendEmail({
      to: 'foo@bar.baz',
      template: 'welcome',
      data: { name: 'Tester' },
    });

    expect(r.ok).toBe(true);
    if (r.ok) expect(r.id).toBe('job_42');
    expect(fetchMock).toHaveBeenCalledOnce();
    const [, init] = fetchMock.mock.calls[0]!;
    const headers = (init as RequestInit).headers as Record<string, string>;
    expect(headers['X-API-KEY']).toBe('test-key');
    const body = JSON.parse((init as RequestInit).body as string);
    expect(body.message.recipients[0].email).toBe('foo@bar.baz');
    expect(body.message.subject).toBeTruthy();
  });

  it('returns ok:false on HTTP error', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ error: 'invalid_api_key' }), { status: 401 })
    );
    const r = await sendEmail({
      to: 'x@y.z',
      template: 'welcome',
      data: {},
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toContain('invalid_api_key');
  });

  it('returns ok:false on fetch throw', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('ECONNREFUSED'));
    const r = await sendEmail({
      to: 'x@y.z',
      template: 'welcome',
      data: {},
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toContain('ECONNREFUSED');
  });
});
