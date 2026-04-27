import { describe, it, expect, vi } from 'vitest';
import { CircuitBreaker, CircuitOpenError } from '../base/circuit-breaker';

describe('CircuitBreaker', () => {
  it('opens after threshold failures within window', () => {
    let now = 0;
    const cb = new CircuitBreaker({
      failureThreshold: 3,
      windowMs: 1000,
      openMs: 500,
      now: () => now,
    });
    cb.recordFailure('fal');
    cb.recordFailure('fal');
    expect(cb.getState('fal')).toBe('closed');
    cb.recordFailure('fal');
    expect(cb.getState('fal')).toBe('open');
    expect(() => cb.assertCallable('fal')).toThrow(CircuitOpenError);
  });

  it('transitions open → half-open after openMs and to closed on success', () => {
    let now = 0;
    const cb = new CircuitBreaker({ failureThreshold: 2, windowMs: 1000, openMs: 100, now: () => now });
    cb.recordFailure('k');
    cb.recordFailure('k');
    expect(cb.getState('k')).toBe('open');
    now = 200;
    expect(cb.getState('k')).toBe('half-open');
    cb.recordSuccess('k');
    expect(cb.getState('k')).toBe('closed');
  });

  it('half-open → open on failure', () => {
    let now = 0;
    const cb = new CircuitBreaker({ failureThreshold: 2, windowMs: 1000, openMs: 100, now: () => now });
    cb.recordFailure('z');
    cb.recordFailure('z');
    now = 200;
    expect(cb.getState('z')).toBe('half-open');
    cb.recordFailure('z');
    expect(cb.getState('z')).toBe('open');
  });

  it('forgets failures outside the window', () => {
    let now = 0;
    const cb = new CircuitBreaker({ failureThreshold: 3, windowMs: 1000, openMs: 100, now: () => now });
    cb.recordFailure('w');
    cb.recordFailure('w');
    now = 5000;
    cb.recordFailure('w');
    expect(cb.getState('w')).toBe('closed');
  });

  it('exec wraps callable, records success/failure', async () => {
    const cb = new CircuitBreaker({ failureThreshold: 2, openMs: 100 });
    const ok = vi.fn().mockResolvedValue(42);
    expect(await cb.exec('a', ok)).toBe(42);
    const bad = vi.fn().mockRejectedValue(new Error('boom'));
    await expect(cb.exec('a', bad)).rejects.toThrow('boom');
    await expect(cb.exec('a', bad)).rejects.toThrow('boom');
    await expect(cb.exec('a', ok)).rejects.toBeInstanceOf(CircuitOpenError);
  });
});
