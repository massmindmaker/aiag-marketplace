/**
 * Plan 07 Task 11 — revshare tier resolution.
 *
 * 4 tiers (spec §4.3):
 *   70% — baseline (Path 2 pass-through, hosted_by='platform')
 *   75% — volume sticky: 3 consecutive months >= 100_000 RUB author total revenue.
 *          Stays sticky until 3 consecutive months < 100_000 (grace).
 *   80% — self-hosted (hosted_by='author')
 *   85% — exclusive self-hosted (hosted_by='author' AND exclusive_until > now())
 *
 * Exported as pure functions so they can be unit-tested without a DB.
 * The cron settlement job (Task 17) loads month-by-month revenue from
 * `author_earnings` and feeds it into `resolveStickyVolumeTier`.
 */

export const VOLUME_THRESHOLD_RUB = 100_000;
export const VOLUME_STICKY_MONTHS = 3;

export type HostedBy = 'platform' | 'author';

export interface ModelTierInput {
  hostedBy: HostedBy;
  exclusiveUntil: Date | null;
  now?: Date;
}

/**
 * Base tier derived from model hosting setup (before sticky volume bump).
 * Returns 70, 80, or 85.
 */
export function baseTierForModel(input: ModelTierInput): 70 | 80 | 85 {
  const now = input.now ?? new Date();
  if (input.hostedBy === 'author') {
    if (input.exclusiveUntil && input.exclusiveUntil.getTime() > now.getTime()) {
      return 85;
    }
    return 80;
  }
  return 70;
}

/**
 * Given a chronologically-ordered list of monthly gross revenue totals
 * (most recent LAST) and the previous sticky state, decide whether
 * the 75% volume tier is currently active.
 *
 * Rules:
 *   - Promote to sticky=true when the last VOLUME_STICKY_MONTHS entries
 *     are all >= VOLUME_THRESHOLD_RUB.
 *   - Demote to sticky=false when the last VOLUME_STICKY_MONTHS entries
 *     are all < VOLUME_THRESHOLD_RUB.
 *   - Otherwise preserve previousSticky.
 */
export function resolveStickyVolumeTier(opts: {
  monthlyRevenueRub: number[];
  previousSticky: boolean;
}): boolean {
  const { monthlyRevenueRub, previousSticky } = opts;
  if (monthlyRevenueRub.length < VOLUME_STICKY_MONTHS) {
    return previousSticky;
  }
  const recent = monthlyRevenueRub.slice(-VOLUME_STICKY_MONTHS);
  const allAbove = recent.every((r) => r >= VOLUME_THRESHOLD_RUB);
  if (allAbove) return true;
  const allBelow = recent.every((r) => r < VOLUME_THRESHOLD_RUB);
  if (allBelow) return false;
  return previousSticky;
}

/**
 * Final tier for a given model + author at a point in time.
 * Combines model base tier with sticky volume bump.
 *
 * The 75% tier only bumps the 70% baseline (self-hosted 80/85 already
 * beat it, so volume doesn't stack on top).
 */
export function resolveRevshareTier(input: {
  model: ModelTierInput;
  volumeSticky: boolean;
}): 70 | 75 | 80 | 85 {
  const base = baseTierForModel(input.model);
  if (base === 70 && input.volumeSticky) return 75;
  return base;
}

/**
 * Compute the author's share (in RUB) for a given gross margin.
 * tier is 70|75|80|85 percent.
 */
export function authorShareRub(marginRub: number, tierPct: number): number {
  return Math.round(marginRub * tierPct) / 100;
}
