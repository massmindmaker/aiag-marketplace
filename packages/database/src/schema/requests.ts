import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  varchar,
  jsonb,
  integer,
  numeric,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users';
import { organizations } from './organizations';
import { requestTypeEnum, requestStatusEnum } from './enums';

export const marketplaceRequests = pgTable(
  'marketplace_requests',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    slug: varchar('slug', { length: 100 }).notNull(),
    title: text('title').notNull(),
    description: text('description'),
    type: requestTypeEnum('type').default('api_development').notNull(),
    status: requestStatusEnum('status').default('open').notNull(),

    // Budget
    budgetMin: numeric('budget_min', { precision: 12, scale: 2 }),
    budgetMax: numeric('budget_max', { precision: 12, scale: 2 }),
    currency: varchar('currency', { length: 3 }).default('RUB'),

    // Requirements
    requirements: jsonb('requirements').$type<{
      technologies?: string[];
      deliverables?: string[];
      timeline?: string;
      expertise?: string[];
    }>(),

    // Tags
    tags: text('tags').array(),

    // Attachments
    attachments: jsonb('attachments').$type<
      Array<{
        name: string;
        url: string;
        size: number;
        type: string;
      }>
    >(),

    // Statistics
    totalResponses: integer('total_responses').default(0).notNull(),
    viewCount: integer('view_count').default(0).notNull(),

    // Deadline
    deadline: timestamp('deadline', { mode: 'date' }),

    // Ownership
    ownerId: uuid('owner_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    organizationId: uuid('organization_id')
      .references(() => organizations.id, { onDelete: 'set null' }),

    // Visibility
    isPublic: boolean('is_public').default(true).notNull(),

    // Timestamps
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
    closedAt: timestamp('closed_at', { mode: 'date' }),
  },
  (table) => ({
    slugOwnerIdx: uniqueIndex('requests_slug_owner_idx').on(table.slug, table.ownerId),
    typeIdx: index('requests_type_idx').on(table.type),
    statusIdx: index('requests_status_idx').on(table.status),
    ownerIdx: index('requests_owner_idx').on(table.ownerId),
    publicIdx: index('requests_public_idx').on(table.isPublic, table.status),
    deadlineIdx: index('requests_deadline_idx').on(table.deadline),
  })
);

export const requestResponses = pgTable(
  'request_responses',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    requestId: uuid('request_id')
      .notNull()
      .references(() => marketplaceRequests.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    // Response
    proposal: text('proposal').notNull(),
    estimatedBudget: numeric('estimated_budget', { precision: 12, scale: 2 }),
    estimatedTimeline: text('estimated_timeline'),

    // Portfolio/Examples
    portfolio: jsonb('portfolio').$type<
      Array<{
        title: string;
        description?: string;
        url?: string;
      }>
    >(),

    // Status
    status: varchar('status', { length: 20 }).default('pending').notNull(), // 'pending' | 'shortlisted' | 'accepted' | 'rejected'

    // Communication
    lastMessageAt: timestamp('last_message_at', { mode: 'date' }),

    // Timestamps
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
  },
  (table) => ({
    requestUserIdx: uniqueIndex('responses_request_user_idx').on(
      table.requestId,
      table.userId
    ),
    requestIdx: index('responses_request_idx').on(table.requestId),
    userIdx: index('responses_user_idx').on(table.userId),
    statusIdx: index('responses_status_idx').on(table.status),
  })
);

// Relations
export const marketplaceRequestsRelations = relations(
  marketplaceRequests,
  ({ one, many }) => ({
    owner: one(users, {
      fields: [marketplaceRequests.ownerId],
      references: [users.id],
    }),
    organization: one(organizations, {
      fields: [marketplaceRequests.organizationId],
      references: [organizations.id],
    }),
    responses: many(requestResponses),
  })
);

export const requestResponsesRelations = relations(requestResponses, ({ one }) => ({
  request: one(marketplaceRequests, {
    fields: [requestResponses.requestId],
    references: [marketplaceRequests.id],
  }),
  user: one(users, {
    fields: [requestResponses.userId],
    references: [users.id],
  }),
}));

// Types
export type MarketplaceRequest = typeof marketplaceRequests.$inferSelect;
export type NewMarketplaceRequest = typeof marketplaceRequests.$inferInsert;
export type RequestResponse = typeof requestResponses.$inferSelect;
export type NewRequestResponse = typeof requestResponses.$inferInsert;
