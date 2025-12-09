import { createMiddleware } from 'hono/factory';
import type { GatewayEnv, UsageLogEntry } from '../types';

export interface LoggingOptions {
  logRequest?: (entry: UsageLogEntry) => Promise<void>;
}

/**
 * Generate unique request ID
 */
function generateRequestId(): string {
  return `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Logging middleware - tracks request/response and logs usage
 */
export function loggingMiddleware(options: LoggingOptions = {}) {
  return createMiddleware<GatewayEnv>(async (ctx, next) => {
    // Generate request ID and set start time
    const requestId = generateRequestId();
    const startTime = Date.now();

    ctx.set('requestId', requestId);
    ctx.set('startTime', startTime);

    // Add request ID to response headers
    ctx.header('X-Request-ID', requestId);

    // Execute the request
    await next();

    // Calculate response time
    const responseTimeMs = Date.now() - startTime;

    // Get gateway context
    const gateway = ctx.get('gateway');

    if (gateway && options.logRequest) {
      // Extract client info
      const ipAddress =
        ctx.req.header('X-Forwarded-For')?.split(',')[0]?.trim() ||
        ctx.req.header('X-Real-IP') ||
        'unknown';
      const userAgent = ctx.req.header('User-Agent') || 'unknown';

      // Build log entry
      const logEntry: UsageLogEntry = {
        apiKeyId: gateway.apiKey.id,
        userId: gateway.user.id,
        modelId: gateway.endpoint?.modelId || '',
        endpointId: gateway.endpoint?.id || '',
        subscriptionId: gateway.subscription?.id,
        method: ctx.req.method,
        path: ctx.req.path,
        statusCode: ctx.res.status,
        responseTimeMs,
        ipAddress,
        userAgent,
      };

      // Log asynchronously (don't block response)
      options.logRequest(logEntry).catch((err) => {
        console.error('Failed to log request:', err);
      });
    }
  });
}

/**
 * Request timing header middleware
 */
export function timingMiddleware() {
  return createMiddleware<GatewayEnv>(async (ctx, next) => {
    const start = Date.now();

    await next();

    const duration = Date.now() - start;
    ctx.header('X-Response-Time', `${duration}ms`);
  });
}
