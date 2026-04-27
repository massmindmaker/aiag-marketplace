import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getPaymentProvider, getTier, type ProviderId } from '@/lib/payments/providers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface CreateSubBody {
  tierId?: string;          // 'basic' | 'starter' | 'pro'
  yearly?: boolean;
  provider?: ProviderId;    // 'tinkoff' | 'yookassa' | 'sbp'
  email?: string;
  phone?: string;
}

/**
 * POST /api/subscriptions/create
 *
 * Creates a pending payment via selected provider, returns the redirect URL or
 * SBP QR payload. Webhook (`/api/subscriptions/webhook/[provider]`) marks the
 * subscription `active` on success.
 *
 * TODO (Plan 04 schema):
 *   - INSERT subscriptions row with status='pending' before creating payment
 *   - INSERT payments row with provider+orderId+pendingstatus
 *   - subscription/payment id round-trip via metadata.order_id
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(
      { error: { message: 'Требуется вход', code: 'UNAUTHORIZED' } },
      { status: 401 }
    );
  }

  const body = (await req.json().catch(() => ({}))) as CreateSubBody;
  const tier = getTier(body.tierId || '');
  if (!tier) {
    return NextResponse.json(
      { error: { message: 'Unknown tier', code: 'BAD_TIER' } },
      { status: 400 }
    );
  }
  if (tier.monthly === 0) {
    return NextResponse.json(
      { error: { message: 'Free tier — карта не нужна', code: 'FREE_TIER' } },
      { status: 400 }
    );
  }

  const providerId: ProviderId = body.provider || 'tinkoff';
  const provider = getPaymentProvider(providerId);

  const amount = body.yearly ? tier.yearly : tier.monthly;
  const orderId = `sub_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://ai-aggregator.ru';

  const result = await provider.initPayment({
    orderId,
    amountRub: amount,
    description: `Подписка ${tier.name} (${body.yearly ? 'год' : 'месяц'})`,
    returnUrl: `${baseUrl}/dashboard/billing?status=success&order=${orderId}`,
    notificationUrl: `${baseUrl}/api/subscriptions/webhook/${providerId}`,
    email: body.email || (session.user as { email?: string }).email,
    phone: body.phone,
    metadata: {
      user_id: String((session.user as { id?: string }).id || ''),
      tier_id: body.tierId!,
      billing: body.yearly ? 'yearly' : 'monthly',
    },
    recurrent: !body.yearly, // monthly → enable recurring rebill
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
    tier: tier.name,
  });
}
