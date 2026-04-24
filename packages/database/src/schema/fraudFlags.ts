import {
  pgTable,
  uuid,
  text,
  timestamp,
  varchar,
  jsonb,
  index,
} from 'drizzle-orm/pg-core';
import { users } from './users';

/**
 * Plan 08 Task 5 — Anti-fraud ruleset
 *
 * Device fingerprints (FingerprintJS visitor IDs) + fraud flags per user.
 */

export const deviceFingerprints = pgTable(
  'device_fingerprints',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    visitorId: varchar('visitor_id', { length: 64 }).notNull(),
    userId: uuid('user_id').references(() => users.id),
    ipAddress: varchar('ip_address', { length: 45 }).notNull(),
    userAgent: text('user_agent'),
    firstSeenAt: timestamp('first_seen_at', { mode: 'date' }).notNull().defaultNow(),
    lastSeenAt: timestamp('last_seen_at', { mode: 'date' }).notNull().defaultNow(),
  },
  (t) => ({
    visitorIdx: index('device_fingerprints_visitor_idx').on(t.visitorId),
    ipIdx: index('device_fingerprints_ip_idx').on(t.ipAddress),
    userIdx: index('device_fingerprints_user_idx').on(t.userId),
  })
);

export const fraudFlags = pgTable(
  'fraud_flags',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').references(() => users.id),
    flagType: varchar('flag_type', { length: 50 }).notNull(),
    // 'multi_account' | 'api_spike' | 'payment_chargeback' | 'suspicious_fingerprint'
    severity: varchar('severity', { length: 10 }).notNull(), // low | med | high
    details: jsonb('details'),
    resolvedAt: timestamp('resolved_at', { mode: 'date' }),
    resolvedBy: uuid('resolved_by').references(() => users.id),
    createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  },
  (t) => ({
    userIdx: index('fraud_flags_user_idx').on(t.userId),
    typeIdx: index('fraud_flags_type_idx').on(t.flagType),
  })
);

export type DeviceFingerprint = typeof deviceFingerprints.$inferSelect;
export type FraudFlag = typeof fraudFlags.$inferSelect;
export type NewFraudFlag = typeof fraudFlags.$inferInsert;
