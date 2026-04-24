/**
 * Minimal structured logger (stub). Replace with pino in production.
 */
export interface Logger {
  info(data: Record<string, unknown> | string, msg?: string): void;
  warn(data: Record<string, unknown> | string, msg?: string): void;
  error(data: Record<string, unknown> | string, msg?: string): void;
  debug(data: Record<string, unknown> | string, msg?: string): void;
}

function fmt(name: string, level: string, data: Record<string, unknown> | string, msg?: string): string {
  const base = { level, name, time: new Date().toISOString() };
  if (typeof data === 'string') return JSON.stringify({ ...base, msg: data });
  return JSON.stringify({ ...base, ...data, msg: msg ?? (data as any).msg });
}

export function createLogger(name: string): Logger {
  const silent = process.env.NODE_ENV === 'test' && !process.env.LOG_VERBOSE;
  const out = (lvl: string, data: any, msg?: string) => {
    if (silent) return;
    // eslint-disable-next-line no-console
    (lvl === 'error' ? console.error : console.log)(fmt(name, lvl, data, msg));
  };
  return {
    info: (d, m) => out('info', d, m),
    warn: (d, m) => out('warn', d, m),
    error: (d, m) => out('error', d, m),
    debug: (d, m) => out('debug', d, m),
  };
}
