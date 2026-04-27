import IORedis, { type RedisOptions } from 'ioredis';

/**
 * Build a BullMQ-compatible Redis connection.
 * BullMQ requires `maxRetriesPerRequest: null` and `enableReadyCheck: false`
 * for blocking commands used by Worker.
 */
export function createRedisConnection(url?: string): IORedis {
  const target = url ?? process.env.REDIS_URL ?? 'redis://127.0.0.1:6379';
  const opts: RedisOptions = {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  };
  return new IORedis(target, opts);
}
