import { Worker, type Job, type Processor } from 'bullmq';
import type IORedis from 'ioredis';
import { logger } from '../logger.js';
import { QUEUE_NAMES } from './names.js';

export interface EmailSendJobData {
  to: string;
  subject: string;
  /** Plain text body (or HTML if isHtml=true) */
  body: string;
  isHtml?: boolean;
  /** Optional template id when @aiag/email is wired in Phase 2 */
  templateId?: string;
  templateVars?: Record<string, unknown>;
}

export interface EmailSendResult {
  ok: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Pluggable transport. Stub by default — Phase 2 will replace with the real
 * @aiag/email package (likely Resend or self-hosted SMTP).
 */
export type EmailTransport = (msg: EmailSendJobData) => Promise<EmailSendResult>;

const stubTransport: EmailTransport = async (msg) => {
  logger.info({ to: msg.to, subject: msg.subject }, 'email-send: STUB (no transport configured)');
  return { ok: true, messageId: `stub-${Date.now()}` };
};

export interface EmailSendDeps {
  transport?: EmailTransport;
}

export function buildEmailSendProcessor(
  deps: EmailSendDeps = {}
): Processor<EmailSendJobData, EmailSendResult, string> {
  const transport = deps.transport ?? stubTransport;
  return async (job: Job<EmailSendJobData>) => {
    const result = await transport(job.data);
    if (!result.ok) {
      logger.error({ to: job.data.to, error: result.error }, 'email-send: failed');
      throw new Error(result.error ?? 'email transport failed');
    }
    return result;
  };
}

export function startEmailSendWorker(
  connection: IORedis,
  deps: EmailSendDeps = {}
): Worker<EmailSendJobData, EmailSendResult> {
  return new Worker<EmailSendJobData, EmailSendResult>(
    QUEUE_NAMES.emailSend,
    buildEmailSendProcessor(deps),
    { connection, concurrency: 4 }
  );
}
