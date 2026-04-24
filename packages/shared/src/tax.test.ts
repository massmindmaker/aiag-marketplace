import { describe, it, expect } from 'vitest';
import {
  computeWithholding,
  computeWithholdingNdfl,
  taxStatusForMethod,
  MIN_PAYOUT_RUB,
} from './tax';

describe('taxStatusForMethod', () => {
  it('maps each method to correct status', () => {
    expect(taxStatusForMethod('card_ru')).toBe('physical_person');
    expect(taxStatusForMethod('smz_check')).toBe('self_employed');
    expect(taxStatusForMethod('ip_account')).toBe('ie');
    expect(taxStatusForMethod('ooo_account')).toBe('ltd');
  });
});

describe('computeWithholdingNdfl', () => {
  it('applies 13% below threshold', () => {
    expect(computeWithholdingNdfl(100_000, 0)).toBeCloseTo(13_000, 2);
  });

  it('applies 15% fully above threshold', () => {
    // cumulativeYtd already above 5M → entire amount taxed at 15%
    expect(computeWithholdingNdfl(100_000, 6_000_000)).toBeCloseTo(15_000, 2);
  });

  it('splits progressive across threshold', () => {
    // ytd 4.9M, payout 200k → 100k at 13% (= 13_000) + 100k at 15% (= 15_000) = 28_000
    expect(computeWithholdingNdfl(200_000, 4_900_000)).toBeCloseTo(28_000, 2);
  });

  it('returns 0 for zero gross', () => {
    expect(computeWithholdingNdfl(0, 0)).toBe(0);
  });
});

describe('computeWithholding', () => {
  it('withholds NDFL for card_ru', () => {
    const r = computeWithholding({
      grossAmountRub: 10_000,
      method: 'card_ru',
      cumulativeYtdRub: 0,
    });
    expect(r.withholdingRub).toBeCloseTo(1_300, 2);
    expect(r.netRub).toBeCloseTo(8_700, 2);
    expect(r.rule).toBe('ndfl_progressive');
  });

  it('passes through self_employed (no withholding)', () => {
    const r = computeWithholding({
      grossAmountRub: 10_000,
      method: 'smz_check',
      cumulativeYtdRub: 0,
    });
    expect(r.withholdingRub).toBe(0);
    expect(r.netRub).toBe(10_000);
    expect(r.rule).toBe('self_employed_pass_through');
  });

  it('passes through IE/LTD (invoice)', () => {
    const r = computeWithholding({
      grossAmountRub: 50_000,
      method: 'ip_account',
      cumulativeYtdRub: 0,
    });
    expect(r.withholdingRub).toBe(0);
    expect(r.netRub).toBe(50_000);
    expect(r.rule).toBe('business_invoice');
  });
});

describe('MIN_PAYOUT_RUB', () => {
  it('is set to 1000 RUB', () => {
    expect(MIN_PAYOUT_RUB).toBe(1000);
  });
});
