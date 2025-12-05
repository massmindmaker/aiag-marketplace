import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  varchar,
  jsonb,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users';
import { orgRoleEnum } from './enums';

export const organizations = pgTable(
  'organizations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    slug: varchar('slug', { length: 100 }).notNull().unique(),
    name: text('name').notNull(),
    description: text('description'),
    logo: text('logo'),
    banner: text('banner'),
    website: text('website'),

    // Contact info
    email: text('email'),
    supportEmail: text('support_email'),

    // Social links
    socialLinks: jsonb('social_links').$type<{
      github?: string;
      twitter?: string;
      linkedin?: string;
      telegram?: string;
      discord?: string;
    }>(),

    // Settings
    settings: jsonb('settings').$type<{
      isPublic: boolean;
      allowJoinRequests: boolean;
      defaultApiVisibility: 'public' | 'private';
    }>().default({
      isPublic: true,
      allowJoinRequests: true,
      defaultApiVisibility: 'public',
    }),

    // Verification
    isVerified: boolean('is_verified').default(false).notNull(),
    verifiedAt: timestamp('verified_at', { mode: 'date' }),

    // Status
    isActive: boolean('is_active').default(true).notNull(),

    // Owner
    ownerId: uuid('owner_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),

    // Timestamps
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
  },
  (table) => ({
    slugIdx: uniqueIndex('organizations_slug_idx').on(table.slug),
    ownerIdx: index('organizations_owner_idx').on(table.ownerId),
    nameIdx: index('organizations_name_idx').on(table.name),
  })
);

export const organizationMembers = pgTable(
  'organization_members',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    role: orgRoleEnum('role').default('viewer').notNull(),

    // Permissions override (if needed)
    permissions: jsonb('permissions').$type<{
      canManageModels?: boolean;
      canManageMembers?: boolean;
      canViewAnalytics?: boolean;
      canManageBilling?: boolean;
    }>(),

    // Timestamps
    joinedAt: timestamp('joined_at', { mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
  },
  (table) => ({
    orgUserIdx: uniqueIndex('org_members_org_user_idx').on(
      table.organizationId,
      table.userId
    ),
    userIdx: index('org_members_user_idx').on(table.userId),
    orgIdx: index('org_members_org_idx').on(table.organizationId),
  })
);

export const organizationInvites = pgTable(
  'organization_invites',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    email: text('email').notNull(),
    role: orgRoleEnum('role').default('viewer').notNull(),
    token: text('token').notNull().unique(),
    invitedById: uuid('invited_by_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    expiresAt: timestamp('expires_at', { mode: 'date' }).notNull(),
    acceptedAt: timestamp('accepted_at', { mode: 'date' }),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  },
  (table) => ({
    tokenIdx: uniqueIndex('org_invites_token_idx').on(table.token),
    orgIdx: index('org_invites_org_idx').on(table.organizationId),
    emailIdx: index('org_invites_email_idx').on(table.email),
  })
);

// Relations
export const organizationsRelations = relations(organizations, ({ one, many }) => ({
  owner: one(users, {
    fields: [organizations.ownerId],
    references: [users.id],
  }),
  members: many(organizationMembers),
  invites: many(organizationInvites),
}));

export const organizationMembersRelations = relations(organizationMembers, ({ one }) => ({
  organization: one(organizations, {
    fields: [organizationMembers.organizationId],
    references: [organizations.id],
  }),
  user: one(users, {
    fields: [organizationMembers.userId],
    references: [users.id],
  }),
}));

export const organizationInvitesRelations = relations(organizationInvites, ({ one }) => ({
  organization: one(organizations, {
    fields: [organizationInvites.organizationId],
    references: [organizations.id],
  }),
  invitedBy: one(users, {
    fields: [organizationInvites.invitedById],
    references: [users.id],
  }),
}));

// Types
export type Organization = typeof organizations.$inferSelect;
export type NewOrganization = typeof organizations.$inferInsert;
export type OrganizationMember = typeof organizationMembers.$inferSelect;
export type NewOrganizationMember = typeof organizationMembers.$inferInsert;
export type OrganizationInvite = typeof organizationInvites.$inferSelect;
export type NewOrganizationInvite = typeof organizationInvites.$inferInsert;
