import {
  pgTable,
  uuid,
  text,
  timestamp,
  varchar,
  index,
} from 'drizzle-orm/pg-core';
import { users } from './users';

/**
 * Plan 08 Task 4c — Art.16 152-ФЗ human review flow (H3)
 *
 * Пользователь может оспорить автоматизированное решение (moderation block, fraud flag,
 * Shield-RF routing). SLA на ответ — 30 дней от даты запроса.
 */

export const humanReviewRequests = pgTable(
  'human_review_requests',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').references(() => users.id).notNull(),
    requestType: varchar('request_type', { length: 40 }).notNull(),
    // 'moderation_block' | 'fraud_flag' | 'automated_decision_general' | 'shield_rf_routing'
    relatedEntityType: varchar('related_entity_type', { length: 30 }),
    relatedEntityId: varchar('related_entity_id', { length: 100 }),
    userStatement: text('user_statement').notNull(),
    status: varchar('status', { length: 20 }).notNull().default('pending'),
    // 'pending' | 'in_review' | 'resolved_upheld' | 'resolved_reversed'
    assignedTo: uuid('assigned_to').references(() => users.id),
    adminResponse: text('admin_response'),
    createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
    resolvedAt: timestamp('resolved_at', { mode: 'date' }),
    slaDeadline: timestamp('sla_deadline', { mode: 'date' }).notNull(),
  },
  (t) => ({
    userIdx: index('human_review_requests_user_idx').on(t.userId),
    statusIdx: index('human_review_requests_status_idx').on(t.status),
    slaIdx: index('human_review_requests_sla_idx').on(t.slaDeadline),
  })
);

export type HumanReviewRequest = typeof humanReviewRequests.$inferSelect;
export type NewHumanReviewRequest = typeof humanReviewRequests.$inferInsert;
