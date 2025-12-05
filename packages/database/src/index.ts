import { drizzle } from 'drizzle-orm/neon-serverless';
import { neon, neonConfig } from '@neondatabase/serverless';
import * as schema from './schema';

// Configure Neon for serverless environments
neonConfig.fetchConnectionCache = true;

// Create database client
export function createDb(connectionString: string) {
  const sql = neon(connectionString);
  return drizzle(sql, { schema });
}

// Create database client for edge runtime
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
