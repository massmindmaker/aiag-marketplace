import { NextRequest, NextResponse } from 'next/server';
import { db, sql } from '@/lib/db';
import { requireAdmin, AdminAuthError } from '@/lib/admin/guard';
import { rowsOf } from '@/lib/admin/rows';

export const dynamic = 'force-dynamic';

function err(e: unknown) {
  if (e instanceof AdminAuthError) {
    return NextResponse.json({ error: e.code }, { status: e.code === 'UNAUTHORIZED' ? 401 : 403 });
  }
  console.error(e);
  return NextResponse.json({ error: 'INTERNAL' }, { status: 500 });
}

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const sp = req.nextUrl.searchParams;
    const status = sp.get('status');
    const upstream = sp.get('upstream');
    const now = Date.now();
    const to = sp.get('to') ? new Date(sp.get('to')!) : new Date(now);
    const from = sp.get('from') ? new Date(sp.get('from')!) : new Date(now - 7 * 24 * 3600_000);

    const r = await db.execute(sql`
      SELECT j.id::text AS id, j.task_id, j.status, j.upstream_id, j.model_slug,
             j.created_at, j.completed_at,
             j.cost_rub::text AS cost_rub
      FROM prediction_jobs j
      WHERE j.created_at >= ${from.toISOString()}::timestamptz
        AND j.created_at <= ${to.toISOString()}::timestamptz
        AND (${status}::text IS NULL OR j.status = ${status})
        AND (${upstream}::text IS NULL OR j.upstream_id = ${upstream})
      ORDER BY j.created_at DESC
      LIMIT 200
    `);
    return NextResponse.json({ jobs: rowsOf(r) });
  } catch (e) {
    return err(e);
  }
}
