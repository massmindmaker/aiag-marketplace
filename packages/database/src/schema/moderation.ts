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
 * Plan 08 Task 4 — Content moderation infrastructure
 *
 * Абьюз-репорты от пользователей + admin decisions + kill-switch моделей.
 */

export const moderationReports = pgTable(
  'moderation_reports',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    reporterUserId: uuid('reporter_user_id').references(() => users.id),
    targetType: varchar('target_type', { length: 30 }).notNull(), // 'submission' | 'model' | 'prompt' | 'output'
    targetId: varchar('target_id', { length: 100 }).notNull(),
    reason: varchar('reason', { length: 50 }).notNull(), // 'illegal' | 'csam' | 'copyright' | 'other'
    description: text('description'),
    status: varchar('status', { length: 20 }).notNull().default('pending'), // pending | reviewing | resolved | dismissed
    contactEmail: varchar('contact_email', { length: 255 }),
    createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
    resolvedAt: timestamp('resolved_at', { mode: 'date' }),
    resolvedBy: uuid('resolved_by').references(() => users.id),
  },
  (t) => ({
    statusIdx: index('moderation_reports_status_idx').on(t.status),
    targetIdx: index('moderation_reports_target_idx').on(t.targetType, t.targetId),
  })
);

export const moderationDecisions = pgTable('moderation_decisions', {
  id: uuid('id').primaryKey().defaultRandom(),
  reportId: uuid('report_id').references(() => moderationReports.id),
  decision: varchar('decision', { length: 30 }).notNull(), // 'remove' | 'warn' | 'dismiss' | 'escalate'
  notes: text('notes'),
  decidedBy: uuid('decided_by').references(() => users.id).notNull(),
  decidedAt: timestamp('decided_at', { mode: 'date' }).notNull().defaultNow(),
  metadata: jsonb('metadata'),
});

export const killSwitches = pgTable(
  'kill_switches',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    modelKey: varchar('model_key', { length: 100 }).notNull().unique(),
    reason: text('reason').notNull(),
    triggeredBy: uuid('triggered_by').references(() => users.id),
    triggeredAt: timestamp('triggered_at', { mode: 'date' }).notNull().defaultNow(),
    liftedAt: timestamp('lifted_at', { mode: 'date' }),
    liftedBy: uuid('lifted_by').references(() => users.id),
  },
  (t) => ({
    modelIdx: index('kill_switches_model_idx').on(t.modelKey),
  })
);

export type ModerationReport = typeof moderationReports.$inferSelect;
export type NewModerationReport = typeof moderationReports.$inferInsert;
export type KillSwitch = typeof killSwitches.$inferSelect;
