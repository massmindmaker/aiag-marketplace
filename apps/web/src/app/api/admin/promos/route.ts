import { NextRequest, NextResponse } from 'next/server';
import { db, sql } from '@/lib/db';
import { requireAdmin, audit, AdminAuthError } from '@/lib/admin/guard';
import { rowsOf } from '@/lib/admin/rows';

export const dynamic = 'force-dynamic';

const ALLOWED_KINDS = ['percent_off', 'fixed_off', 'free_credit'] as const;
const ALLOWED_APPLIES = ['topup', 'subscription', 'first_topup_only'] as const;

export async function GET() {
  try {
    await requireAdmin();
    const r = await db.execute(sql`
      SELECT id::text, code, description, kind, value::text,
             min_amount_rub::text, max_uses, uses_count, per_user_limit,
             valid_from::text, valid_until::text, applies_to, active, created_at::text
      FROM promo_codes ORDER BY created_at DESC LIMIT 500
    `);
    return NextResponse.json({ promos: rowsOf(r) });
  } catch (e) {
    if (e instanceof AdminAuthError) {
      return NextResponse.json(
        { error: e.code },
        { status: e.code === 'UNAUTHORIZED' ? 401 : 403 }
      );
    }
    return NextResponse.json({ error: 'INTERNAL' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user: admin } = await requireAdmin();
    const body = (await req.json()) as {
      code?: string;
      description?: string | null;
      kind?: string;
      value?: number;
      minAmountRub?: number | null;
      maxUses?: number | null;
      perUserLimit?: number;
      validFrom?: string | null;
      validUntil?: string | null;
      appliesTo?: string;
    };
    const code = (body.code ?? '').trim().toUpperCase();
    if (!code || code.length > 50)
      return NextResponse.json({ error: 'BAD_CODE' }, { status: 400 });
    const kind = body.kind ?? 'percent_off';
    if (!ALLOWED_KINDS.includes(kind as never))
      return NextResponse.json({ error: 'BAD_KIND' }, { status: 400 });
    const appliesTo = body.appliesTo ?? 'topup';
    if (!ALLOWED_APPLIES.includes(appliesTo as never))
      return NextResponse.json({ error: 'BAD_APPLIES' }, { status: 400 });
    const value = Number(body.value);
    if (!Number.isFinite(value) || value < 0)
      return NextResponse.json({ error: 'BAD_VALUE' }, { status: 400 });

    const minAmount = body.minAmountRub != null ? Number(body.minAmountRub) : null;
    const maxUses = body.maxUses != null ? Number(body.maxUses) : null;
    const perUserLimit = Number(body.perUserLimit ?? 1) || 1;
    const validUntil = body.validUntil || null;
    const validFrom = body.validFrom || null;

    const r = await db.execute(sql`
      INSERT INTO promo_codes (
        code, description, kind, value, min_amount_rub, max_uses,
        per_user_limit, valid_from, valid_until, applies_to, active, created_by_email
      ) VALUES (
        ${code}, ${body.description ?? null}, ${kind}, ${value},
        ${minAmount}, ${maxUses}, ${perUserLimit},
        ${validFrom}::timestamptz, ${validUntil}::timestamptz,
        ${appliesTo}, true, ${admin.email}
      )
      RETURNING id::text
    `);
    const id = rowsOf<{ id: string }>(r)[0]?.id;
    await audit(admin.email, 'promo.create', 'promo_code', id ?? null, {
      code,
      kind,
      value,
    });
    return NextResponse.json({ ok: true, id });
  } catch (e) {
    if (e instanceof AdminAuthError) {
      return NextResponse.json(
        { error: e.code },
        { status: e.code === 'UNAUTHORIZED' ? 401 : 403 }
      );
    }
    console.error(e);
    const msg = (e as Error).message ?? '';
    if (msg.includes('duplicate')) {
      return NextResponse.json({ error: 'DUPLICATE_CODE' }, { status: 409 });
    }
    return NextResponse.json({ error: 'INTERNAL' }, { status: 500 });
  }
}
