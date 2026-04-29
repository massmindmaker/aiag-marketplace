import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db, sql } from '@/lib/db';
import { rowsOf } from '@/lib/admin/rows';
import { applyPromo, type PromoCode } from '@/lib/growth/promo';

export const dynamic = 'force-dynamic';

/**
 * POST /api/promo/validate { code, amountRub }
 *
 * Returns the discount preview without persisting anything. Actual redemption
 * happens server-side at payment confirmation in the webhook handler.
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ ok: false, reason: 'UNAUTHORIZED' }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    code?: string;
    amountRub?: number;
  };
  const code = (body.code ?? '').trim().toUpperCase();
  const amount = Number(body.amountRub);
  if (!code) return NextResponse.json({ ok: false, reason: 'BAD_CODE' }, { status: 400 });
  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ ok: false, reason: 'BAD_AMOUNT' }, { status: 400 });
  }

  // Look up promo
  const r = await db.execute(sql`
    SELECT id::text, code, kind, value::text AS value, min_amount_rub::text AS min_amount_rub,
           max_uses, uses_count, per_user_limit,
           valid_from::text AS valid_from, valid_until::text AS valid_until,
           applies_to, active
    FROM promo_codes WHERE code = ${code} LIMIT 1
  `);
  const row = rowsOf<{
    id: string;
    code: string;
    kind: 'percent_off' | 'fixed_off' | 'free_credit';
    value: string;
    min_amount_rub: string | null;
    max_uses: number | null;
    uses_count: number;
    per_user_limit: number;
    valid_from: string | null;
    valid_until: string | null;
    applies_to: 'topup' | 'subscription' | 'first_topup_only';
    active: boolean;
  }>(r)[0];
  if (!row) return NextResponse.json({ ok: false, reason: 'NOT_FOUND' }, { status: 404 });

  // Look up user redemptions count + prior topups
  const userId = (session.user as { id?: string }).id;
  let userRedemptionsCount = 0;
  let userHasPriorTopups = false;
  if (userId) {
    const ur = await db.execute(sql`
      SELECT COUNT(*)::int AS c FROM promo_redemptions
      WHERE promo_id = ${row.id}::uuid AND user_id = ${userId}::uuid
    `);
    userRedemptionsCount = Number(rowsOf<{ c: number }>(ur)[0]?.c ?? 0);
    const tr = await db.execute(sql`
      SELECT EXISTS(
        SELECT 1 FROM payments WHERE user_id = ${userId}::uuid AND status = 'confirmed' LIMIT 1
      ) AS has
    `);
    userHasPriorTopups = !!rowsOf<{ has: boolean }>(tr)[0]?.has;
  }

  const promo: PromoCode = {
    id: row.id,
    code: row.code,
    kind: row.kind,
    value: Number(row.value),
    minAmountRub: row.min_amount_rub != null ? Number(row.min_amount_rub) : null,
    maxUses: row.max_uses,
    usesCount: row.uses_count,
    perUserLimit: row.per_user_limit,
    validFrom: row.valid_from,
    validUntil: row.valid_until,
    appliesTo: row.applies_to,
    active: row.active,
  };

  const result = applyPromo(promo, {
    amountRub: amount,
    userRedemptionsCount,
    userHasPriorTopups,
  });
  return NextResponse.json(result);
}
