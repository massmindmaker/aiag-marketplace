/**
 * Lightweight per-key circuit breaker.
 *
 * States:
 *   closed     — calls flow normally
 *   open       — calls fail fast for `openMs`
 *   half-open  — first call after openMs is a trial; success → closed, fail → open
 *
 * Defaults match Plan 03 design: 5 failures within 60s open the breaker for
 * 30s. Tests use the injectable `now` clock so behavior is deterministic.
 */

export type CircuitState = 'closed' | 'open' | 'half-open';

export interface CircuitBreakerOptions {
  failureThreshold?: number;
  windowMs?: number;
  openMs?: number;
  /** Injectable clock — defaults to Date.now */
  now?: () => number;
}

interface PerKeyState {
  failures: number[]; // timestamps within window
  state: CircuitState;
  openedAt: number;
}

export class CircuitBreaker {
  private readonly failureThreshold: number;
  private readonly windowMs: number;
  private readonly openMs: number;
  private readonly now: () => number;
  private readonly perKey = new Map<string, PerKeyState>();

  constructor(opts: CircuitBreakerOptions = {}) {
    this.failureThreshold = opts.failureThreshold ?? 5;
    this.windowMs = opts.windowMs ?? 60_000;
    this.openMs = opts.openMs ?? 30_000;
    this.now = opts.now ?? Date.now;
  }

  private getOrInit(key: string): PerKeyState {
    let s = this.perKey.get(key);
    if (!s) {
      s = { failures: [], state: 'closed', openedAt: 0 };
      this.perKey.set(key, s);
    }
    return s;
  }

  /** Returns the public state, applying any pending open→half-open transition. */
  getState(key: string): CircuitState {
    const s = this.getOrInit(key);
    if (s.state === 'open' && this.now() - s.openedAt >= this.openMs) {
      s.state = 'half-open';
    }
    return s.state;
  }

  /** Throws CircuitOpenError immediately if breaker is open and not yet ready to trial. */
  assertCallable(key: string): void {
    const state = this.getState(key);
    if (state === 'open') {
      throw new CircuitOpenError(`circuit open for ${key}`);
    }
  }

  recordSuccess(key: string): void {
    const s = this.getOrInit(key);
    s.failures = [];
    s.state = 'closed';
  }

  recordFailure(key: string): void {
    const s = this.getOrInit(key);
    const t = this.now();
    s.failures = s.failures.filter((ts) => t - ts <= this.windowMs);
    s.failures.push(t);
    if (s.state === 'half-open') {
      s.state = 'open';
      s.openedAt = t;
      return;
    }
    if (s.failures.length >= this.failureThreshold) {
      s.state = 'open';
      s.openedAt = t;
    }
  }

  /**
   * Wrap a call. Throws CircuitOpenError if open; on success resets the
   * breaker, on failure records the failure (and rethrows).
   */
  async exec<T>(key: string, fn: () => Promise<T>): Promise<T> {
    this.assertCallable(key);
    try {
      const out = await fn();
      this.recordSuccess(key);
      return out;
    } catch (err) {
      this.recordFailure(key);
      throw err;
    }
  }
}

export class CircuitOpenError extends Error {
  readonly code = 'CIRCUIT_OPEN';
  constructor(msg: string) {
    super(msg);
    this.name = 'CircuitOpenError';
  }
}
