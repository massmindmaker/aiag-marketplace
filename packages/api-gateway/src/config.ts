import { z } from 'zod';

/**
 * Plan 04 gateway configuration loader (zod-validated).
 * Reads from process.env at import time. Tests can override via env before import.
 */
const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(8787),
  DATABASE_URL: z.string().default('postgres://localhost:5432/aiag_test'),
  REDIS_URL: z.string().default('redis://127.0.0.1:6379'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error', 'fatal', 'silent']).default('info'),
  // CBR endpoints (FIX H5/H6)
  CBR_URL: z.string().default('https://www.cbr.ru/scripts/XML_daily.asp'),
  CBR_FALLBACK_URL: z.string().optional(),
  CBR_RATE_SPREAD_PCT: z.coerce.number().default(2),
  // Pricing
  DEFAULT_MARKUP: z.coerce.number().default(1.25),
  BATCH_DISCOUNT: z.coerce.number().default(0.5),
  CACHING_DISCOUNT: z.coerce.number().default(0.5),
  BYOK_FEE_RUB: z.coerce.number().default(0.5),
  // Metrics
  METRICS_TOKEN: z.string().optional(),
  METRICS_PORT: z.coerce.number().default(9090),
  // Graceful shutdown
  SHUTDOWN_DRAIN_TIMEOUT_MS: z.coerce.number().default(30_000),
});

export type AppConfig = z.infer<typeof schema>;

export const config: AppConfig = schema.parse(process.env);
