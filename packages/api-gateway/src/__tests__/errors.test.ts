import { describe, it, expect } from 'vitest';
import { AiagError, errors } from '../lib/errors';

describe('AiagError', () => {
  it('has code, status and toResponseBody', () => {
    const e = errors.paymentRequired();
    expect(e).toBeInstanceOf(AiagError);
    expect(e.code).toBe('PAYMENT_REQUIRED');
    expect(e.status).toBe(402);
    const body = e.toResponseBody();
    expect(body.error.code).toBe('PAYMENT_REQUIRED');
    expect(body.error.message).toBeTruthy();
  });

  it('rate-limited carries retryAfterSec in details', () => {
    const e = errors.rateLimited(30);
    expect(e.status).toBe(429);
    expect(e.toResponseBody().error.details).toEqual({ retryAfterSec: 30 });
  });

  it('spec HTTP mapping for each helper', () => {
    expect(errors.badRequest('x').status).toBe(400);
    expect(errors.unauthorized().status).toBe(401);
    expect(errors.forbidden('x').status).toBe(403);
    expect(errors.notFound('x').status).toBe(404);
    expect(errors.upstreamError('x').status).toBe(502);
    expect(errors.unavailable('x').status).toBe(503);
    expect(errors.overloaded().status).toBe(529);
  });
});
