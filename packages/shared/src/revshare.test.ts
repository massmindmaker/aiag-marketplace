import { describe, it, expect } from 'vitest';
import {
  baseTierForModel,
  resolveStickyVolumeTier,
  resolveRevshareTier,
  authorShareRub,
  VOLUME_THRESHOLD_RUB,
} from './revshare';

describe('baseTierForModel', () => {
  const now = new Date('2026-04-01T00:00:00Z');

  it('returns 70 for platform-hosted', () => {
    expect(baseTierForModel({ hostedBy: 'platform', exclusiveUntil: null, now })).toBe(70);
  });

  it('returns 80 for self-hosted without exclusivity', () => {
    expect(baseTierForModel({ hostedBy: 'author', exclusiveUntil: null, now })).toBe(80);
  });

  it('returns 80 for self-hosted with expired exclusivity', () => {
    expect(
      baseTierForModel({
        hostedBy: 'author',
        exclusiveUntil: new Date('2026-03-01T00:00:00Z'),
        now,
      })
    ).toBe(80);
  });

  it('returns 85 for self-hosted with active exclusivity', () => {
    expect(
      baseTierForModel({
        hostedBy: 'author',
        exclusiveUntil: new Date('2027-01-01T00:00:00Z'),
        now,
      })
    ).toBe(85);
  });
});

describe('resolveStickyVolumeTier', () => {
  it('keeps previous state when <3 months of history', () => {
    expect(
      resolveStickyVolumeTier({ monthlyRevenueRub: [200_000, 200_000], previousSticky: false })
    ).toBe(false);
    expect(
      resolveStickyVolumeTier({ monthlyRevenueRub: [200_000, 200_000], previousSticky: true })
    ).toBe(true);
  });

  it('promotes when 3 consecutive months above threshold', () => {
    expect(
      resolveStickyVolumeTier({
        monthlyRevenueRub: [VOLUME_THRESHOLD_RUB, 150_000, 200_000],
        previousSticky: false,
      })
    ).toBe(true);
  });

  it('demotes when 3 consecutive months below threshold', () => {
    expect(
      resolveStickyVolumeTier({
        monthlyRevenueRub: [50_000, 80_000, 20_000],
        previousSticky: true,
      })
    ).toBe(false);
  });

  it('preserves sticky=true during mixed months (grace period)', () => {
    expect(
      resolveStickyVolumeTier({
        monthlyRevenueRub: [200_000, 50_000, 200_000],
        previousSticky: true,
      })
    ).toBe(true);
  });

  it('preserves sticky=false during mixed months', () => {
    expect(
      resolveStickyVolumeTier({
        monthlyRevenueRub: [50_000, 200_000, 50_000],
        previousSticky: false,
      })
    ).toBe(false);
  });
});

describe('resolveRevshareTier', () => {
  const now = new Date('2026-04-01T00:00:00Z');

  it('bumps baseline 70 to 75 when sticky', () => {
    expect(
      resolveRevshareTier({
        model: { hostedBy: 'platform', exclusiveUntil: null, now },
        volumeSticky: true,
      })
    ).toBe(75);
  });

  it('keeps 70 without sticky', () => {
    expect(
      resolveRevshareTier({
        model: { hostedBy: 'platform', exclusiveUntil: null, now },
        volumeSticky: false,
      })
    ).toBe(70);
  });

  it('does NOT stack volume on top of 80 self-hosted', () => {
    expect(
      resolveRevshareTier({
        model: { hostedBy: 'author', exclusiveUntil: null, now },
        volumeSticky: true,
      })
    ).toBe(80);
  });

  it('keeps 85 exclusive even with sticky', () => {
    expect(
      resolveRevshareTier({
        model: {
          hostedBy: 'author',
          exclusiveUntil: new Date('2027-01-01T00:00:00Z'),
          now,
        },
        volumeSticky: true,
      })
    ).toBe(85);
  });
});

describe('authorShareRub', () => {
  it('computes 70% of margin', () => {
    expect(authorShareRub(1000, 70)).toBe(700);
  });

  it('rounds to kopecks', () => {
    expect(authorShareRub(1000.555, 75)).toBe(750.42);
  });
});
