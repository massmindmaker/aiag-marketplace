import Redis, { type RedisOptions } from 'ioredis';
import { config } from '../config';

export type RedisRole = 'cache' | 'streams' | 'ratelimit';

const ROLE_OPTS: Record<RedisRole, RedisOptions> = {
  cache: {
    enableOfflineQueue: false,
    maxRetriesPerRequest: 1,
    connectionName: 'gw-cache',
  },
  streams: {
    enableOfflineQueue: true,
    maxRetriesPerRequest: null,
    connectionName: 'gw-streams',
  },
  ratelimit: {
    enableOfflineQueue: false,
    maxRetriesPerRequest: 1,
    connectionName: 'gw-ratelimit',
  },
};

const pool: Partial<Record<RedisRole, Redis>> = {};

/**
 * Injectable Redis factory so tests can swap in ioredis-mock.
 * Default: creates real ioredis instances keyed by role. In tests set
 * `setRedisFactory(() => new IORedisMock())` in the test setup.
 */
export type RedisFactoryFn = (role: RedisRole) => Redis;

let factory: RedisFactoryFn = (role: RedisRole) =>
  new Redis(config.REDIS_URL, ROLE_OPTS[role]);

export function setRedisFactory(fn: RedisFactoryFn): void {
  factory = fn;
  // flush pool so next makeRedis call uses new factory
  for (const key of Object.keys(pool) as RedisRole[]) delete pool[key];
}

export function makeRedis(role: RedisRole): Redis {
  if (!pool[role]) pool[role] = factory(role);
  return pool[role]!;
}

export const redis = makeRedis('cache');
