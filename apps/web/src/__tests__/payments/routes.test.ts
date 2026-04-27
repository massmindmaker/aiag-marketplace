/**
 * High-level route logic tests. We mock @/auth and @/lib/payments/providers
 * to verify route validation, request routing, and response shape.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ----- mocks -----
vi.mock('@/auth', () => ({
  auth: vi.fn(),
}));

const mockInitPayment = vi.fn();
const mockRefund = vi.fn();
vi.mock('@/lib/payments/providers', () => ({
  getPaymentProvider: () => ({
    id: 'tinkoff',
    initPayment: mockInitPayment,
    refund: mockRefund,
  }),
  getTinkoffClient: () => ({ parseWebhook: () => ({ isValid: false, status: 'NEW', orderId: 'x' }) }),
  getYooKassaClient: () => ({ verifyAndFetch: vi.fn() }),
  getTier: (id: string) => {
    const t: Record<string, { name: string; monthly: number; yearly: number; credits: number }> = {
      basic: { name: 'Basic', monthly: 990, yearly: 9900, credits: 1200 },
      starter: { name: 'Starter', monthly: 2490, yearly: 24900, credits: 3200 },
      free: { name: 'Free', monthly: 0, yearly: 0, credits: 200 },
    };
    return t[id] || null;
  },
}));

import { auth } from '@/auth';
import { POST as createSub } from '@/app/api/subscriptions/create/route';
import { POST as cancelSub } from '@/app/api/subscriptions/cancel/route';
import { POST as topup } from '@/app/api/payments/topup/route';
import { POST as adminRefund } from '@/app/api/admin/payments/refund/route';

const mockedAuth = auth as unknown as ReturnType<typeof vi.fn>;

function makeReq(body: unknown): Request {
  return new Request('http://localhost/x', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  mockedAuth.mockReset();
  mockInitPayment.mockReset();
  mockRefund.mockReset();
});

describe('POST /api/subscriptions/create', () => {
  it('rejects unauthenticated', async () => {
    mockedAuth.mockResolvedValue(null);
    const r = await createSub(makeReq({ tierId: 'basic' }) as never);
    expect(r.status).toBe(401);
  });

  it('rejects unknown tier', async () => {
    mockedAuth.mockResolvedValue({ user: { id: 'u1', email: 'x@y' } });
    const r = await createSub(makeReq({ tierId: 'NOPE' }) as never);
    expect(r.status).toBe(400);
    const data = await r.json();
    expect(data.error.code).toBe('BAD_TIER');
  });

  it('rejects free tier (no card needed)', async () => {
    mockedAuth.mockResolvedValue({ user: { id: 'u1' } });
    const r = await createSub(makeReq({ tierId: 'free' }) as never);
    expect(r.status).toBe(400);
    const data = await r.json();
    expect(data.error.code).toBe('FREE_TIER');
  });

  it('returns paymentUrl on successful init', async () => {
    mockedAuth.mockResolvedValue({ user: { id: 'u1', email: 'x@y' } });
    mockInitPayment.mockResolvedValue({
      success: true,
      providerPaymentId: 'pmt_1',
      paymentUrl: 'https://pay.test/x',
      status: 'NEW',
    });
    const r = await createSub(
      makeReq({ tierId: 'basic', provider: 'tinkoff' }) as never
    );
    expect(r.status).toBe(200);
    const data = await r.json();
    expect(data.success).toBe(true);
    expect(data.paymentUrl).toBe('https://pay.test/x');
    expect(data.tier).toBe('Basic');
    expect(data.amount).toBe(990);
  });

  it('uses yearly amount when yearly=true', async () => {
    mockedAuth.mockResolvedValue({ user: { id: 'u1' } });
    mockInitPayment.mockResolvedValue({
      success: true,
      providerPaymentId: 'p',
      paymentUrl: 'https://x',
      status: 'NEW',
    });
    await createSub(
      makeReq({ tierId: 'starter', yearly: true, provider: 'yookassa' }) as never
    );
    const arg = mockInitPayment.mock.calls[0][0];
    expect(arg.amountRub).toBe(24900);
  });

  it('returns 502 on provider failure', async () => {
    mockedAuth.mockResolvedValue({ user: { id: 'u1' } });
    mockInitPayment.mockResolvedValue({
      success: false,
      providerPaymentId: '',
      status: 'REJECTED',
      errorMessage: 'API down',
    });
    const r = await createSub(makeReq({ tierId: 'basic' }) as never);
    expect(r.status).toBe(502);
  });
});

describe('POST /api/subscriptions/cancel', () => {
  it('rejects unauthenticated', async () => {
    mockedAuth.mockResolvedValue(null);
    const r = await cancelSub(makeReq({ subscriptionId: 's1' }) as never);
    expect(r.status).toBe(401);
  });

  it('requires subscriptionId', async () => {
    mockedAuth.mockResolvedValue({ user: { id: 'u1' } });
    const r = await cancelSub(makeReq({}) as never);
    expect(r.status).toBe(400);
  });

  it('cancels without refund', async () => {
    mockedAuth.mockResolvedValue({ user: { id: 'u1' } });
    const r = await cancelSub(makeReq({ subscriptionId: 's_1' }) as never);
    expect(r.status).toBe(200);
    const data = await r.json();
    expect(data.success).toBe(true);
    expect(data.refund).toBeNull();
  });

  it('triggers refund when refundAmount provided', async () => {
    mockedAuth.mockResolvedValue({ user: { id: 'u1' } });
    mockRefund.mockResolvedValue({ success: true, providerRefundId: 'rf_1' });
    const r = await cancelSub(
      makeReq({
        subscriptionId: 's1',
        refundAmount: 990,
        provider: 'tinkoff',
        providerPaymentId: 'pmt_1',
      }) as never
    );
    expect(r.status).toBe(200);
    expect(mockRefund).toHaveBeenCalledWith('pmt_1', 990, expect.any(String));
  });
});

describe('POST /api/payments/topup', () => {
  it('rejects unauthenticated', async () => {
    mockedAuth.mockResolvedValue(null);
    const r = await topup(makeReq({ amountRub: 500 }) as never);
    expect(r.status).toBe(401);
  });

  it('rejects amount below minimum', async () => {
    mockedAuth.mockResolvedValue({ user: { id: 'u1' } });
    const r = await topup(makeReq({ amountRub: 50 }) as never);
    expect(r.status).toBe(400);
    const data = await r.json();
    expect(data.error.code).toBe('BAD_AMOUNT');
  });

  it('rejects amount above ceiling', async () => {
    mockedAuth.mockResolvedValue({ user: { id: 'u1' } });
    const r = await topup(makeReq({ amountRub: 1_000_000 }) as never);
    expect(r.status).toBe(400);
  });

  it('initialises payment for valid amount', async () => {
    mockedAuth.mockResolvedValue({ user: { id: 'u1' } });
    mockInitPayment.mockResolvedValue({
      success: true,
      providerPaymentId: 'pmt_topup',
      paymentUrl: 'https://x.test',
      status: 'NEW',
    });
    const r = await topup(
      makeReq({ amountRub: 2500, provider: 'sbp' }) as never
    );
    expect(r.status).toBe(200);
    const data = await r.json();
    expect(data.amount).toBe(2500);
    expect(data.paymentUrl).toBe('https://x.test');
  });
});

describe('POST /api/admin/payments/refund', () => {
  it('rejects unauthenticated', async () => {
    mockedAuth.mockResolvedValue(null);
    const r = await adminRefund(makeReq({}) as never);
    expect(r.status).toBe(401);
  });

  it('rejects non-admin role when role explicit', async () => {
    mockedAuth.mockResolvedValue({ user: { id: 'u1', role: 'user' } });
    const r = await adminRefund(
      makeReq({
        provider: 'tinkoff',
        providerPaymentId: 'p',
        amount: 100,
      }) as never
    );
    expect(r.status).toBe(403);
  });

  it('rejects missing required fields', async () => {
    mockedAuth.mockResolvedValue({ user: { id: 'u1', role: 'admin' } });
    const r = await adminRefund(makeReq({ provider: 'tinkoff' }) as never);
    expect(r.status).toBe(400);
  });

  it('issues refund through provider', async () => {
    mockedAuth.mockResolvedValue({ user: { id: 'u1', role: 'admin' } });
    mockRefund.mockResolvedValue({ success: true, providerRefundId: 'rf_xx' });
    const r = await adminRefund(
      makeReq({
        provider: 'yookassa',
        providerPaymentId: 'pmt_y',
        amount: 990,
        reason: 'manual',
      }) as never
    );
    expect(r.status).toBe(200);
    const data = await r.json();
    expect(data.refundId).toBe('rf_xx');
    expect(mockRefund).toHaveBeenCalledWith('pmt_y', 990, 'manual');
  });

  it('returns 502 on provider failure', async () => {
    mockedAuth.mockResolvedValue({ user: { id: 'u1', role: 'admin' } });
    mockRefund.mockResolvedValue({ success: false, errorMessage: 'gone' });
    const r = await adminRefund(
      makeReq({ provider: 'tinkoff', providerPaymentId: 'p', amount: 1 }) as never
    );
    expect(r.status).toBe(502);
  });
});
