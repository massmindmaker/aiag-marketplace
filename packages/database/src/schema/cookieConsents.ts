import {
  pgTable,
  uuid,
  text,
  timestamp,
  varchar,
  boolean,
  index,
} from 'drizzle-orm/pg-core';
import { users } from './users';

/**
 * Plan 08 Task 4b — Cookie banner + DNT respect (H2)
 *
 * Хранит выбор категорий cookies per user/anonymous + флаг DNT на момент выбора.
 */

export const cookieConsents = pgTable(
  'cookie_consents',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').references(() => users.id),
    anonymousId: varchar('anonymous_id', { length: 64 }),
    essential: boolean('essential').notNull().default(true),
    functional: boolean('functional').notNull().default(false),
    analytics: boolean('analytics').notNull().default(false),
    marketing: boolean('marketing').notNull().default(false),
    dntHeader: boolean('dnt_header').notNull().default(false),
    acceptedAt: timestamp('accepted_at', { mode: 'date' }).notNull().defaultNow(),
    ipAddress: varchar('ip_address', { length: 45 }),
    userAgent: text('user_agent'),
  },
  (t) => ({
    userIdx: index('cookie_consents_user_idx').on(t.userId),
    anonIdx: index('cookie_consents_anon_idx').on(t.anonymousId),
  })
);

export type CookieConsent = typeof cookieConsents.$inferSelect;
export type NewCookieConsent = typeof cookieConsents.$inferInsert;
