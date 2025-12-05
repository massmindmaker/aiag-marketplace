import { NextRequest, NextResponse } from 'next/server';
import { tinkoff } from '@/lib/tinkoff';
import { db, eq } from '@/lib/db';
import { payments, subscriptions, balanceTransactions, users } from '@aiag/database/schema';
import type { WebhookNotification } from '@aiag/tinkoff';

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as WebhookNotification;

    // Verify webhook signature
    const webhookData = tinkoff.parseWebhook(payload);

    if (!webhookData.isValid) {
      console.error('Invalid Tinkoff webhook signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // Find payment by Tinkoff payment ID
    const payment = await db.query.payments.findFirst({
      where: eq(payments.tinkoffPaymentId, webhookData.paymentId),
    });

    if (!payment) {
      console.error('Payment not found:', webhookData.paymentId);
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    // Update payment status based on webhook
    const newStatus = mapTinkoffStatus(webhookData.status);

    await db
      .update(payments)
      .set({
        status: newStatus,
        tinkoffStatus: webhookData.status,
        cardPan: webhookData.cardPan,
        tinkoffRebillId: webhookData.rebillId,
        confirmedAt: webhookData.success ? new Date() : undefined,
        updatedAt: new Date(),
      })
      .where(eq(payments.id, payment.id));

    // Handle successful payment
    if (webhookData.success && webhookData.status === 'CONFIRMED') {
      await handleSuccessfulPayment(payment.id, payment.userId, webhookData);
    }

    // Handle refund
    if (webhookData.status === 'REFUNDED' || webhookData.status === 'PARTIAL_REFUNDED') {
      await handleRefund(payment.id, payment.userId, webhookData);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Tinkoff webhook error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function mapTinkoffStatus(tinkoffStatus: string): 'pending' | 'authorized' | 'confirmed' | 'refunded' | 'partial_refunded' | 'cancelled' | 'rejected' | 'failed' {
  const statusMap: Record<string, 'pending' | 'authorized' | 'confirmed' | 'refunded' | 'partial_refunded' | 'cancelled' | 'rejected' | 'failed'> = {
    NEW: 'pending',
    FORM_SHOWED: 'pending',
    AUTHORIZING: 'pending',
    AUTHORIZED: 'authorized',
    CONFIRMING: 'pending',
    CONFIRMED: 'confirmed',
    REVERSING: 'pending',
    PARTIAL_REVERSED: 'partial_refunded',
    REVERSED: 'refunded',
    REFUNDING: 'pending',
    PARTIAL_REFUNDED: 'partial_refunded',
    REFUNDED: 'refunded',
    REJECTED: 'rejected',
    CANCELED: 'cancelled',
    DEADLINE_EXPIRED: 'cancelled',
    AUTH_FAIL: 'failed',
  };

  return statusMap[tinkoffStatus] || 'pending';
}

async function handleSuccessfulPayment(
  paymentId: string,
  userId: string,
  webhookData: ReturnType<typeof tinkoff.parseWebhook>
) {
  // Get current user balance
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (!user) return;

  const currentBalance = parseFloat(user.balance || '0');
  const newBalance = currentBalance + webhookData.amount;

  // Update user balance
  await db
    .update(users)
    .set({
      balance: newBalance.toString(),
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));

  // Create balance transaction
  await db.insert(balanceTransactions).values({
    userId,
    paymentId,
    type: 'deposit',
    amount: webhookData.amount.toString(),
    balanceBefore: currentBalance.toString(),
    balanceAfter: newBalance.toString(),
    description: 'Payment deposit',
    referenceType: 'payment',
    referenceId: paymentId,
  });

  // Update subscription if rebillId is present (recurring payment)
  if (webhookData.rebillId) {
    const payment = await db.query.payments.findFirst({
      where: eq(payments.id, paymentId),
      with: {
        subscription: true,
      },
    });

    if (payment?.subscriptionId) {
      const now = new Date();
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());

      await db
        .update(subscriptions)
        .set({
          status: 'active',
          currentPeriodStart: now,
          currentPeriodEnd: nextMonth,
          tinkoffRebillId: webhookData.rebillId,
          usedRequests: 0,
          usedTokens: 0,
          updatedAt: now,
        })
        .where(eq(subscriptions.id, payment.subscriptionId));
    }
  }
}

async function handleRefund(
  paymentId: string,
  userId: string,
  webhookData: ReturnType<typeof tinkoff.parseWebhook>
) {
  // Get current user balance
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (!user) return;

  const currentBalance = parseFloat(user.balance || '0');
  // Note: For refunds, we might want to reduce the balance if the original payment increased it
  // This depends on business logic

  await db
    .update(payments)
    .set({
      refundedAt: new Date(),
      refundedAmount: webhookData.amount.toString(),
      updatedAt: new Date(),
    })
    .where(eq(payments.id, paymentId));
}
