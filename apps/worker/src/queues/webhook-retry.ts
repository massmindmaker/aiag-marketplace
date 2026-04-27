import { Worker, type Job, type Processor } from 'bullmq';
import type IORedis from 'ioredis';
import { logger } from '../logger.js';
import { QUEUE_NAMES } from './names.js';

export interface WebhookRetryJobData {
  url: string;
  body: unknown;
  headers?: Record<string, string>;
  attempt?: number;
  /** Caller-provided correlation id (e.g. webhook delivery row id) */
  deliveryId?: string;
}

export interface WebhookRetryResult {
  ok: boolean;
  status?: number;
  error?: string;
  attempt: number;
}

export const MAX_WEBHOOK_ATTEMPTS = 5;

export type WebhookFetcher = (
  url: string,
  init: { method: 'POST'; headers: Record<string, string>; body: string }
) => Promise<{ ok: boolean; status: number; text: () => Promise<string> }>;

export interface WebhookRetryDeps {
  fetcher?: WebhookFetcher;
  /** Optional success/permanent-failure side effect (audit log etc.) */
  sink?: (result: WebhookRetryResult & { deliveryId?: string }) => Promise<void>;
}

const defaultFetcher: WebhookFetcher = (url, init) => fetch(url, init);

function nextDelayMs(attempt: number): number {
  // 30s, 2m, 8m, 30m, 2h
  const ladder = [30_000, 120_000, 480_000, 1_800_000, 7_200_000];
  return ladder[Math.min(attempt, ladder.length - 1)];
}

export function buildWebhookRetryProcessor(
  deps: WebhookRetryDeps = {}
): Processor<WebhookRetryJobData, WebhookRetryResult, string> {
  const fetcher = deps.fetcher ?? defaultFetcher;

  return async (job: Job<WebhookRetryJobData>) => {
    const attempt = (job.data.attempt ?? 0) + 1;
    const headers = {
      'content-type': 'application/json',
      'user-agent': 'aiag-webhook/1.0',
      ...(job.data.headers ?? {}),
    };

    let result: WebhookRetryResult;
    try {
      const res = await fetcher(job.data.url, {
        method: 'POST',
        headers,
        body: JSON.stringify(job.data.body),
      });
      result = { ok: res.ok, status: res.status, attempt };
    } catch (err) {
      result = { ok: false, error: (err as Error).message, attempt };
    }

    if (!result.ok && attempt < MAX_WEBHOOK_ATTEMPTS) {
      const delay = nextDelayMs(attempt);
      await job.queue?.add(
        job.name,
        { ...job.data, attempt },
        { delay }
      );
      logger.warn(
        { url: job.data.url, attempt, delay, status: result.status, error: result.error },
        'webhook-retry: scheduled retry'
      );
    } else {
      logger.info(
        { url: job.data.url, attempt, ok: result.ok, status: result.status },
        'webhook-retry: terminal'
      );
    }

    if (deps.sink && (result.ok || attempt >= MAX_WEBHOOK_ATTEMPTS)) {
      await deps.sink({ ...result, deliveryId: job.data.deliveryId });
    }
    return result;
  };
}

export function startWebhookRetryWorker(
  connection: IORedis,
  deps: WebhookRetryDeps = {}
): Worker<WebhookRetryJobData, WebhookRetryResult> {
  return new Worker<WebhookRetryJobData, WebhookRetryResult>(
    QUEUE_NAMES.webhookRetry,
    buildWebhookRetryProcessor(deps),
    { connection, concurrency: 8 }
  );
}
