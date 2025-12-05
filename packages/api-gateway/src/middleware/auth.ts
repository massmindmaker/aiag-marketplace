import { createMiddleware } from 'hono/factory';
import { HTTPException } from 'hono/http-exception';
import { createHash } from 'crypto';
import type { GatewayHonoContext, ApiKeyData } from '../types';

// Hash API key for lookup
function hashApiKey(key: string): string {
  return createHash('sha256').update(key).digest('hex');
}

// Extract API key from request
function extractApiKey(ctx: GatewayHonoContext): string | null {
  // Check Authorization header (Bearer token)
  const authHeader = ctx.req.header('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }

  // Check X-API-Key header
  const apiKeyHeader = ctx.req.header('X-API-Key');
  if (apiKeyHeader) {
    return apiKeyHeader;
  }

  // Check query parameter
  const apiKeyParam = ctx.req.query('api_key');
  if (apiKeyParam) {
    return apiKeyParam;
  }

  return null;
}

export interface AuthMiddlewareOptions {
  getApiKey: (keyHash: string) => Promise<ApiKeyData | null>;
}

/**
 * Authentication middleware
 * Validates API key and adds user context to request
 */
export function authMiddleware(options: AuthMiddlewareOptions) {
  return createMiddleware<GatewayHonoContext>(async (ctx, next) => {
    // Extract API key
    const apiKey = extractApiKey(ctx as GatewayHonoContext);

    if (!apiKey) {
      throw new HTTPException(401, {
        message: 'API key is required. Provide it via Authorization header, X-API-Key header, or api_key query parameter.',
      });
    }

    // Hash the key for lookup
    const keyHash = hashApiKey(apiKey);

    // Look up API key in database
    const apiKeyData = await options.getApiKey(keyHash);

    if (!apiKeyData) {
      throw new HTTPException(401, {
        message: 'Invalid API key.',
      });
    }

    // Check if key is active
    if (apiKeyData.status !== 'active') {
      throw new HTTPException(401, {
        message: `API key is ${apiKeyData.status}.`,
      });
    }

    // Check if key is expired
    if (apiKeyData.expiresAt && new Date(apiKeyData.expiresAt) < new Date()) {
      throw new HTTPException(401, {
        message: 'API key has expired.',
      });
    }

    // Check IP whitelist if configured
    const clientIp = ctx.req.header('X-Forwarded-For')?.split(',')[0]?.trim() ||
                     ctx.req.header('X-Real-IP') ||
                     'unknown';

    if (apiKeyData.permissions?.ipWhitelist && apiKeyData.permissions.ipWhitelist.length > 0) {
      if (!apiKeyData.permissions.ipWhitelist.includes(clientIp)) {
        throw new HTTPException(403, {
          message: 'IP address not allowed for this API key.',
        });
      }
    }

    // Set gateway context
    ctx.set('gateway', {
      apiKey: apiKeyData,
      subscription: null,
      endpoint: null as any, // Will be set by routing middleware
      user: {
        id: apiKeyData.userId,
        balance: 0, // Will be fetched if needed
      },
    });

    await next();
  });
}

/**
 * Create API key hash (for use when creating new keys)
 */
export function createApiKeyHash(key: string): string {
  return hashApiKey(key);
}

/**
 * Generate new API key
 */
export function generateApiKey(prefix = 'aiag'): { key: string; prefix: string; lastChars: string } {
  const randomBytes = crypto.getRandomValues(new Uint8Array(32));
  const key = Array.from(randomBytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  const fullKey = `${prefix}_${key}`;

  return {
    key: fullKey,
    prefix: fullKey.slice(0, 12),
    lastChars: fullKey.slice(-4),
  };
}
