import {
  pgTable,
  uuid,
  text,
  timestamp,
  varchar,
  jsonb,
  numeric,
  index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users';
import { subscriptions } from './subscriptions';
import { paymentStatusEnum } from './enums';

export const payments = pgTable(
  'payments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    subscriptionId: uuid('subscription_id')
      .references(() => subscriptions.id, { onDelete: 'set null' }),

    // Payment details
    amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
    currency: varchar('currency', { length: 3 }).default('RUB').notNull(),
    status: paymentStatusEnum('status').default('pending').notNull(),

    // Tinkoff specific
    tinkoffPaymentId: text('tinkoff_payment_id').unique(),
    tinkoffOrderId: text('tinkoff_order_id').unique(),
    tinkoffStatus: varchar('tinkoff_status', { length: 50 }),
    tinkoffRebillId: text('tinkoff_rebill_id'), // For recurring payments

    // Payment method info
    paymentMethod: varchar('payment_method', { length: 50 }), // 'card' | 'sbp' | 'qr'
    cardPan: varchar('card_pan', { length: 20 }), // Masked PAN: 411111******1111
    cardExpDate: varchar('card_exp_date', { length: 5 }), // MMYY

    // Description
    description: text('description'),

    // Receipt data for FZ-54
    receipt: jsonb('receipt').$type<{
      items: Array<{
        name: string;
        price: number;
        quantity: number;
        amount: number;
        tax: string;
      }>;
      email?: string;
      phone?: string;
    }>(),

    // Metadata
    metadata: jsonb('metadata').$type<Record<string, unknown>>(),

    // Error tracking
    errorCode: varchar('error_code', { length: 50 }),
    errorMessage: text('error_message'),

    // Refund info
    refundedAmount: numeric('refunded_amount', { precision: 12, scale: 2 }),
    refundedAt: timestamp('refunded_at', { mode: 'date' }),
    refundReason: text('refund_reason'),

    // Timestamps
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
    confirmedAt: timestamp('confirmed_at', { mode: 'date' }),
  },
  (table) => ({
    userIdx: index('payments_user_idx').on(table.userId),
    subscriptionIdx: index('payments_subscription_idx').on(table.subscriptionId),
    statusIdx: index('payments_status_idx').on(table.status),
    tinkoffPaymentIdx: index('payments_tinkoff_payment_idx').on(table.tinkoffPaymentId),
    tinkoffOrderIdx: index('payments_tinkoff_order_idx').on(table.tinkoffOrderId),
    createdAtIdx: index('payments_created_at_idx').on(table.createdAt),
  })
);

export const paymentWebhookLogs = pgTable(
  'payment_webhook_logs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    paymentId: uuid('payment_id')
      .references(() => payments.id, { onDelete: 'set null' }),

    // Webhook details
    eventType: varchar('event_type', { length: 50 }).notNull(),
    payload: jsonb('payload').notNull(),

    // Verification
    signatureValid: text('signature_valid'),

    // Processing
    processedAt: timestamp('processed_at', { mode: 'date' }),
    processingError: text('processing_error'),

    // Timestamp
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  },
  (table) => ({
    paymentIdx: index('webhook_logs_payment_idx').on(table.paymentId),
    eventTypeIdx: index('webhook_logs_event_type_idx').on(table.eventType),
    createdAtIdx: index('webhook_logs_created_at_idx').on(table.createdAt),
  })
);

// User balance transactions (for pay-per-use)
export const balanceTransactions = pgTable(
  'balance_transactions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    paymentId: uuid('payment_id')
      .references(() => payments.id, { onDelete: 'set null' }),

    // Transaction details
    type: varchar('type', { length: 20 }).notNull(), // 'deposit' | 'usage' | 'refund' | 'adjustment'
    amount: numeric('amount', { precision: 12, scale: 2 }).notNull(), // Positive for deposits, negative for usage
    balanceBefore: numeric('balance_before', { precision: 12, scale: 2 }).notNull(),
    balanceAfter: numeric('balance_after', { precision: 12, scale: 2 }).notNull(),

    // Reference
    description: text('description'),
    referenceType: varchar('reference_type', { length: 50 }), // 'subscription' | 'api_usage' | 'manual'
    referenceId: uuid('reference_id'),

    // Metadata
    metadata: jsonb('metadata').$type<Record<string, unknown>>(),

    // Timestamp
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  },
  (table) => ({
    userIdx: index('balance_tx_user_idx').on(table.userId),
    paymentIdx: index('balance_tx_payment_idx').on(table.paymentId),
    typeIdx: index('balance_tx_type_idx').on(table.type),
    createdAtIdx: index('balance_tx_created_at_idx').on(table.createdAt),
  })
);

// Developer payouts
export const payouts = pgTable(
  'payouts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),

    // Payout details
    amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
    currency: varchar('currency', { length: 3 }).default('RUB').notNull(),
    status: varchar('status', { length: 20 }).default('pending').notNull(), // 'pending' | 'processing' | 'completed' | 'failed'

    // Bank details (encrypted reference)
    bankDetailsId: uuid('bank_details_id'),

    // Period
    periodStart: timestamp('period_start', { mode: 'date' }).notNull(),
    periodEnd: timestamp('period_end', { mode: 'date' }).notNull(),

    // Processing
    processedAt: timestamp('processed_at', { mode: 'date' }),
    transactionId: text('transaction_id'),
    errorMessage: text('error_message'),

    // Metadata
    metadata: jsonb('metadata').$type<{
      modelEarnings?: Array<{
        modelId: string;
        amount: number;
        requests: number;
      }>;
    }>(),

    // Timestamps
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
  },
  (table) => ({
    userIdx: index('payouts_user_idx').on(table.userId),
    statusIdx: index('payouts_status_idx').on(table.status),
    periodIdx: index('payouts_period_idx').on(table.periodStart, table.periodEnd),
  })
);

// Relations
export const paymentsRelations = relations(payments, ({ one, many }) => ({
  user: one(users, {
    fields: [payments.userId],
    references: [users.id],
  }),
  subscription: one(subscriptions, {
    fields: [payments.subscriptionId],
    references: [subscriptions.id],
  }),
  webhookLogs: many(paymentWebhookLogs),
  balanceTransactions: many(balanceTransactions),
}));

export const paymentWebhookLogsRelations = relations(paymentWebhookLogs, ({ one }) => ({
  payment: one(payments, {
    fields: [paymentWebhookLogs.paymentId],
    references: [payments.id],
  }),
}));

export const balanceTransactionsRelations = relations(balanceTransactions, ({ one }) => ({
  user: one(users, {
    fields: [balanceTransactions.userId],
    references: [users.id],
  }),
  payment: one(payments, {
    fields: [balanceTransactions.paymentId],
    references: [payments.id],
  }),
}));

export const payoutsRelations = relations(payouts, ({ one }) => ({
  user: one(users, {
    fields: [payouts.userId],
    references: [users.id],
  }),
}));

// Types
export type Payment = typeof payments.$inferSelect;
export type NewPayment = typeof payments.$inferInsert;
export type PaymentWebhookLog = typeof paymentWebhookLogs.$inferSelect;
export type NewPaymentWebhookLog = typeof paymentWebhookLogs.$inferInsert;
export type BalanceTransaction = typeof balanceTransactions.$inferSelect;
export type NewBalanceTransaction = typeof balanceTransactions.$inferInsert;
export type Payout = typeof payouts.$inferSelect;
export type NewPayout = typeof payouts.$inferInsert;
