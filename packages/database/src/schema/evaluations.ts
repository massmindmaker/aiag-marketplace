import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  boolean,
  numeric,
  bigint,
  jsonb,
  index,
} from 'drizzle-orm/pg-core';
import { users } from './users';
import { contests, contestSubmissions } from './contests';

/**
 * Plan 07 Task 1: user-uploaded eval scripts (plugin evaluators).
 * SECURITY-TODO Phase 2: admin code review required before approval (status='approved').
 * SECURITY-TODO Phase 2: ClamAV scan on upload + static analysis (bandit/semgrep).
 */
export const evaluatorScripts = pgTable(
  'evaluator_scripts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    contestId: uuid('contest_id')
      .notNull()
      .references(() => contests.id, { onDelete: 'cascade' }),
    authorId: uuid('author_id')
      .notNull()
      .references(() => users.id),
    s3Key: text('s3_key').notNull(),
    language: text('language').notNull().default('python3.11'),
    sha256: text('sha256').notNull(),
    sizeBytes: bigint('size_bytes', { mode: 'number' }).notNull(),
    status: text('status').notNull().default('pending'), // pending | approved | rejected
    reviewedBy: uuid('reviewed_by').references(() => users.id),
    reviewedAt: timestamp('reviewed_at', { mode: 'date' }),
    reviewNotes: text('review_notes'),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  },
  (table) => ({
    contestIdx: index('evaluator_scripts_contest_idx').on(table.contestId),
    statusIdx: index('evaluator_scripts_status_idx').on(table.status),
  })
);

/**
 * Plan 07 Task 7 — per-submission evaluation run log.
 */
export const evaluations = pgTable(
  'evaluations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    submissionId: uuid('submission_id')
      .notNull()
      .references(() => contestSubmissions.id, { onDelete: 'cascade' }),
    contestId: uuid('contest_id')
      .notNull()
      .references(() => contests.id),
    evaluatorType: text('evaluator_type').notNull(), // generic | plugin
    evaluatorScriptId: uuid('evaluator_script_id').references(
      () => evaluatorScripts.id
    ),
    startedAt: timestamp('started_at', { mode: 'date' }).defaultNow().notNull(),
    finishedAt: timestamp('finished_at', { mode: 'date' }),
    durationS: numeric('duration_s', { precision: 10, scale: 2 }),
    exitCode: integer('exit_code'),
    timedOut: boolean('timed_out').default(false),
    stdoutTruncated: text('stdout_truncated'),
    stderrTruncated: text('stderr_truncated'),
    metrics: jsonb('metrics').$type<Record<string, number>>(),
    publicScore: numeric('public_score', { precision: 20, scale: 10 }),
    privateScore: numeric('private_score', { precision: 20, scale: 10 }),
    status: text('status').notNull().default('running'), // running | success | failed | timeout | invalid
  },
  (table) => ({
    submissionIdx: index('evaluations_submission_idx').on(table.submissionId),
    contestIdx: index('evaluations_contest_idx').on(table.contestId),
  })
);

export type EvaluatorScript = typeof evaluatorScripts.$inferSelect;
export type NewEvaluatorScript = typeof evaluatorScripts.$inferInsert;
export type Evaluation = typeof evaluations.$inferSelect;
export type NewEvaluation = typeof evaluations.$inferInsert;
