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
 * Plan 08 Task 12 — Status page (self-hosted)
 *
 * Живая таблица инцидентов + history updates для публичной /status.
 */

export const incidents = pgTable(
  'incidents',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    title: varchar('title', { length: 200 }).notNull(),
    status: varchar('status', { length: 20 }).notNull(), // investigating | identified | monitoring | resolved
    impact: varchar('impact', { length: 20 }).notNull(), // none | minor | major | critical
    componentsAffected: text('components_affected').array(),
    description: text('description'),
    startedAt: timestamp('started_at', { mode: 'date' }).notNull().defaultNow(),
    resolvedAt: timestamp('resolved_at', { mode: 'date' }),
    createdBy: uuid('created_by').references(() => users.id),
  },
  (t) => ({
    startedIdx: index('incidents_started_idx').on(t.startedAt),
    statusIdx: index('incidents_status_idx').on(t.status),
  })
);

export const incidentUpdates = pgTable(
  'incident_updates',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    incidentId: uuid('incident_id').references(() => incidents.id).notNull(),
    message: text('message').notNull(),
    postedAt: timestamp('posted_at', { mode: 'date' }).notNull().defaultNow(),
    postedBy: uuid('posted_by').references(() => users.id),
  },
  (t) => ({
    incidentIdx: index('incident_updates_incident_idx').on(t.incidentId),
  })
);

export const statusSubscribers = pgTable(
  'status_subscribers',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    subscribedAt: timestamp('subscribed_at', { mode: 'date' }).notNull().defaultNow(),
    unsubscribedAt: timestamp('unsubscribed_at', { mode: 'date' }),
  }
);

export type Incident = typeof incidents.$inferSelect;
export type NewIncident = typeof incidents.$inferInsert;
export type IncidentUpdate = typeof incidentUpdates.$inferSelect;
