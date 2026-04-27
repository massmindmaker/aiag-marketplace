import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getPaymentProvider, type ProviderId } from '@/lib/payments/providers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface TopupBody {
  amountRub?: number;
  provider?: ProviderId;
  email?: string;
  phone?: string;
}

const MIN_TOPUP = 100;     // 100 ₽
const MAX_TOPUP = 100000;  // 100 000 ₽ — single-shot guardrail

/**
 * POST /api/payments/topup
 *
 * Pay-per-use balance top-up. On webhook success → org.payg_credits += amount.
 *
 * TODO (Plan 04 schema):
 *   - INSERT payments row { type='topup', status='pending', amount }
 *   - On webhook succeeded: UPDATE organizations SET payg_credits += amount
 *   - INSERT balance_transactions row
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(
      { error: { message: 'Требуется вход', code: 'UNAUTHORIZED' } },
      { status: 401 }
    );
  }

  const body = (await req.json().catch(() => ({}))) as TopupBody;
  const amount = Number(body.amountRub);
  if (!Number.isFinite(amount) || amount < MIN_TOPUP || amount > MAX_TOPUP) {
    return NextResponse.json(
      {
        error: {
          message: `Сумма должна быть от ${MIN_TOPUP} до ${MAX_TOPUP} ₽`,
          code: 'BAD_AMOUNT',
        },
      },
      { status: 400 }
    );
  }

  const providerId: ProviderId = body.provider || 'tinkoff';
  const provider = getPaymentProvider(providerId);
  const orderId = `topup_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://ai-aggregator.ru';

  const result = await provider.initPayment({
    orderId,
    amountRub: amount,
    description: `Пополнение баланса AIAG: ${amount} ₽`,
    returnUrl: `${baseUrl}/dashboard/billing?status=success&order=${orderId}`,
    notificationUrl: `${baseUrl}/api/subscriptions/webhook/${providerId}`,
    email: body.email || (session.user as { email?: string }).email,
    phone: body.phone,
    metadata: {
      user_id: String((session.user as { id?: string }).id || ''),
      kind: 'topup',
    },
  });

  if (!result.success) {
    return NextResponse.json(
      { error: { message: result.errorMessage || 'Payment init failed', code: 'INIT_FAILED' } },
      { status: 502 }
    );
  }

  return NextResponse.json({
    success: true,
    orderId,
    paymentId: result.providerPaymentId,
    paymentUrl: result.paymentUrl,
    qrPayload: result.qrPayload,
    provider: providerId,
    amount,
  });
}
