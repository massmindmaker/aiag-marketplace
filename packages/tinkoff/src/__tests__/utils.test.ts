import { describe, it, expect } from 'vitest';
import {
  generateToken,
  verifyWebhookToken,
  rublesToKopecks,
  kopecksToRubles,
  generateOrderId,
  isFinalStatus,
  isSuccessfulStatus,
  needsConfirmation,
  formatAmount,
} from '../utils';

describe('Tinkoff utils — token generation', () => {
  it('generates SHA-256 hex token', () => {
    const token = generateToken({ TerminalKey: 'T1', Amount: 1000, OrderId: 'o1' }, 'secret');
    expect(token).toMatch(/^[a-f0-9]{64}$/);
  });

  it('produces deterministic token for same input', () => {
    const params = { TerminalKey: 'T1', Amount: 1000, OrderId: 'o1' };
    const a = generateToken(params, 'secret');
    const b = generateToken(params, 'secret');
    expect(a).toBe(b);
  });

  it('changes with different secret', () => {
    const params = { TerminalKey: 'T1', Amount: 1000 };
    expect(generateToken(params, 's1')).not.toBe(generateToken(params, 's2'));
  });

  it('excludes Receipt and DATA fields from hash', () => {
    const a = generateToken(
      { TerminalKey: 'T', Amount: 100, Receipt: { x: 1 }, DATA: { k: 'v' } },
      'secret'
    );
    const b = generateToken({ TerminalKey: 'T', Amount: 100 }, 'secret');
    expect(a).toBe(b);
  });

  it('skips undefined and null values', () => {
    const a = generateToken({ A: 1, B: undefined, C: null, D: 'x' }, 'secret');
    const b = generateToken({ A: 1, D: 'x' }, 'secret');
    expect(a).toBe(b);
  });
});

describe('Tinkoff utils — webhook verification', () => {
  it('accepts valid token', () => {
    const payload = { TerminalKey: 'T1', OrderId: 'o1', Amount: 1000, Status: 'CONFIRMED' };
    const token = generateToken(payload, 'secret');
    expect(verifyWebhookToken(payload, token, 'secret')).toBe(true);
  });

  it('rejects tampered payload', () => {
    const payload = { TerminalKey: 'T1', Amount: 1000 };
    const token = generateToken(payload, 'secret');
    expect(verifyWebhookToken({ TerminalKey: 'T1', Amount: 9999 }, token, 'secret')).toBe(false);
  });

  it('rejects wrong secret', () => {
    const payload = { TerminalKey: 'T1', Amount: 1000 };
    const token = generateToken(payload, 'secret');
    expect(verifyWebhookToken(payload, token, 'wrong')).toBe(false);
  });

  it('is case-insensitive on token comparison', () => {
    const payload = { TerminalKey: 'T1', Amount: 1000 };
    const token = generateToken(payload, 'secret');
    expect(verifyWebhookToken(payload, token.toUpperCase(), 'secret')).toBe(true);
  });
});

describe('Tinkoff utils — amount conversion', () => {
  it('rubles → kopecks', () => {
    expect(rublesToKopecks(990)).toBe(99000);
    expect(rublesToKopecks(0.01)).toBe(1);
    expect(rublesToKopecks(0.005)).toBe(1); // bankers rounding to nearest int
  });

  it('kopecks → rubles', () => {
    expect(kopecksToRubles(99000)).toBe(990);
    expect(kopecksToRubles(1)).toBe(0.01);
  });

  it('round-trips amounts', () => {
    for (const v of [1, 99.99, 990, 6990, 12345.67]) {
      expect(kopecksToRubles(rublesToKopecks(v))).toBeCloseTo(v, 2);
    }
  });
});

describe('Tinkoff utils — order id', () => {
  it('produces unique ids with prefix', () => {
    const a = generateOrderId('test');
    const b = generateOrderId('test');
    expect(a).not.toBe(b);
    expect(a.startsWith('test_')).toBe(true);
  });

  it('uses default prefix when none given', () => {
    expect(generateOrderId().startsWith('order_')).toBe(true);
  });
});

describe('Tinkoff utils — status helpers', () => {
  it('isFinalStatus identifies terminal states', () => {
    expect(isFinalStatus('CONFIRMED')).toBe(true);
    expect(isFinalStatus('REFUNDED')).toBe(true);
    expect(isFinalStatus('REJECTED')).toBe(true);
    expect(isFinalStatus('NEW')).toBe(false);
    expect(isFinalStatus('AUTHORIZING')).toBe(false);
  });

  it('isSuccessfulStatus identifies success', () => {
    expect(isSuccessfulStatus('CONFIRMED')).toBe(true);
    expect(isSuccessfulStatus('AUTHORIZED')).toBe(true);
    expect(isSuccessfulStatus('REJECTED')).toBe(false);
  });

  it('needsConfirmation only for AUTHORIZED', () => {
    expect(needsConfirmation('AUTHORIZED')).toBe(true);
    expect(needsConfirmation('CONFIRMED')).toBe(false);
  });
});

describe('Tinkoff utils — formatAmount', () => {
  it('formats RUB with locale', () => {
    const formatted = formatAmount(990);
    // Russian locale uses NBSP separators — check substring
    expect(formatted).toMatch(/990/);
    expect(formatted).toMatch(/[₽RUB]/);
  });
});
