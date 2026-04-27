import { describe, it, expect, vi } from 'vitest';
import { YooKassaClient, createYooKassaClient } from '../client';
import type { FetchLike } from '../client';
import type { YooKassaPaymentObject } from '../types';

function mockFetch(response: unknown, opts: { status?: number } = {}): FetchLike {
  const status = opts.status ?? 200;
  return vi.fn(async () => ({
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'ERR',
    json: async () => response,
    text: async () => JSON.stringify(response),
  })) as unknown as FetchLike;
}

const sampleObject: YooKassaPaymentObject = {
  id: 'pmt_123',
  status: 'pending',
  amount: { value: '990.00', currency: 'RUB' },
  recipient: { account_id: 'shop_x', gateway_id: 'gw_1' },
  created_at: '2026-04-26T00:00:00Z',
  test: true,
  paid: false,
  refundable: false,
  confirmation: { type: 'redirect', confirmation_url: 'https://yoomoney.ru/checkout/p/123' },
};

describe('YooKassaClient — createPayment', () => {
  it('creates bank_card payment with redirect URL', async () => {
    const fetchImpl = mockFetch(sampleObject);
    const client = new YooKassaClient(
      { shopId: 's', secretKey: 'k' },
      fetchImpl
    );
    const res = await client.createPayment({
      orderId: 'order_1',
      amount: 990,
      returnUrl: 'https://example.com/return',
      paymentMethod: 'bank_card',
      description: 'Basic plan',
    });
    expect(res.success).toBe(true);
    expect(res.paymentId).toBe('pmt_123');
    expect(res.amount).toBe(990);
    expect(res.paymentUrl).toBe('https://yoomoney.ru/checkout/p/123');
  });

  it('passes Idempotence-Key from orderId', async () => {
    const calls: Array<{ headers?: Record<string, string>; body?: string }> = [];
    const fetchImpl: FetchLike = vi.fn(async (_url, init) => {
      calls.push(init || {});
      return {
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => sampleObject,
        text: async () => '',
      };
    }) as unknown as FetchLike;
    const client = new YooKassaClient({ shopId: 's', secretKey: 'k' }, fetchImpl);
    await client.createPayment({
      orderId: 'order_unique_42',
      amount: 100,
      returnUrl: 'https://x.test',
    });
    expect(calls[0].headers?.['Idempotence-Key']).toBe('order_unique_42');
  });

  it('builds Basic auth header', async () => {
    const calls: Array<{ headers?: Record<string, string> }> = [];
    const fetchImpl: FetchLike = vi.fn(async (_url, init) => {
      calls.push(init || {});
      return {
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => sampleObject,
        text: async () => '',
      };
    }) as unknown as FetchLike;
    const client = new YooKassaClient(
      { shopId: 'shop_a', secretKey: 'sec_b' },
      fetchImpl
    );
    await client.createPayment({
      orderId: 'o1',
      amount: 1,
      returnUrl: 'https://x.test',
    });
    const expected = 'Basic ' + Buffer.from('shop_a:sec_b').toString('base64');
    expect(calls[0].headers?.Authorization).toBe(expected);
  });

  it('uses confirmation type=qr for SBP', async () => {
    const captured: Array<{ body?: string }> = [];
    const fetchImpl: FetchLike = vi.fn(async (_url, init) => {
      captured.push(init || {});
      return {
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => ({
          ...sampleObject,
          confirmation: { type: 'qr', confirmation_data: 'sbp://payload' },
        }),
        text: async () => '',
      };
    }) as unknown as FetchLike;
    const client = new YooKassaClient({ shopId: 's', secretKey: 'k' }, fetchImpl);
    const res = await client.createPayment({
      orderId: 'order_sbp',
      amount: 500,
      returnUrl: 'https://x.test',
      paymentMethod: 'sbp',
    });
    const body = JSON.parse(captured[0].body || '{}');
    expect(body.confirmation.type).toBe('qr');
    expect(body.payment_method_data.type).toBe('sbp');
    expect(res.confirmationData).toBe('sbp://payload');
  });

  it('returns success=false on API error (no throw)', async () => {
    const fetchImpl = mockFetch({ description: 'invalid' }, { status: 400 });
    const client = new YooKassaClient(
      { shopId: 's', secretKey: 'k' },
      fetchImpl
    );
    const res = await client.createPayment({
      orderId: 'order_bad',
      amount: 0,
      returnUrl: 'https://x.test',
    });
    expect(res.success).toBe(false);
    expect(res.errorMessage).toContain('YooKassa API 400');
  });

  it('attaches metadata.order_id', async () => {
    const captured: Array<{ body?: string }> = [];
    const fetchImpl: FetchLike = vi.fn(async (_url, init) => {
      captured.push(init || {});
      return {
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => sampleObject,
        text: async () => '',
      };
    }) as unknown as FetchLike;
    const client = new YooKassaClient({ shopId: 's', secretKey: 'k' }, fetchImpl);
    await client.createPayment({
      orderId: 'O-42',
      amount: 1,
      returnUrl: 'https://x.test',
      metadata: { user_id: 'u1' },
    });
    const body = JSON.parse(captured[0].body || '{}');
    expect(body.metadata.order_id).toBe('O-42');
    expect(body.metadata.user_id).toBe('u1');
  });

  it('attaches receipt when email provided', async () => {
    const captured: Array<{ body?: string }> = [];
    const fetchImpl: FetchLike = vi.fn(async (_url, init) => {
      captured.push(init || {});
      return {
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => sampleObject,
        text: async () => '',
      };
    }) as unknown as FetchLike;
    const client = new YooKassaClient({ shopId: 's', secretKey: 'k' }, fetchImpl);
    await client.createPayment({
      orderId: 'o',
      amount: 100,
      returnUrl: 'https://x.test',
      email: 'u@example.com',
    });
    const body = JSON.parse(captured[0].body || '{}');
    expect(body.receipt.customer.email).toBe('u@example.com');
    expect(body.receipt.items).toHaveLength(1);
  });
});

describe('YooKassaClient — refund', () => {
  it('refunds full amount', async () => {
    const fetchImpl = mockFetch({
      id: 'rf_1',
      status: 'succeeded',
      amount: { value: '990.00', currency: 'RUB' },
      payment_id: 'pmt_123',
      created_at: '2026-04-26T01:00:00Z',
    });
    const client = new YooKassaClient({ shopId: 's', secretKey: 'k' }, fetchImpl);
    const r = await client.refundPayment('pmt_123', 990);
    expect(r.id).toBe('rf_1');
    expect(r.status).toBe('succeeded');
    expect(r.amount.value).toBe('990.00');
  });
});

describe('YooKassaClient — webhook verification', () => {
  it('verifies and re-fetches payment', async () => {
    const freshObject = { ...sampleObject, status: 'succeeded' as const };
    const fetchImpl = mockFetch(freshObject);
    const client = new YooKassaClient({ shopId: 's', secretKey: 'k' }, fetchImpl);
    const result = await client.verifyAndFetch({
      type: 'notification',
      event: 'payment.succeeded',
      object: { id: 'pmt_123', status: 'succeeded' },
    });
    expect(result.object.id).toBe('pmt_123');
    expect(result.object.status).toBe('succeeded');
    expect(result.event.event).toBe('payment.succeeded');
  });

  it('throws on invalid shape', async () => {
    const client = new YooKassaClient(
      { shopId: 's', secretKey: 'k' },
      mockFetch({})
    );
    await expect(client.verifyAndFetch(null)).rejects.toThrow(/invalid payload/);
    await expect(client.verifyAndFetch({ type: 'wrong' })).rejects.toThrow();
  });

  it('does not re-fetch for refund events', async () => {
    const fetchSpy = vi.fn(async () => ({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: async () => sampleObject,
      text: async () => '',
    })) as unknown as FetchLike;
    const client = new YooKassaClient({ shopId: 's', secretKey: 'k' }, fetchSpy);
    const r = await client.verifyAndFetch({
      type: 'notification',
      event: 'refund.succeeded',
      object: { id: 'rf_1', status: 'succeeded' },
    });
    expect(r.event.event).toBe('refund.succeeded');
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

describe('createYooKassaClient factory', () => {
  it('returns a YooKassaClient instance', () => {
    const client = createYooKassaClient({ shopId: 's', secretKey: 'k' });
    expect(client).toBeInstanceOf(YooKassaClient);
  });
});
