import { randomUUID } from 'node:crypto';
import type { MiddlewareHandler } from 'hono';

/**
 * Assigns a request ID (honors client-provided X-Request-Id header if present).
 * Stored as c.get('requestId'). Also echoed back on every response.
 */
export function requestIdMiddleware(): MiddlewareHandler {
  return async (c, next) => {
    const incoming = c.req.header('x-request-id');
    const rid = incoming && incoming.length > 0 ? incoming : `req_${randomUUID()}`;
    c.set('requestId' as never, rid as never);
    c.header('X-Request-Id', rid);
    await next();
  };
}
