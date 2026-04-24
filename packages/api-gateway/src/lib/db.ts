import postgres from 'postgres';
import { config } from '../config';

/**
 * postgres.js client singleton for direct SQL calls (stored functions, fast
 * INSERTs). Drizzle remains usable via `@aiag/database` for typed queries.
 */
export const sql = postgres(config.DATABASE_URL, {
  max: 20,
  idle_timeout: 30,
  // Avoid crash when DATABASE_URL is unreachable during test boot; tests
  // should stub this module.
  onnotice: () => {},
});

export type SqlClient = typeof sql;
