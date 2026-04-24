/**
 * Redis Streams producer for request logging (FIX H8).
 * - XADD with MAXLEN ~ 100_000 (approx trimming)
 * - Fire-and-forget: caller never awaits
 * - Fallback: on > 5 failures in 10s, direct Postgres INSERT
 *
 * Consumer (worker) lives in apps/worker (not in scope of CODE-part).
 */
import { makeRedis } from '../lib/redis';
import { sql } from '../lib/db';
import { logger } from '../lib/logger';

const STREAM = 'requests:log';
const MAXLEN = 100_000;

let xaddFailures = 0;
let lastFailResetAt = Date.now();

/**
 * Records a request. Returns immediately; actual write happens async.
 * Tests may await the returned promise to ensure writes completed.
 */
export function logRequest(record: Record<string, unknown>): Promise<void> {
  const redis = makeRedis('streams');
  return redis
    .xadd(STREAM, 'MAXLEN', '~', String(MAXLEN), '*', 'data', JSON.stringify(record))
    .then(() => undefined)
    .catch(async (e) => {
      xaddFailures++;
      logger.error({ err: String(e) }, 'log_xadd_fail');
      if (Date.now() - lastFailResetAt > 10_000) {
        xaddFailures = 1;
        lastFailResetAt = Date.now();
      }
      if (xaddFailures > 5) {
        try {
          await sql`INSERT INTO usage_events (org_id, api_key_id, request_id, kind, payload)
            VALUES (
              ${(record.orgId as string) ?? null}::uuid,
              ${(record.apiKeyId as string) ?? null}::uuid,
              ${(record.requestId as string) ?? null},
              ${(record.type as string) ?? 'request'},
              ${JSON.stringify(record)}::jsonb
            )`;
          logger.warn('log_fallback_pg');
        } catch (dbErr) {
          logger.error({ err: String(dbErr) }, 'log_fallback_pg_fail');
        }
      }
    });
}

export async function getLogQueueDepth(): Promise<number> {
  return makeRedis('streams').xlen(STREAM);
}
