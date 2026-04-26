import { describe, it, expect } from 'vitest';
import {
  generateApiKey,
  hashKey,
  parseBearer,
  KEY_PREFIX_REGEX,
} from '../lib/api-key';

describe('api-key', () => {
  it('generates sk_aiag_live_... with valid shape', () => {
    const { key, hash, prefix } = generateApiKey('live');
    expect(key.startsWith('sk_aiag_live_')).toBe(true);
    expect(KEY_PREFIX_REGEX.test(key)).toBe(true);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
    expect(prefix).toBe(key.slice(0, 20));
  });

  it('generates separate test-env keys with sk_aiag_test_ prefix', () => {
    const { key } = generateApiKey('test');
    expect(key.startsWith('sk_aiag_test_')).toBe(true);
  });

  it('hashKey is deterministic sha-256', () => {
    const k = 'sk_aiag_live_fixedvalue1234567890abcd';
    expect(hashKey(k)).toBe(hashKey(k));
    expect(hashKey(k)).toMatch(/^[0-9a-f]{64}$/);
  });

  it('parseBearer strips "Bearer " prefix', () => {
    expect(parseBearer('Bearer sk_aiag_live_xyz')).toBe('sk_aiag_live_xyz');
    // parser is case-sensitive (Bearer only)
    expect(parseBearer('bearer sk_aiag_live_xyz')).toBeNull();
    expect(parseBearer(null)).toBeNull();
    expect(parseBearer('  ')).toBeNull();
    expect(parseBearer('Token abc')).toBeNull();
  });

  it('KEY_PREFIX_REGEX rejects invalid shapes', () => {
    expect(KEY_PREFIX_REGEX.test('sk_openai_xxx')).toBe(false);
    expect(KEY_PREFIX_REGEX.test('sk_aiag_prod_xxxxxxxxxxxxxxxxxxxx')).toBe(false);
    expect(KEY_PREFIX_REGEX.test('sk_aiag_live_short')).toBe(false);
  });
});
