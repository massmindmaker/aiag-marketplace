/**
 * Phase 13 — referral code generator tests.
 */
import { describe, it, expect } from 'vitest';
import {
  generateReferralCode,
  generateSuffix,
  derivePrefix,
  isValidReferralCodeShape,
  anonymizeEmail,
} from '@/lib/growth/codes';

describe('derivePrefix', () => {
  it('returns first 3 uppercase letters of email local-part', () => {
    expect(derivePrefix('bob@example.com')).toBe('BOB');
    expect(derivePrefix('Alice.smith@x.io')).toBe('ALI');
  });

  it('falls back to REF when local-part has no letters', () => {
    expect(derivePrefix('123@x.com')).toBe('REF');
    expect(derivePrefix(null)).toBe('REF');
    expect(derivePrefix('')).toBe('REF');
  });

  it('pads short alpha local-parts with REF', () => {
    expect(derivePrefix('a@b.com')).toBe('ARE'); // 'A' + 'REF' → ARE
  });
});

describe('generateSuffix', () => {
  it('always returns 6 chars from the safe alphabet', () => {
    for (let i = 0; i < 50; i++) {
      const s = generateSuffix();
      expect(s).toHaveLength(6);
      expect(/^[A-HJ-NP-Z2-9]+$/.test(s)).toBe(true);
    }
  });

  it('uses provided RNG deterministically', () => {
    const rng = () => 0; // always picks index 0 → 'A'
    expect(generateSuffix(rng)).toBe('AAAAAA');
  });
});

describe('generateReferralCode', () => {
  it('combines prefix and suffix with a dash', () => {
    const code = generateReferralCode('bob@example.com', () => 0);
    expect(code).toBe('BOB-AAAAAA');
  });

  it('produces unique codes across many calls', () => {
    const set = new Set<string>();
    for (let i = 0; i < 200; i++) set.add(generateReferralCode('test@x.com'));
    // 32^6 = 1B+, collisions across 200 should be 0
    expect(set.size).toBe(200);
  });

  it('produced code passes shape validator', () => {
    const code = generateReferralCode('alice@x.io');
    expect(isValidReferralCodeShape(code)).toBe(true);
  });
});

describe('isValidReferralCodeShape', () => {
  it('rejects junk', () => {
    expect(isValidReferralCodeShape('')).toBe(false);
    expect(isValidReferralCodeShape('NOT-A-CODE-XYZ-XYZ-XYZ-XYZ-XYZ')).toBe(false);
    expect(isValidReferralCodeShape('lowercase-suffix')).toBe(false);
  });

  it('accepts well-formed codes', () => {
    expect(isValidReferralCodeShape('REF-AAAAAA')).toBe(true);
    expect(isValidReferralCodeShape('BOB-X7K2QQ')).toBe(true);
  });
});

describe('anonymizeEmail', () => {
  it('shows only first letter + domain', () => {
    expect(anonymizeEmail('bob@gmail.com')).toBe('b***@gmail.com');
  });
  it('returns *** for malformed input', () => {
    expect(anonymizeEmail('')).toBe('***');
    expect(anonymizeEmail('no-at-sign')).toBe('***');
  });
});
