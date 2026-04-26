/**
 * Upstream → AIAG error taxonomy translation.
 *
 * Each adapter request that returns a non-2xx response is converted to an
 * `AdapterError` with a stable code usable by the gateway routing engine
 * (circuit breaker, failover).
 */

export class AdapterError extends Error {
  public readonly status: number;
  public readonly code: string;
  public readonly upstream: string;
  public readonly retry_after_ms?: number;
  public readonly raw?: string;

  constructor(
    status: number,
    code: string,
    message: string,
    upstream: string,
    retry_after_ms?: number,
    raw?: string,
  ) {
    super(message);
    this.name = 'AdapterError';
    this.status = status;
    this.code = code;
    this.upstream = upstream;
    this.retry_after_ms = retry_after_ms;
    this.raw = raw;
  }

  get retryable(): boolean {
    return this.status >= 500 || this.status === 429;
  }
}

const STATUS_TO_CODE: Record<number, string> = {
  400: 'validation_error',
  401: 'upstream_auth_failed',
  403: 'upstream_forbidden',
  404: 'model_not_found_upstream',
  408: 'upstream_timeout',
  409: 'upstream_conflict',
  422: 'unprocessable',
  429: 'upstream_rate_limited',
  500: 'upstream_server_error',
  502: 'upstream_bad_gateway',
  503: 'upstream_unavailable',
  504: 'upstream_timeout',
};

function parseRetryAfter(header: string | null): number | undefined {
  if (!header) return undefined;
  const asNum = Number(header);
  if (!Number.isNaN(asNum)) return asNum * 1000;
  const ts = Date.parse(header);
  if (!Number.isNaN(ts)) return Math.max(0, ts - Date.now());
  return undefined;
}

export async function translateError(res: Response, upstream: string): Promise<AdapterError> {
  const retry_after_ms = parseRetryAfter(res.headers.get('retry-after'));
  let raw: string | undefined;
  try {
    // drain body to free connection (capped for diagnostics)
    raw = (await res.text()).slice(0, 500);
  } catch {
    // ignore
  }
  const code = STATUS_TO_CODE[res.status] ?? 'upstream_unknown';
  return new AdapterError(
    res.status,
    code,
    `${upstream} returned ${res.status}${raw ? `: ${raw.slice(0, 100)}` : ''}`,
    upstream,
    retry_after_ms,
    raw,
  );
}
