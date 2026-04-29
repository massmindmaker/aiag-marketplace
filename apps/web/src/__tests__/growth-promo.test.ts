/**
 * Phase 13 — promo code application math tests.
 */
import { describe, it, expect } from 'vitest';
import { applyPromo, type PromoCode } from '@/lib/growth/promo';

const base: PromoCode = {
  id: 'p1',
  code: 'TEST',
  kind: 'percent_off',
  value: 50,
  minAmountRub: null,
  maxUses: null,
  usesCount: 0,
  perUserLimit: 1,
  validFrom: null,
  validUntil: null,
  appliesTo: 'topup',
  active: true,
};

describe('applyPromo — percent_off', () => {
  it('halves the amount for 50% off', () => {
    const r = applyPromo(base, {
      amountRub: 1000,
      userRedemptionsCount: 0,
      userHasPriorTopups: false,
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.discountRub).toBe(500);
      expect(r.chargeRub).toBe(500);
      expect(r.creditRub).toBe(0);
    }
  });

  it('caps discount at amount (cannot go negative)', () => {
    const r = applyPromo({ ...base, value: 200 }, {
      amountRub: 100,
      userRedemptionsCount: 0,
      userHasPriorTopups: false,
    });
    expect(r.ok && r.discountRub).toBe(100);
    if (r.ok) expect(r.chargeRub).toBe(0);
  });
});

describe('applyPromo — fixed_off', () => {
  it('subtracts fixed amount', () => {
    const r = applyPromo({ ...base, kind: 'fixed_off', value: 200 }, {
      amountRub: 1000,
      userRedemptionsCount: 0,
      userHasPriorTopups: false,
    });
    expect(r.ok && r.chargeRub).toBe(800);
  });

  it('caps fixed_off at amount', () => {
    const r = applyPromo({ ...base, kind: 'fixed_off', value: 5000 }, {
      amountRub: 200,
      userRedemptionsCount: 0,
      userHasPriorTopups: false,
    });
    expect(r.ok && r.chargeRub).toBe(0);
  });
});

describe('applyPromo — free_credit', () => {
  it('adds credit without reducing charge', () => {
    const r = applyPromo({ ...base, kind: 'free_credit', value: 100 }, {
      amountRub: 500,
      userRedemptionsCount: 0,
      userHasPriorTopups: false,
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.chargeRub).toBe(500);
      expect(r.creditRub).toBe(100);
      expect(r.discountRub).toBe(0);
    }
  });
});

describe('applyPromo — gating', () => {
  it('rejects inactive promo', () => {
    const r = applyPromo({ ...base, active: false }, {
      amountRub: 1000,
      userRedemptionsCount: 0,
      userHasPriorTopups: false,
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('NOT_ACTIVE');
  });

  it('rejects expired promo', () => {
    const r = applyPromo({ ...base, validUntil: '2020-01-01' }, {
      amountRub: 1000,
      userRedemptionsCount: 0,
      userHasPriorTopups: false,
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('EXPIRED');
  });

  it('rejects below-min amount', () => {
    const r = applyPromo({ ...base, minAmountRub: 500 }, {
      amountRub: 200,
      userRedemptionsCount: 0,
      userHasPriorTopups: false,
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('BELOW_MIN');
  });

  it('rejects per-user limit exceeded', () => {
    const r = applyPromo(base, {
      amountRub: 1000,
      userRedemptionsCount: 1,
      userHasPriorTopups: false,
    });
    if (!r.ok) expect(r.reason).toBe('PER_USER_LIMIT');
  });

  it('rejects exhausted (max_uses reached)', () => {
    const r = applyPromo({ ...base, maxUses: 5, usesCount: 5 }, {
      amountRub: 1000,
      userRedemptionsCount: 0,
      userHasPriorTopups: false,
    });
    if (!r.ok) expect(r.reason).toBe('EXHAUSTED');
  });

  it('rejects first_topup_only when user already topped up', () => {
    const r = applyPromo({ ...base, appliesTo: 'first_topup_only' }, {
      amountRub: 1000,
      userRedemptionsCount: 0,
      userHasPriorTopups: true,
    });
    if (!r.ok) expect(r.reason).toBe('NOT_FIRST_TOPUP');
  });

  it('rejects bad amount', () => {
    const r = applyPromo(base, {
      amountRub: 0,
      userRedemptionsCount: 0,
      userHasPriorTopups: false,
    });
    if (!r.ok) expect(r.reason).toBe('BAD_AMOUNT');
  });

  it('accepts when valid_from is in the past', () => {
    const r = applyPromo({ ...base, validFrom: '2020-01-01' }, {
      amountRub: 1000,
      userRedemptionsCount: 0,
      userHasPriorTopups: false,
    });
    expect(r.ok).toBe(true);
  });
});
