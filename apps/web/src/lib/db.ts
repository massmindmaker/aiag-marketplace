import { createDb } from '@aiag/database';

// Create a global db instance to avoid multiple connections in development
const globalForDb = globalThis as unknown as {
  db: ReturnType<typeof createDb> | undefined;
};

export const db = globalForDb.db ?? createDb(process.env.DATABASE_URL!);

if (process.env.NODE_ENV !== 'production') {
  globalForDb.db = db;
}

export { eq, and, or, desc, asc, like, ilike, sql } from '@aiag/database';
