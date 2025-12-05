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
import {
  modelTypeEnum,
  modelStatusEnum,
  pricingTypeEnum,
  httpMethodEnum,
} from './enums';

export const aiModels = pgTable(
  'ai_models',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    slug: varchar('slug', { length: 100 }).notNull(),
    name: text('name').notNull(),
    shortDescription: text('short_description'),
    description: text('description'),
    type: modelTypeEnum('type').notNull(),
    status: modelStatusEnum('status').default('draft').notNull(),

    // Branding
    logo: text('logo'),
    banner: text('banner'),
    tags: text('tags').array(),

    // API Configuration
    baseUrl: text('base_url'),
    documentationUrl: text('documentation_url'),
    termsUrl: text('terms_url'),
    privacyUrl: text('privacy_url'),

    // Capabilities and features
    capabilities: jsonb('capabilities').$type<{
      maxTokens?: number;
      contextWindow?: number;
      supportedLanguages?: string[];
      supportedFormats?: string[];
      features?: string[];
    }>(),

    // Model specifications
    specifications: jsonb('specifications').$type<{
      modelVersion?: string;
      parameters?: string;
      architecture?: string;
      trainingData?: string;
      benchmarks?: Record<string, number>;
    }>(),

    // Pricing
    pricingType: pricingTypeEnum('pricing_type').default('pay_per_use'),

    // Rate limits
    rateLimits: jsonb('rate_limits').$type<{
      requestsPerMinute?: number;
      requestsPerDay?: number;
      tokensPerMinute?: number;
    }>(),

    // Statistics (denormalized for performance)
    totalRequests: integer('total_requests').default(0).notNull(),
    totalSubscribers: integer('total_subscribers').default(0).notNull(),
    avgRating: numeric('avg_rating', { precision: 3, scale: 2 }),
    totalReviews: integer('total_reviews').default(0).notNull(),

    // Visibility
    isPublic: boolean('is_public').default(false).notNull(),
    isFeatured: boolean('is_featured').default(false).notNull(),

    // Ownership
    ownerId: uuid('owner_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    organizationId: uuid('organization_id')
      .references(() => organizations.id, { onDelete: 'set null' }),

    // Timestamps
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
    publishedAt: timestamp('published_at', { mode: 'date' }),
  },
  (table) => ({
    slugOwnerIdx: uniqueIndex('ai_models_slug_owner_idx').on(table.slug, table.ownerId),
    typeIdx: index('ai_models_type_idx').on(table.type),
    statusIdx: index('ai_models_status_idx').on(table.status),
    ownerIdx: index('ai_models_owner_idx').on(table.ownerId),
    orgIdx: index('ai_models_org_idx').on(table.organizationId),
    publicIdx: index('ai_models_public_idx').on(table.isPublic, table.status),
    featuredIdx: index('ai_models_featured_idx').on(table.isFeatured),
  })
);

export const modelEndpoints = pgTable(
  'model_endpoints',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    modelId: uuid('model_id')
      .notNull()
      .references(() => aiModels.id, { onDelete: 'cascade' }),

    // Endpoint details
    name: text('name').notNull(),
    slug: varchar('slug', { length: 100 }).notNull(),
    description: text('description'),
    method: httpMethodEnum('method').default('POST').notNull(),
    path: text('path').notNull(),

    // Request/Response schema
    requestSchema: jsonb('request_schema').$type<{
      contentType: string;
      headers?: Record<string, string>;
      body?: Record<string, unknown>;
      queryParams?: Record<string, unknown>;
    }>(),
    responseSchema: jsonb('response_schema').$type<{
      contentType: string;
      body?: Record<string, unknown>;
    }>(),

    // Example
    exampleRequest: jsonb('example_request'),
    exampleResponse: jsonb('example_response'),

    // Pricing per endpoint (optional override)
    pricePerRequest: numeric('price_per_request', { precision: 10, scale: 6 }),
    pricePerToken: numeric('price_per_token', { precision: 10, scale: 8 }),

    // Status
    isActive: boolean('is_active').default(true).notNull(),
    isDeprecated: boolean('is_deprecated').default(false).notNull(),
    deprecationMessage: text('deprecation_message'),

    // Order for display
    displayOrder: integer('display_order').default(0).notNull(),

    // Timestamps
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
  },
  (table) => ({
    modelIdx: index('model_endpoints_model_idx').on(table.modelId),
    slugModelIdx: uniqueIndex('model_endpoints_slug_model_idx').on(
      table.slug,
      table.modelId
    ),
  })
);

export const pricingPlans = pgTable(
  'pricing_plans',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    modelId: uuid('model_id')
      .notNull()
      .references(() => aiModels.id, { onDelete: 'cascade' }),

    // Plan details
    name: text('name').notNull(),
    slug: varchar('slug', { length: 100 }).notNull(),
    description: text('description'),

    // Pricing
    price: numeric('price', { precision: 12, scale: 2 }).notNull(),
    currency: varchar('currency', { length: 3 }).default('RUB').notNull(),
    billingPeriod: varchar('billing_period', { length: 20 }).default('monthly'), // 'monthly' | 'yearly' | 'one_time'

    // Limits
    limits: jsonb('limits').$type<{
      requestsPerMonth?: number;
      tokensPerMonth?: number;
      concurrentRequests?: number;
      supportLevel?: 'community' | 'email' | 'priority' | 'dedicated';
    }>(),

    // Features
    features: text('features').array(),

    // Trial
    trialDays: integer('trial_days').default(0),

    // Status
    isActive: boolean('is_active').default(true).notNull(),
    isPopular: boolean('is_popular').default(false).notNull(),
    displayOrder: integer('display_order').default(0).notNull(),

    // Timestamps
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
  },
  (table) => ({
    modelIdx: index('pricing_plans_model_idx').on(table.modelId),
    slugModelIdx: uniqueIndex('pricing_plans_slug_model_idx').on(
      table.slug,
      table.modelId
    ),
  })
);

export const modelReviews = pgTable(
  'model_reviews',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    modelId: uuid('model_id')
      .notNull()
      .references(() => aiModels.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    // Review
    rating: integer('rating').notNull(), // 1-5
    title: text('title'),
    content: text('content'),

    // Helpful votes
    helpfulCount: integer('helpful_count').default(0).notNull(),

    // Moderation
    isVerified: boolean('is_verified').default(false).notNull(),
    isHidden: boolean('is_hidden').default(false).notNull(),

    // Timestamps
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
  },
  (table) => ({
    modelIdx: index('model_reviews_model_idx').on(table.modelId),
    userIdx: index('model_reviews_user_idx').on(table.userId),
    userModelIdx: uniqueIndex('model_reviews_user_model_idx').on(
      table.userId,
      table.modelId
    ),
  })
);

// Relations
export const aiModelsRelations = relations(aiModels, ({ one, many }) => ({
  owner: one(users, {
    fields: [aiModels.ownerId],
    references: [users.id],
  }),
  organization: one(organizations, {
    fields: [aiModels.organizationId],
    references: [organizations.id],
  }),
  endpoints: many(modelEndpoints),
  pricingPlans: many(pricingPlans),
  reviews: many(modelReviews),
}));

export const modelEndpointsRelations = relations(modelEndpoints, ({ one }) => ({
  model: one(aiModels, {
    fields: [modelEndpoints.modelId],
    references: [aiModels.id],
  }),
}));

export const pricingPlansRelations = relations(pricingPlans, ({ one }) => ({
  model: one(aiModels, {
    fields: [pricingPlans.modelId],
    references: [aiModels.id],
  }),
}));

export const modelReviewsRelations = relations(modelReviews, ({ one }) => ({
  model: one(aiModels, {
    fields: [modelReviews.modelId],
    references: [aiModels.id],
  }),
  user: one(users, {
    fields: [modelReviews.userId],
    references: [users.id],
  }),
}));

// Types
export type AiModel = typeof aiModels.$inferSelect;
export type NewAiModel = typeof aiModels.$inferInsert;
export type ModelEndpoint = typeof modelEndpoints.$inferSelect;
export type NewModelEndpoint = typeof modelEndpoints.$inferInsert;
export type PricingPlan = typeof pricingPlans.$inferSelect;
export type NewPricingPlan = typeof pricingPlans.$inferInsert;
export type ModelReview = typeof modelReviews.$inferSelect;
export type NewModelReview = typeof modelReviews.$inferInsert;
