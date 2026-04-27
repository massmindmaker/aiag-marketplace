import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  base: { service: 'aiag-worker' },
});

export type Logger = typeof logger;
