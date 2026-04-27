import { logger } from '../logger.js';

export interface InternalProbeResult {
  pgOk: boolean;
  redisOk: boolean;
  pgLatencyMs: number;
  redisLatencyMs: number;
  errors: { pg?: string; redis?: string };
}

export interface InternalProbeDeps {
  pingPg: () => Promise<void>;
  pingRedis: () => Promise<void>;
  /** Optional alerter (e.g. @aiag/telegram-alerts) */
  alert?: (msg: string) => Promise<void>;
  intervalMs?: number;
}

export interface InternalProbeHandle {
  stop: () => void;
  runOnce: () => Promise<InternalProbeResult>;
}

const DEFAULT_INTERVAL_MS = 60_000;

export function startInternalProbe(deps: InternalProbeDeps): InternalProbeHandle {
  const interval = deps.intervalMs ?? DEFAULT_INTERVAL_MS;

  // De-bounce alerts: only fire when transitioning healthy → unhealthy.
  let lastHealthy = true;

  const runOnce = async (): Promise<InternalProbeResult> => {
    const result: InternalProbeResult = {
      pgOk: false,
      redisOk: false,
      pgLatencyMs: 0,
      redisLatencyMs: 0,
      errors: {},
    };

    const pgStart = Date.now();
    try {
      await deps.pingPg();
      result.pgOk = true;
    } catch (e) {
      result.errors.pg = (e as Error).message;
    }
    result.pgLatencyMs = Date.now() - pgStart;

    const redisStart = Date.now();
    try {
      await deps.pingRedis();
      result.redisOk = true;
    } catch (e) {
      result.errors.redis = (e as Error).message;
    }
    result.redisLatencyMs = Date.now() - redisStart;

    const healthy = result.pgOk && result.redisOk;
    if (!healthy && lastHealthy && deps.alert) {
      await deps
        .alert(
          `aiag-worker: internal probe failed (pg=${result.pgOk}, redis=${result.redisOk}, ` +
            `errs=${JSON.stringify(result.errors)})`
        )
        .catch((e) => logger.error({ err: e }, 'alert dispatch failed'));
    }
    lastHealthy = healthy;

    if (healthy) {
      logger.debug(result, 'internal-probe ok');
    } else {
      logger.warn(result, 'internal-probe degraded');
    }
    return result;
  };

  void runOnce().catch((e) => logger.error({ err: e }, 'internal-probe initial run failed'));
  const timer = setInterval(() => {
    void runOnce().catch((e) => logger.error({ err: e }, 'internal-probe cycle failed'));
  }, interval);

  return {
    stop: () => clearInterval(timer),
    runOnce,
  };
}
