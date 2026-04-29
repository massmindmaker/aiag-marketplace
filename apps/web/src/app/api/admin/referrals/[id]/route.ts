import { NextRequest, NextResponse } from 'next/server';
import { db, sql } from '@/lib/db';
import { requireAdmin, audit, AdminAuthError } from '@/lib/admin/guard';
import { rowsOf } from '@/lib/admin/rows';

export const dynamic = 'force-dynamic';

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { user: admin } = await requireAdmin();
    const { id } = await ctx.params;
    const body = (await req.json()) as { op: 'pay' | 'flag' | 'unflag' };

    const r = await db.execute(sql`
      SELECT id::text, referrer_user_id::text AS referrer, referred_user_id::text AS referred,
             bonus_referrer_rub::text AS bref, bonus_referred_rub::text AS bnew,
             paid_out, fraud_flagged
      FROM referral_redemptions WHERE id = ${id} LIMIT 1
    `);
    const row = rowsOf<{
      id: string;
      referrer: string;
      referred: string;
      bref: string;
      bnew: string;
      paid_out: boolean;
      fraud_flagged: boolean;
    }>(r)[0];
    if (!row) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });

    if (body.op === 'pay') {
      if (row.paid_out)
        return NextResponse.json({ error: 'ALREADY_PAID' }, { status: 400 });
      if (row.fraud_flagged)
        return NextResponse.json({ error: 'FRAUD_FLAGGED' }, { status: 400 });
      await db.execute(sql`
        UPDATE referral_redemptions
        SET paid_out = true, paid_out_at = NOW()
        WHERE id = ${id} AND paid_out = false
      `);
      await db.execute(sql`
        UPDATE users SET balance =
          (COALESCE(NULLIF(balance,'')::numeric, 0) + ${row.bref}::numeric)::text
        WHERE id = ${row.referrer}
      `);
      await db.execute(sql`
        UPDATE users SET balance =
          (COALESCE(NULLIF(balance,'')::numeric, 0) + ${row.bnew}::numeric)::text
        WHERE id = ${row.referred}
      `);
      await audit(admin.email, 'referral.pay', 'referral_redemption', id, {
        bonus_referrer_rub: row.bref,
        bonus_referred_rub: row.bnew,
      });
    } else if (body.op === 'flag') {
      await db.execute(sql`
        UPDATE referral_redemptions SET fraud_flagged = true, fraud_reason = 'manual' WHERE id = ${id}
      `);
      await audit(admin.email, 'referral.flag', 'referral_redemption', id, {});
    } else if (body.op === 'unflag') {
      await db.execute(sql`
        UPDATE referral_redemptions SET fraud_flagged = false, fraud_reason = NULL WHERE id = ${id}
      `);
      await audit(admin.email, 'referral.unflag', 'referral_redemption', id, {});
    } else {
      return NextResponse.json({ error: 'UNKNOWN_OP' }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof AdminAuthError) {
      return NextResponse.json(
        { error: e.code },
        { status: e.code === 'UNAUTHORIZED' ? 401 : 403 }
      );
    }
    console.error(e);
    return NextResponse.json({ error: 'INTERNAL' }, { status: 500 });
  }
}
