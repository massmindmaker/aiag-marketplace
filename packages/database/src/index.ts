import { drizzle as drizzleNeon } from 'drizzle-orm/neon-http';
import { drizzle as drizzlePg } from 'drizzle-orm/node-postgres';
import { neon } from '@neondatabase/serverless';
import { Pool } from 'pg';
import * as schema from './schema';

// Heuristic: Neon serverless HTTP works for *.neon.tech URLs (and Vercel
// Postgres which proxies to it). Anything else (localhost, self-hosted
// Postgres, the SSH-tunnelled VPS Postgres on 127.0.0.1:15432) must go
// through the standard `pg` driver over TCP.
function shouldUseNeon(connectionString: string): boolean {
  return /neon\.tech|vercel-storage\.com/.test(connectionString);
}

// Create database client
export function createDb(connectionString: string) {
  if (shouldUseNeon(connectionString)) {
    const sql = neon(connectionString);
    return drizzleNeon(sql, { schema }) as unknown as ReturnType<typeof drizzlePg<typeof schema>>;
  }
  const pool = new Pool({ connectionString });
  return drizzlePg(pool, { schema });
}

// Create database client for edge runtime (Neon HTTP only)
export function createEdgeDb(connectionString: string) {
  const sql = neon(connectionString);
  return drizzleNeon(sql, { schema });
}

// Export schema
export * from './schema';

// Export drizzle utilities
export { sql, eq, and, or, desc, asc, like, ilike, inArray, notInArray, isNull, isNotNull, between, gt, gte, lt, lte, ne, count, sum, avg, min, max } from 'drizzle-orm';

// Type for database instance
export type Database = ReturnType<typeof createDb>;
