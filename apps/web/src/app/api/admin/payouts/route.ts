import { NextRequest, NextResponse } from 'next/server';
import { db, sql } from '@/lib/db';
import { requireAdmin, AdminAuthError } from '@/lib/admin/guard';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest) {
  try {
    await requireAdmin();
    const r = await db.execute(sql`
      SELECT
        u.id::text AS user_id,
        u.email,
        COALESCE((SELECT SUM(author_share_rub) FROM author_earnings WHERE author_id = u.id AND status = 'accruing')::text, '0') AS accrued_rub,
        COALESCE((SELECT SUM(amount) FROM payouts WHERE user_id = u.id AND status = 'pending')::text, '0') AS pending_amount
      FROM users u
      WHERE EXISTS (SELECT 1 FROM author_earnings WHERE author_id = u.id)
      ORDER BY accrued_rub DESC NULLS LAST LIMIT 500
    `);
    return NextResponse.json({ rows: (r as unknown as { rows?: unknown[] }).rows ?? r });
  } catch (e) {
    if (e instanceof AdminAuthError) {
      return NextResponse.json({ error: e.code }, { status: e.code === 'UNAUTHORIZED' ? 401 : 403 });
    }
    console.error(e);
    return NextResponse.json({ error: 'INTERNAL' }, { status: 500 });
  }
}
