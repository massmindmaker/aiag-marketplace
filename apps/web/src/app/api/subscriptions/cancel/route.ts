import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getPaymentProvider, type ProviderId } from '@/lib/payments/providers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface CancelBody {
  subscriptionId?: string;
  reason?: string;
  refundAmount?: number;       // optional partial refund (rubles)
  provider?: ProviderId;
  providerPaymentId?: string;  // when refund desired
}

/**
 * POST /api/subscriptions/cancel
 *
 * Cancels active subscription. Per Knowledge/08:
 *   - Within first 14 days  → full refund
 *   - 14+ days, mid-period  → cancel at period end (no refund)
 *   - Manual override via `refundAmount`
 *
 * TODO (Plan 04 schema):
 *   - SELECT subscription by id (verify ownership)
 *   - UPDATE subscriptions SET status='cancelled', cancelledAt=NOW(), cancelAtPeriodEnd=...
 *   - if refund: provider.refund(...)+UPDATE payments.refundedAmount, INSERT balance_transactions
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(
      { error: { message: 'Требуется вход', code: 'UNAUTHORIZED' } },
      { status: 401 }
    );
  }

  const body = (await req.json().catch(() => ({}))) as CancelBody;
  if (!body.subscriptionId) {
    return NextResponse.json(
      { error: { message: 'subscriptionId обязателен', code: 'BAD_REQUEST' } },
      { status: 400 }
    );
  }

  let refundResult: { success: boolean; errorMessage?: string } | null = null;
  if (body.refundAmount && body.providerPaymentId && body.provider) {
    const provider = getPaymentProvider(body.provider);
    refundResult = await provider.refund(
      body.providerPaymentId,
      body.refundAmount,
      body.reason || 'subscription_cancel'
    );
  }

  return NextResponse.json({
    success: true,
    subscriptionId: body.subscriptionId,
    refund: refundResult,
    message: 'Subscription cancellation queued (TODO: persist to DB)',
  });
}
