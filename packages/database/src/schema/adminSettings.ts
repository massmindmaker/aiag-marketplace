import { pgTable, varchar, jsonb, timestamp, text } from 'drizzle-orm/pg-core';

/**
 * admin_settings — global config singleton store keyed by string.
 * Plan 11 migration 0011_admin.sql.
 */
export const adminSettings = pgTable('admin_settings', {
  key: varchar('key', { length: 100 }).primaryKey(),
  value: jsonb('value').notNull(),
  description: text('description'),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow(),
  updatedByEmail: varchar('updated_by_email', { length: 255 }),
});

export type AdminSetting = typeof adminSettings.$inferSelect;
export type NewAdminSetting = typeof adminSettings.$inferInsert;
