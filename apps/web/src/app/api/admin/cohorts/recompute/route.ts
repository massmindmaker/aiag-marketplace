import { NextResponse } from 'next/server';
import { db, sql } from '@/lib/db';
import { requireAdmin, audit, AdminAuthError } from '@/lib/admin/guard';
import { MEASUREMENT_DAYS } from '@/lib/growth/cohorts';

export const dynamic = 'force-dynamic';

/**
 * Recompute cohort_snapshots for the last 12 weeks.
 * Uses a single SQL pass per (week, day) — runs synchronously since dataset
 * is bounded (~12 * 7 = 84 rows).
 *
 * The `users` table has `created_at`. "Active" = ≥1 row in `requests` table for
 * that user inside [cohort_start, cohort_start + day]. "Paying" = ≥1 confirmed
 * payment. Revenue = sum of confirmed payments in window.
 */
export async function POST() {
  try {
    const { user: admin } = await requireAdmin();
    let inserted = 0;
    for (let weekIdx = 0; weekIdx < 12; weekIdx++) {
      for (const day of MEASUREMENT_DAYS) {
        await db.execute(sql`
          WITH cohort AS (
            SELECT date_trunc('week', NOW())::date - INTERVAL '7 days' * ${weekIdx} AS week_start
          ),
          c_users AS (
            SELECT u.id, u.created_at
            FROM users u, cohort
            WHERE u.created_at >= cohort.week_start
              AND u.created_at <  cohort.week_start + INTERVAL '7 days'
          ),
          metrics AS (
            SELECT
              (SELECT week_start FROM cohort) AS week,
              COUNT(DISTINCT cu.id) AS registered,
              COUNT(DISTINCT CASE
                WHEN EXISTS (
                  SELECT 1 FROM requests r
                  WHERE r.user_id = cu.id
                    AND r.created_at <= cu.created_at + INTERVAL '1 day' * ${day}
                ) THEN cu.id
              END) AS active,
              COUNT(DISTINCT CASE
                WHEN EXISTS (
                  SELECT 1 FROM payments p
                  WHERE p.user_id = cu.id
                    AND p.status = 'confirmed'
                    AND p.created_at <= cu.created_at + INTERVAL '1 day' * ${day}
                ) THEN cu.id
              END) AS paying,
              COALESCE((
                SELECT SUM(p.amount)::numeric FROM payments p
                JOIN c_users cu2 ON cu2.id = p.user_id
                WHERE p.status = 'confirmed'
                  AND p.created_at <= cu2.created_at + INTERVAL '1 day' * ${day}
              ), 0) AS revenue
            FROM c_users cu
          )
          INSERT INTO cohort_snapshots
            (cohort_week, measurement_day, registered_count, active_count,
             paying_count, total_revenue_rub, computed_at)
          SELECT week, ${day}, registered, active, paying, revenue, NOW()
          FROM metrics
          ON CONFLICT (cohort_week, measurement_day) DO UPDATE SET
            registered_count = EXCLUDED.registered_count,
            active_count = EXCLUDED.active_count,
            paying_count = EXCLUDED.paying_count,
            total_revenue_rub = EXCLUDED.total_revenue_rub,
            computed_at = NOW()
        `);
        inserted++;
      }
    }
    await audit(admin.email, 'cohorts.recompute', 'cohort_snapshots', null, { rows: inserted });
    // Redirect back to the dashboard for form-POST UX
    return NextResponse.redirect(
      new URL('/admin/cohorts', process.env.NEXT_PUBLIC_BASE_URL || 'https://ai-aggregator.ru')
    );
  } catch (e) {
    if (e instanceof AdminAuthError) {
      return NextResponse.json(
        { error: e.code },
        { status: e.code === 'UNAUTHORIZED' ? 401 : 403 }
      );
    }
    console.error(e);
    // Don't block the admin if requests/payments tables differ — return graceful error
    return NextResponse.json(
      { error: 'INTERNAL', message: (e as Error).message },
      { status: 500 }
    );
  }
}
