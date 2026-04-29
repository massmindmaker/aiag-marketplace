import { NextResponse } from 'next/server';
import { db, sql } from '@/lib/db';
import { requireAdmin, AdminAuthError } from '@/lib/admin/guard';
import { rowsOf } from '@/lib/admin/rows';
import { cohortsToCsv, type CohortRow } from '@/lib/growth/cohorts';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await requireAdmin();
    const r = await db.execute(sql`
      SELECT cohort_week::text AS "cohortWeek",
             measurement_day AS "measurementDay",
             registered_count AS "registeredCount",
             active_count AS "activeCount",
             paying_count AS "payingCount",
             total_revenue_rub::text AS "totalRevenueRub"
      FROM cohort_snapshots
      ORDER BY cohort_week DESC, measurement_day ASC
    `);
    const rows = rowsOf<CohortRow>(r).map((x) => ({
      ...x,
      totalRevenueRub: Number(x.totalRevenueRub),
    }));
    const csv = cohortsToCsv(rows);
    return new NextResponse(csv, {
      headers: {
        'content-type': 'text/csv; charset=utf-8',
        'content-disposition': 'attachment; filename="cohorts.csv"',
      },
    });
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
