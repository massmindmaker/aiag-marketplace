import { makeRedis } from '../lib/redis';
import { errors } from '../lib/errors';

/**
 * Per-session budget enforcement (FIX H4.3).
 *   key = session:{api_key_id}:{session_id}:cost_rub
 */
export async function checkSessionBudget(opts: {
  apiKeyId: string;
  sessionId: string;
  capRub: number;
}): Promise<{ used: number; remaining: number }> {
  const redis = makeRedis('cache');
  const key = `session:${opts.apiKeyId}:${opts.sessionId}:cost_rub`;
  const used = parseFloat((await redis.get(key)) ?? '0');
  if (used >= opts.capRub) {
    throw errors.forbidden(
      `Session budget cap reached: ${used.toFixed(2)} >= ${opts.capRub}₽`
    );
  }
  return { used, remaining: opts.capRub - used };
}

export async function accumulateSessionCost(opts: {
  apiKeyId: string;
  sessionId: string;
  deltaRub: number;
  ttlSec?: number;
}): Promise<void> {
  const redis = makeRedis('cache');
  const key = `session:${opts.apiKeyId}:${opts.sessionId}:cost_rub`;
  await redis.incrbyfloat(key, opts.deltaRub);
  if (opts.ttlSec) await redis.expire(key, opts.ttlSec);
}
