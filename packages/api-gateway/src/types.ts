import type { Context as HonoContext } from 'hono';

// API Key data from database
export interface ApiKeyData {
  id: string;
  userId: string;
  keyHash: string;
  status: 'active' | 'revoked' | 'expired';
  permissions: {
    models?: string[];
    endpoints?: string[];
    ipWhitelist?: string[];
  } | null;
  rateLimits: {
    requestsPerMinute?: number;
    requestsPerDay?: number;
  } | null;
  expiresAt: Date | null;
}

// User subscription data
export interface SubscriptionData {
  id: string;
  userId: string;
  modelId: string;
  planId: string | null;
  status: 'active' | 'paused' | 'cancelled' | 'expired' | 'trial';
  currentPeriodEnd: Date;
  usedRequests: number;
  usedTokens: number;
  limits: {
    requestsPerMonth?: number;
    tokensPerMonth?: number;
    concurrentRequests?: number;
  } | null;
}

// Model endpoint data
export interface EndpointData {
  id: string;
  modelId: string;
  slug: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  baseUrl: string;
  pricePerRequest: number | null;
  pricePerToken: number | null;
  isActive: boolean;
  requestSchema: Record<string, unknown> | null;
}

// Gateway request context
export interface GatewayContext {
  apiKey: ApiKeyData;
  subscription: SubscriptionData | null;
  endpoint: EndpointData;
  user: {
    id: string;
    balance: number;
  };
}

// Environment type for Hono
export type GatewayEnv = {
  Variables: {
    gateway: GatewayContext;
    requestId: string;
    startTime: number;
  };
};

// Extended Hono context with gateway data
export type GatewayHonoContext = HonoContext<GatewayEnv>;

// Rate limit result
export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
  limit: number;
}

// Proxy request options
export interface ProxyRequestOptions {
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: unknown;
  timeout?: number;
}

// Proxy response
export interface ProxyResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: unknown;
  responseTimeMs: number;
  tokensUsed?: number;
}

// Usage log entry
export interface UsageLogEntry {
  apiKeyId: string;
  userId: string;
  modelId: string;
  endpointId: string;
  subscriptionId?: string;
  method: string;
  path: string;
  statusCode: number;
  responseTimeMs: number;
  tokensUsed?: number;
  cost?: number;
  ipAddress?: string;
  userAgent?: string;
  errorCode?: string;
  errorMessage?: string;
}

// Gateway configuration
export interface GatewayConfig {
  databaseUrl: string;
  redisUrl?: string;
  defaultTimeout: number;
  maxBodySize: number;
  rateLimiting: {
    enabled: boolean;
    defaultRequestsPerMinute: number;
    defaultRequestsPerDay: number;
  };
  cors: {
    allowedOrigins: string[];
    allowedMethods: string[];
    allowedHeaders: string[];
  };
}
