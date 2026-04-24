import { describe, it, expect } from 'vitest';
import { calcCostRub, calcByokFeeRub } from '../lib/pricing';

describe('pricing.calcCostRub', () => {
  it('base formula: $0.01 × 92 × 1.25 = 1.15 ₽', () => {
    expect(calcCostRub({ upstreamUsd: 0.01, rate: 92, markup: 1.25 })).toBeCloseTo(
      1.15,
      4
    );
  });

  it('batch discount halves cost', () => {
    const full = calcCostRub({ upstreamUsd: 0.01, rate: 92, markup: 1.25 });
    const batch = calcCostRub({
      upstreamUsd: 0.01,
      rate: 92,
      markup: 1.25,
      batchDiscount: 0.5,
    });
    expect(batch).toBeCloseTo(full * 0.5, 4);
  });

  it('prompt caching applies 0.5× only to cached fraction of input', () => {
    // 100% of input cached → caching factor = 0.5
    const cached = calcCostRub({
      upstreamUsd: 0.01,
      rate: 92,
      markup: 1.25,
      cachedInputTokens: 100,
      totalInputTokens: 100,
    });
    const uncached = calcCostRub({ upstreamUsd: 0.01, rate: 92, markup: 1.25 });
    expect(cached).toBeCloseTo(uncached * 0.5, 4);

    // 50% cached → factor = 0.75
    const half = calcCostRub({
      upstreamUsd: 0.01,
      rate: 92,
      markup: 1.25,
      cachedInputTokens: 50,
      totalInputTokens: 100,
    });
    expect(half).toBeCloseTo(uncached * 0.75, 4);
  });

  it('per-upstream markup used (not global fallback) — Yandex 1.08 vs OpenRouter 1.07', () => {
    const y = calcCostRub({ upstreamUsd: 0.01, rate: 92, markup: 1.08 });
    const o = calcCostRub({ upstreamUsd: 0.01, rate: 92, markup: 1.07 });
    expect(y).toBeCloseTo(0.01 * 92 * 1.08, 4);
    expect(o).toBeCloseTo(0.01 * 92 * 1.07, 4);
    expect(y).toBeGreaterThan(o);
  });

  it('calcByokFeeRub returns fixed fee (bypasses markup)', () => {
    expect(calcByokFeeRub()).toBe(0.5);
  });
});
