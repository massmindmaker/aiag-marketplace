import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema';

// Create database client
export function createDb(connectionString: string) {
  const sql = neon(connectionString);
  return drizzle(sql, { schema });
}

// Create database client for edge runtime (same as createDb for neon-http)
export function createEdgeDb(connectionString: string) {
  const sql = neon(connectionString);
  return drizzle(sql, { schema });
}

// Export schema
export * from './schema';

// Export drizzle utilities
export { sql, eq, and, or, desc, asc, like, ilike, inArray, notInArray, isNull, isNotNull, between, gt, gte, lt, lte, ne, count, sum, avg, min, max } from 'drizzle-orm';

// Type for database instance
export type Database = ReturnType<typeof createDb>;
