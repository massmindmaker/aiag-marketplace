import * as React from 'react';
import { db, sql } from '@/lib/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { rowsOf } from '@/lib/admin/rows';
import { buildHeatmap, MEASUREMENT_DAYS, type CohortRow } from '@/lib/growth/cohorts';
import { CohortHeatmap } from './CohortHeatmap';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Когорты — AIAG Admin' };

async function fetchSnapshots(): Promise<CohortRow[]> {
  try {
    const r = await db.execute(sql`
      SELECT cohort_week::text AS "cohortWeek",
             measurement_day AS "measurementDay",
             registered_count AS "registeredCount",
             active_count AS "activeCount",
             paying_count AS "payingCount",
             total_revenue_rub::text AS "totalRevenueRub"
      FROM cohort_snapshots
      WHERE cohort_week >= NOW() - INTERVAL '13 weeks'
      ORDER BY cohort_week DESC, measurement_day ASC
    `);
    return rowsOf<CohortRow>(r).map((row) => ({
      ...row,
      totalRevenueRub: Number(row.totalRevenueRub),
    }));
  } catch (e) {
    console.error('[admin/cohorts] fetch failed', e);
    return [];
  }
}

export default async function AdminCohortsPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string }>;
}) {
  const sp = await searchParams;
  const mode =
    (sp.mode as 'active' | 'paying' | 'revenue' | 'arpu' | undefined) ?? 'active';
  const rows = await fetchSnapshots();
  const heatmap = buildHeatmap(rows, mode);

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Когорты</h1>
        <div className="flex gap-2 items-center">
          <form method="GET" className="flex gap-2">
            <select
              name="mode"
              defaultValue={mode}
              className="border rounded-md px-3 py-1 bg-background text-sm"
            >
              <option value="active">% активных</option>
              <option value="paying">% оплативших</option>
              <option value="revenue">Выручка ₽</option>
              <option value="arpu">ARPU ₽</option>
            </select>
            <button type="submit" className="px-3 py-1 rounded-md border text-sm">
              Применить
            </button>
          </form>
          <a
            href="/api/admin/cohorts/export"
            className="px-3 py-1 rounded-md border text-sm hover:bg-muted/40"
          >
            Экспорт CSV
          </a>
          <form method="POST" action="/api/admin/cohorts/recompute">
            <button
              type="submit"
              className="px-3 py-1 rounded-md bg-amber-500 text-black text-sm font-medium hover:bg-amber-400"
            >
              Пересчитать
            </button>
          </form>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">
            Retention за последние 12 недель —{' '}
            {mode === 'active'
              ? '% активных в окне'
              : mode === 'paying'
              ? '% оплативших'
              : mode === 'revenue'
              ? 'Выручка ₽'
              : 'ARPU ₽'}
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <CohortHeatmap heatmap={heatmap} mode={mode} days={[...MEASUREMENT_DAYS]} />
        </CardContent>
      </Card>

      {rows.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Снимков пока нет. Нажмите «Пересчитать» — запустит пересчёт за последние 12 недель.
        </p>
      )}
    </div>
  );
}
