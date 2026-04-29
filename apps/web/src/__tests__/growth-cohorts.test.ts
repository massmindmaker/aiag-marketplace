/**
 * Phase 13 — cohort retention math tests.
 */
import { describe, it, expect } from 'vitest';
import {
  isoWeekStart,
  lastNCohortWeeks,
  buildHeatmap,
  cohortsToCsv,
  MEASUREMENT_DAYS,
  type CohortRow,
} from '@/lib/growth/cohorts';

describe('isoWeekStart', () => {
  it('returns Monday for a Wednesday', () => {
    // 2026-04-29 is a Wednesday
    const d = new Date('2026-04-29T12:00:00Z');
    const w = isoWeekStart(d);
    expect(w.getUTCDay()).toBe(1); // Monday
    expect(w.toISOString().slice(0, 10)).toBe('2026-04-27');
  });

  it('returns previous Monday for a Sunday', () => {
    const d = new Date('2026-05-03T12:00:00Z'); // Sunday
    const w = isoWeekStart(d);
    expect(w.toISOString().slice(0, 10)).toBe('2026-04-27');
  });
});

describe('lastNCohortWeeks', () => {
  it('returns 12 entries with strictly descending dates', () => {
    const today = new Date('2026-04-29T12:00:00Z');
    const weeks = lastNCohortWeeks(12, today);
    expect(weeks).toHaveLength(12);
    for (let i = 1; i < weeks.length; i++) {
      expect(weeks[i].getTime()).toBeLessThan(weeks[i - 1].getTime());
    }
  });

  it('weeks are exactly 7 days apart', () => {
    const today = new Date('2026-04-29T12:00:00Z');
    const weeks = lastNCohortWeeks(4, today);
    const d = weeks[0].getTime() - weeks[1].getTime();
    expect(d).toBe(7 * 24 * 60 * 60 * 1000);
  });
});

describe('buildHeatmap', () => {
  const rows: CohortRow[] = [
    {
      cohortWeek: '2026-04-27',
      measurementDay: 0,
      registeredCount: 100,
      activeCount: 100,
      payingCount: 10,
      totalRevenueRub: 5000,
    },
    {
      cohortWeek: '2026-04-27',
      measurementDay: 7,
      registeredCount: 100,
      activeCount: 60,
      payingCount: 20,
      totalRevenueRub: 8000,
    },
    {
      cohortWeek: '2026-04-20',
      measurementDay: 0,
      registeredCount: 50,
      activeCount: 50,
      payingCount: 5,
      totalRevenueRub: 2000,
    },
  ];

  it('orders weeks DESC and exposes sizes', () => {
    const h = buildHeatmap(rows, 'active');
    expect(h.weeks[0]).toBe('2026-04-27');
    expect(h.sizes[0]).toBe(100);
    expect(h.sizes[1]).toBe(50);
  });

  it('computes active % correctly', () => {
    const h = buildHeatmap(rows, 'active');
    // 2026-04-27 D0 = 100/100 = 100, D7 = 60/100 = 60
    const d0Idx = MEASUREMENT_DAYS.indexOf(0);
    const d7Idx = MEASUREMENT_DAYS.indexOf(7);
    expect(h.values[0][d0Idx]).toBe(100);
    expect(h.values[0][d7Idx]).toBe(60);
  });

  it('computes paying % correctly', () => {
    const h = buildHeatmap(rows, 'paying');
    const d7Idx = MEASUREMENT_DAYS.indexOf(7);
    expect(h.values[0][d7Idx]).toBe(20);
  });

  it('returns null cells for missing measurements', () => {
    const h = buildHeatmap(rows, 'active');
    const d30Idx = MEASUREMENT_DAYS.indexOf(30);
    expect(h.values[0][d30Idx]).toBeNull();
  });

  it('arpu mode divides revenue by registered', () => {
    const h = buildHeatmap(rows, 'arpu');
    const d7Idx = MEASUREMENT_DAYS.indexOf(7);
    expect(h.values[0][d7Idx]).toBe(80); // 8000 / 100
  });
});

describe('cohortsToCsv', () => {
  it('produces a CSV header and rows', () => {
    const csv = cohortsToCsv([
      {
        cohortWeek: '2026-04-27',
        measurementDay: 0,
        registeredCount: 10,
        activeCount: 10,
        payingCount: 1,
        totalRevenueRub: 500,
      },
    ]);
    expect(csv).toContain('cohort_week,measurement_day');
    expect(csv).toContain('2026-04-27,0,10,10,1,500');
  });
});
