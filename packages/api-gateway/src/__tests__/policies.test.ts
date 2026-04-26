import { describe, it, expect, beforeEach } from 'vitest';
import IORedisMock from 'ioredis-mock';
import { setRedisFactory } from '../lib/redis';
import { checkSessionBudget, accumulateSessionCost } from '../routing/policies';

beforeEach(() => {
  const instance = new (IORedisMock as any)();
  setRedisFactory(() => instance as any);
});

describe('per-session budget cap', () => {
  const key = { id: 'k1', sess: 's1' };

  it('checkSessionBudget: passes while under cap', async () => {
    const res = await checkSessionBudget({
      apiKeyId: key.id,
      sessionId: key.sess,
      capRub: 100,
    });
    expect(res.used).toBe(0);
    expect(res.remaining).toBe(100);
  });

  it('accumulateSessionCost + subsequent check reflects usage', async () => {
    await accumulateSessionCost({
      apiKeyId: key.id,
      sessionId: key.sess,
      deltaRub: 30,
      ttlSec: 60,
    });
    await accumulateSessionCost({
      apiKeyId: key.id,
      sessionId: key.sess,
      deltaRub: 20,
    });
    const res = await checkSessionBudget({
      apiKeyId: key.id,
      sessionId: key.sess,
      capRub: 100,
    });
    expect(res.used).toBeCloseTo(50, 4);
    expect(res.remaining).toBeCloseTo(50, 4);
  });

  it('checkSessionBudget throws when used >= cap', async () => {
    await accumulateSessionCost({
      apiKeyId: key.id,
      sessionId: key.sess,
      deltaRub: 150,
    });
    await expect(
      checkSessionBudget({ apiKeyId: key.id, sessionId: key.sess, capRub: 100 })
    ).rejects.toThrow(/Session budget cap reached/);
  });
});
