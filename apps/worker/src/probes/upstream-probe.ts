import { logger } from '../logger.js';

export interface UpstreamPingResult {
  upstreamId: number;
  ok: boolean;
  latencyMs: number;
  error?: string;
}

export type UpstreamPinger = (upstream: { id: number; slug: string }) => Promise<UpstreamPingResult>;

export type UpstreamHealthSink = (r: UpstreamPingResult) => Promise<void>;

export interface UpstreamProbeDeps {
  /** Returns currently-enabled upstreams to probe */
  listUpstreams: () => Promise<Array<{ id: number; slug: string }>>;
  pinger: UpstreamPinger;
  sink: UpstreamHealthSink;
  intervalMs?: number;
}

export interface UpstreamProbeHandle {
  stop: () => void;
  /** Run one cycle on demand (testing) */
  runOnce: () => Promise<UpstreamPingResult[]>;
}

const DEFAULT_INTERVAL_MS = 5 * 60_000; // 5 min

export function startUpstreamProbe(deps: UpstreamProbeDeps): UpstreamProbeHandle {
  const interval = deps.intervalMs ?? DEFAULT_INTERVAL_MS;

  const runOnce = async (): Promise<UpstreamPingResult[]> => {
    const upstreams = await deps.listUpstreams();
    const results = await Promise.all(
      upstreams.map(async (u) => {
        try {
          const r = await deps.pinger(u);
          await deps.sink(r);
          return r;
        } catch (e) {
          const r: UpstreamPingResult = {
            upstreamId: u.id,
            ok: false,
            latencyMs: 0,
            error: (e as Error).message,
          };
          await deps.sink(r);
          return r;
        }
      })
    );
    return results;
  };

  // fire one immediately, then every interval
  void runOnce().catch((e) => logger.error({ err: e }, 'upstream-probe initial run failed'));
  const timer = setInterval(() => {
    void runOnce().catch((e) => logger.error({ err: e }, 'upstream-probe cycle failed'));
  }, interval);

  return {
    stop: () => clearInterval(timer),
    runOnce,
  };
}
