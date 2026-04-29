import { NextRequest, NextResponse } from 'next/server';
import { db, sql } from '@/lib/db';
import { requireAdmin, audit, AdminAuthError } from '@/lib/admin/guard';

export const dynamic = 'force-dynamic';

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { user: admin } = await requireAdmin();
    const { id } = await ctx.params;
    const body = (await req.json()) as { active?: boolean };

    if (typeof body.active === 'boolean') {
      await db.execute(sql`UPDATE promo_codes SET active = ${body.active} WHERE id = ${id}`);
      await audit(admin.email, 'promo.toggle', 'promo_code', id, { active: body.active });
    } else {
      return NextResponse.json({ error: 'NO_OP' }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
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
