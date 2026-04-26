import { AdapterError } from './error-translation';

export interface RetryOptions {
  max_attempts?: number; // total attempts including the first
  base_delay_ms?: number;
  max_delay_ms?: number;
  jitter?: boolean;
  /** Called before each retry with attempt (0-indexed) and delay */
  onRetry?: (attempt: number, delay_ms: number, err: unknown) => void;
  /** Sleep implementation (overridable for tests) */
  sleep?: (ms: number) => Promise<void>;
}

const defaultSleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/**
 * Retry `fn` with exponential backoff on retryable errors (5xx, 429, network).
 * Does NOT retry 4xx client errors (except 429).
 */
export async function withRetry<T>(fn: () => Promise<T>, opts: RetryOptions = {}): Promise<T> {
  const max_attempts = opts.max_attempts ?? 3;
  const base = opts.base_delay_ms ?? 250;
  const max = opts.max_delay_ms ?? 10_000;
  const sleep = opts.sleep ?? defaultSleep;

  let lastErr: unknown;
  for (let i = 0; i < max_attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const retryable = isRetryable(err);
      if (!retryable || i === max_attempts - 1) throw err;
      let delay = Math.min(max, base * Math.pow(2, i));
      // honor Retry-After if present
      if (err instanceof AdapterError && err.retry_after_ms !== undefined) {
        delay = Math.min(max, err.retry_after_ms);
      }
      if (opts.jitter !== false) delay += Math.floor(Math.random() * (delay / 4));
      opts.onRetry?.(i, delay, err);
      await sleep(delay);
    }
  }
  throw lastErr;
}

function isRetryable(err: unknown): boolean {
  if (err instanceof AdapterError) return err.retryable;
  // network errors (fetch TypeError / AbortError non-timeout) treated as retryable
  if (err instanceof Error) {
    if (err.name === 'AbortError') return true;
    if (err.name === 'TypeError' && /fetch/i.test(err.message)) return true;
  }
  return false;
}
