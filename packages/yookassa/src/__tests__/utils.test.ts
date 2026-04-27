import { describe, it, expect } from 'vitest';
import {
  rublesToAmountString,
  amountStringToRubles,
  generateIdempotenceKey,
  buildBasicAuth,
  isYooKassaWebhookShapeValid,
  isYooKassaIp,
  ipv4InCidr,
  YOOKASSA_WEBHOOK_IPS_V4,
  sha256,
} from '../utils';
import { mapYooKassaStatus } from '../client';

describe('YooKassa utils — amount conversion', () => {
  it('converts rubles → "X.XX" string', () => {
    expect(rublesToAmountString(990)).toBe('990.00');
    expect(rublesToAmountString(990.5)).toBe('990.50');
    expect(rublesToAmountString(0.01)).toBe('0.01');
  });

  it('parses amount string back to number', () => {
    expect(amountStringToRubles('990.00')).toBe(990);
    expect(amountStringToRubles('1234.56')).toBe(1234.56);
  });

  it('round-trips correctly', () => {
    const cases = [0.01, 1, 99.99, 990, 6990, 12345.67];
    for (const v of cases) {
      expect(amountStringToRubles(rublesToAmountString(v))).toBeCloseTo(v, 2);
    }
  });
});

describe('YooKassa utils — idempotence key', () => {
  it('generates RFC4122 UUID v4', () => {
    const key = generateIdempotenceKey();
    expect(key).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    );
  });

  it('returns unique keys on consecutive calls', () => {
    const a = generateIdempotenceKey();
    const b = generateIdempotenceKey();
    expect(a).not.toBe(b);
  });
});

describe('YooKassa utils — Basic auth header', () => {
  it('builds correct Basic auth header', () => {
    const header = buildBasicAuth('shop_123', 'secret_xyz');
    expect(header).toBe('Basic ' + Buffer.from('shop_123:secret_xyz').toString('base64'));
  });
});

describe('YooKassa utils — webhook shape validation', () => {
  it('accepts valid notification', () => {
    const valid = {
      type: 'notification',
      event: 'payment.succeeded',
      object: { id: 'p_1', status: 'succeeded', amount: { value: '100.00', currency: 'RUB' } },
    };
    expect(isYooKassaWebhookShapeValid(valid)).toBe(true);
  });

  it('rejects null/undefined', () => {
    expect(isYooKassaWebhookShapeValid(null)).toBe(false);
    expect(isYooKassaWebhookShapeValid(undefined)).toBe(false);
  });

  it('rejects wrong type', () => {
    expect(isYooKassaWebhookShapeValid({ type: 'wrong', event: 'x', object: {} })).toBe(false);
  });

  it('rejects missing object.id', () => {
    expect(
      isYooKassaWebhookShapeValid({ type: 'notification', event: 'payment.succeeded', object: {} })
    ).toBe(false);
  });

  it('rejects missing object.status', () => {
    expect(
      isYooKassaWebhookShapeValid({
        type: 'notification',
        event: 'payment.succeeded',
        object: { id: 'p_1' },
      })
    ).toBe(false);
  });
});

describe('YooKassa utils — IP CIDR check', () => {
  it('matches single IP', () => {
    expect(ipv4InCidr('77.75.156.11', '77.75.156.11')).toBe(true);
    expect(ipv4InCidr('77.75.156.12', '77.75.156.11')).toBe(false);
  });

  it('matches /27 subnet', () => {
    expect(ipv4InCidr('185.71.76.5', '185.71.76.0/27')).toBe(true);
    expect(ipv4InCidr('185.71.76.31', '185.71.76.0/27')).toBe(true);
    expect(ipv4InCidr('185.71.76.32', '185.71.76.0/27')).toBe(false);
  });

  it('rejects malformed IPs', () => {
    expect(ipv4InCidr('not.an.ip', '0.0.0.0/0')).toBe(false);
    expect(ipv4InCidr('256.256.256.256', '0.0.0.0/0')).toBe(false);
  });

  it('isYooKassaIp matches whitelist', () => {
    expect(isYooKassaIp('77.75.156.11')).toBe(true);
    expect(isYooKassaIp('77.75.156.35')).toBe(true);
    expect(isYooKassaIp('185.71.76.10')).toBe(true);
    expect(isYooKassaIp('8.8.8.8')).toBe(false);
  });

  it('exposes documented YooKassa IP ranges', () => {
    expect(YOOKASSA_WEBHOOK_IPS_V4).toContain('185.71.76.0/27');
    expect(YOOKASSA_WEBHOOK_IPS_V4).toContain('77.75.156.11');
  });
});

describe('YooKassa utils — sha256', () => {
  it('hashes string consistently', () => {
    expect(sha256('hello')).toBe(
      '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824'
    );
  });
});

describe('YooKassa utils — mapYooKassaStatus', () => {
  it('maps known statuses', () => {
    expect(mapYooKassaStatus('pending')).toBe('pending');
    expect(mapYooKassaStatus('waiting_for_capture')).toBe('authorized');
    expect(mapYooKassaStatus('succeeded')).toBe('confirmed');
    expect(mapYooKassaStatus('canceled')).toBe('cancelled');
  });

  it('falls back to failed for unknown', () => {
    expect(mapYooKassaStatus('alien_status')).toBe('failed');
  });
});
