import { createDb, type Database } from '@aiag/database';

// Create a global db instance to avoid multiple connections in development
const globalForDb = globalThis as unknown as {
  db: Database | undefined;
};

function getDb(): Database {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  if (!globalForDb.db) {
    globalForDb.db = createDb(process.env.DATABASE_URL);
  }

  return globalForDb.db;
}

// Export a proxy that lazily initializes the database
export const db = new Proxy({} as Database, {
  get(_, prop) {
    return getDb()[prop as keyof Database];
  },
});

export { eq, and, or, desc, asc, like, ilike, sql } from '@aiag/database';
