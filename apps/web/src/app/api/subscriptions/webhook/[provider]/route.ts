import { NextRequest, NextResponse } from 'next/server';
import { getTinkoffClient, getYooKassaClient, type ProviderId } from '@/lib/payments/providers';
import { isYooKassaIp, mapYooKassaStatus } from '@aiag/yookassa';
import { isFinalStatus, isSuccessfulStatus } from '@aiag/tinkoff';
import type { WebhookNotification as TinkoffWebhook } from '@aiag/tinkoff';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/subscriptions/webhook/[provider]
 *
 * Provider-agnostic webhook handler. Verifies signature/identity, normalizes
 * to internal status, then settles subscription credits.
 *
 * Tinkoff:  HMAC token signature in payload.Token
 * YooKassa: IP whitelist + re-fetch payment by id
 *
 * TODO (Plan 04 schema):
 *   - INSERT payment_webhook_logs row (raw payload + signatureValid)
 *   - SELECT payment by metadata.order_id
 *   - On succeeded: UPDATE payments.status, UPDATE subscriptions.status='active',
 *     UPDATE organizations.subscription_credits += tier.credits,
 *     INSERT balance_transactions (type='deposit')
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { provider: string } }
) {
  const provider = params.provider as ProviderId;

  if (provider === 'tinkoff') {
    return handleTinkoffWebhook(req);
  }
  if (provider === 'yookassa' || provider === 'sbp') {
    return handleYooKassaWebhook(req);
  }

  return NextResponse.json(
    { error: { message: 'Unknown provider', code: 'UNKNOWN_PROVIDER' } },
    { status: 400 }
  );
}

async function handleTinkoffWebhook(req: NextRequest) {
  let payload: TinkoffWebhook;
  try {
    payload = (await req.json()) as TinkoffWebhook;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const client = getTinkoffClient();
  const parsed = client.parseWebhook(payload);
  if (!parsed.isValid) {
    console.warn('[webhook/tinkoff] invalid signature', { orderId: parsed.orderId });
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  console.log('[webhook/tinkoff] verified', {
    orderId: parsed.orderId,
    status: parsed.status,
    final: isFinalStatus(parsed.status),
    success: isSuccessfulStatus(parsed.status),
  });

  // TODO: persist + settle. For now respond OK.
  // Tinkoff requires plain "OK" body for success.
  return new NextResponse('OK', { status: 200 });
}

async function handleYooKassaWebhook(req: NextRequest) {
  // IP whitelist check (best-effort: trust X-Forwarded-For if present)
  const xff = req.headers.get('x-forwarded-for');
  const ip = (xff ? xff.split(',')[0] : null) || req.headers.get('x-real-ip') || '';
  if (process.env.YOOKASSA_ENFORCE_IP === 'true' && ip && !isYooKassaIp(ip)) {
    console.warn('[webhook/yookassa] rejected non-whitelisted IP', { ip });
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  try {
    const client = getYooKassaClient();
    const { event, object } = await client.verifyAndFetch(payload);

    const internalStatus = mapYooKassaStatus(object.status);
    console.log('[webhook/yookassa] verified', {
      event: event.event,
      paymentId: object.id,
      status: object.status,
      internal: internalStatus,
      orderId: object.metadata?.order_id,
    });

    // TODO: persist + settle credits.
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('[webhook/yookassa] verify failed', e);
    return NextResponse.json({ error: 'Verification failed' }, { status: 400 });
  }
}
