import { NextRequest, NextResponse } from 'next/server';
import { db, sql } from '@/lib/db';
import { requireAdmin, audit, AdminAuthError } from '@/lib/admin/guard';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { user: admin } = await requireAdmin();
    const body = (await req.json()) as { userIds?: string[] };
    const ids = body.userIds ?? [];
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'NO_IDS' }, { status: 400 });
    }

    let created = 0;
    for (const userId of ids) {
      // Sum locked accruals into a single payout row
      const result = await db.execute(sql`
        WITH agg AS (
          SELECT COALESCE(SUM(author_share_rub), 0)::numeric AS total,
                 MIN(period_month) AS min_p, MAX(period_month) AS max_p
          FROM author_earnings WHERE author_id = ${userId} AND status = 'accruing'
        )
        INSERT INTO payouts (user_id, amount, currency, status, period_start, period_end, metadata)
        SELECT ${userId}::uuid, total, 'RUB', 'processing',
               COALESCE(min_p::timestamp, NOW()), COALESCE(max_p::timestamp, NOW()),
               jsonb_build_object('initiated_by', ${admin.email}, 'bulk', true)
        FROM agg WHERE total > 0
        RETURNING id::text
      `);
      const rows = (result as unknown as { rows?: unknown[] }).rows ?? result;
      if (Array.isArray(rows) && rows.length > 0) {
        created++;
        // Lock the earnings so they're not double-paid
        await db.execute(sql`
          UPDATE author_earnings SET status = 'locked'
          WHERE author_id = ${userId} AND status = 'accruing'
        `);
        await audit(admin.email, 'payout.process', 'user', userId, {});
      }
    }

    return NextResponse.json({ ok: true, created });
  } catch (e) {
    if (e instanceof AdminAuthError) {
      return NextResponse.json({ error: e.code }, { status: e.code === 'UNAUTHORIZED' ? 401 : 403 });
    }
    console.error(e);
    return NextResponse.json({ error: 'INTERNAL', message: (e as Error).message }, { status: 500 });
  }
}
