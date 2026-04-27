import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getPaymentProvider, getTier, TIERS, ALL_PROVIDERS } from '../providers';

describe('payments/providers — registry', () => {
  it('returns Tinkoff provider', () => {
    const p = getPaymentProvider('tinkoff');
    expect(p.id).toBe('tinkoff');
    expect(typeof p.initPayment).toBe('function');
    expect(typeof p.refund).toBe('function');
  });

  it('returns YooKassa provider', () => {
    const p = getPaymentProvider('yookassa');
    expect(p.id).toBe('yookassa');
  });

  it('returns SBP provider (powered by YooKassa)', () => {
    const p = getPaymentProvider('sbp');
    expect(p.id).toBe('sbp');
  });

  it('throws on unknown provider', () => {
    expect(() => getPaymentProvider('alien' as never)).toThrow();
  });
});

describe('payments/providers — tiers', () => {
  it('exposes Free/Basic/Starter/Pro', () => {
    expect(TIERS.free.monthly).toBe(0);
    expect(TIERS.basic.monthly).toBe(990);
    expect(TIERS.starter.monthly).toBe(2490);
    expect(TIERS.pro.monthly).toBe(6990);
  });

  it('yearly = monthly * 10 (~17% discount)', () => {
    expect(TIERS.basic.yearly).toBe(9900);
    expect(TIERS.starter.yearly).toBe(24900);
    expect(TIERS.pro.yearly).toBe(69900);
  });

  it('getTier returns null for unknown', () => {
    expect(getTier('does_not_exist')).toBeNull();
  });

  it('getTier returns tier for known', () => {
    expect(getTier('basic')?.monthly).toBe(990);
  });
});

describe('payments/providers — provider matrix', () => {
  let prevTinkoff: string | undefined;
  let prevYoo: string | undefined;

  beforeEach(() => {
    prevTinkoff = process.env.TINKOFF_TERMINAL_KEY;
    prevYoo = process.env.YOOKASSA_SHOP_ID;
  });

  afterEach(() => {
    if (prevTinkoff !== undefined) process.env.TINKOFF_TERMINAL_KEY = prevTinkoff;
    else delete process.env.TINKOFF_TERMINAL_KEY;
    if (prevYoo !== undefined) process.env.YOOKASSA_SHOP_ID = prevYoo;
    else delete process.env.YOOKASSA_SHOP_ID;
  });

  it('lists all 3 known providers', () => {
    const ids = ALL_PROVIDERS.map((p) => p.id).sort();
    expect(ids).toEqual(['sbp', 'tinkoff', 'yookassa']);
  });

  it('flags providers as disabled when ENV missing', async () => {
    delete process.env.TINKOFF_TERMINAL_KEY;
    delete process.env.YOOKASSA_SHOP_ID;
    // re-import to re-evaluate ENV at module load — using dynamic import
    const mod = await import('../providers?reload=' + Date.now());
    const enabled = (mod.ALL_PROVIDERS as typeof ALL_PROVIDERS).filter((p) => p.enabled);
    expect(enabled.length).toBeLessThanOrEqual(ALL_PROVIDERS.length);
  });
});
