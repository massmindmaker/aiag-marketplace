/**
 * Cohort retention math — pure functions for testability.
 *
 * A cohort is a set of users who registered in the same ISO-week.
 * Measurement days are fixed: 0, 1, 7, 14, 30, 60, 90.
 */

export const MEASUREMENT_DAYS = [0, 1, 7, 14, 30, 60, 90] as const;
export type MeasurementDay = (typeof MEASUREMENT_DAYS)[number];

/**
 * Return the ISO Monday (week start) for the given date, in UTC.
 * Monday is day 1; Sunday becomes the *previous* Monday.
 */
export function isoWeekStart(d: Date): Date {
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = date.getUTCDay(); // 0=Sun..6=Sat
  const diff = day === 0 ? -6 : 1 - day; // shift to Monday
  date.setUTCDate(date.getUTCDate() + diff);
  return date;
}

/**
 * List the last N ISO-week starts, ordered most-recent-first.
 */
export function lastNCohortWeeks(n: number, today: Date = new Date()): Date[] {
  const weekStart = isoWeekStart(today);
  const weeks: Date[] = [];
  for (let i = 0; i < n; i++) {
    const d = new Date(weekStart);
    d.setUTCDate(d.getUTCDate() - 7 * i);
    weeks.push(d);
  }
  return weeks;
}

export interface CohortRow {
  cohortWeek: string; // YYYY-MM-DD
  measurementDay: number;
  registeredCount: number;
  activeCount: number;
  payingCount: number;
  totalRevenueRub: number;
}

/**
 * Build a heatmap matrix from snapshot rows.
 * Returns rows in DESC order by cohort_week, columns in MEASUREMENT_DAYS order.
 *
 * Mode picks which metric the cell shows: 'active' / 'paying' / 'revenue' / 'arpu'.
 */
export function buildHeatmap(
  rows: CohortRow[],
  mode: 'active' | 'paying' | 'revenue' | 'arpu' = 'active'
): { weeks: string[]; days: number[]; values: (number | null)[][]; sizes: number[] } {
  const weekSet = new Set<string>();
  const byKey = new Map<string, CohortRow>();
  for (const r of rows) {
    weekSet.add(r.cohortWeek);
    byKey.set(`${r.cohortWeek}|${r.measurementDay}`, r);
  }
  const weeks = [...weekSet].sort().reverse();
  const days = [...MEASUREMENT_DAYS] as number[];
  const sizes: number[] = weeks.map((w) => {
    const baseline = byKey.get(`${w}|0`);
    return baseline?.registeredCount ?? 0;
  });
  const values: (number | null)[][] = weeks.map((w, i) => {
    const size = sizes[i] || 0;
    return days.map((d) => {
      const r = byKey.get(`${w}|${d}`);
      if (!r) return null;
      switch (mode) {
        case 'active':
          return size === 0 ? 0 : +((r.activeCount / size) * 100).toFixed(1);
        case 'paying':
          return size === 0 ? 0 : +((r.payingCount / size) * 100).toFixed(1);
        case 'revenue':
          return +Number(r.totalRevenueRub).toFixed(2);
        case 'arpu':
          return size === 0 ? 0 : +(Number(r.totalRevenueRub) / size).toFixed(2);
      }
    });
  });
  return { weeks, days, values, sizes };
}

/**
 * CSV serialization for /admin/cohorts export button.
 */
export function cohortsToCsv(rows: CohortRow[]): string {
  const header = 'cohort_week,measurement_day,registered,active,paying,revenue_rub';
  const lines = rows.map(
    (r) =>
      `${r.cohortWeek},${r.measurementDay},${r.registeredCount},${r.activeCount},${r.payingCount},${r.totalRevenueRub}`
  );
  return [header, ...lines].join('\n');
}
