import { describe, it, expect } from 'vitest';
import { checkAntiFraud } from '../antiFraud';

describe('checkAntiFraud', () => {
  it('allows user with clean history', () => {
    const res = checkAntiFraud({
      userId: 'u1',
      hasActiveHighSeverityFlag: false,
      chargebackCount30d: 0,
    });
    expect(res.allowed).toBe(true);
  });

  it('blocks after 2 chargebacks in 30d', () => {
    const res = checkAntiFraud({
      userId: 'u1',
      hasActiveHighSeverityFlag: false,
      chargebackCount30d: 2,
    });
    expect(res.allowed).toBe(false);
    expect(res.error).toBe('account_suspended_chargebacks');
  });

  it('blocks when high-severity fraud flag active', () => {
    const res = checkAntiFraud({
      userId: 'u1',
      hasActiveHighSeverityFlag: true,
      chargebackCount30d: 0,
    });
    expect(res.allowed).toBe(false);
    expect(res.error).toBe('account_under_review');
  });
});
