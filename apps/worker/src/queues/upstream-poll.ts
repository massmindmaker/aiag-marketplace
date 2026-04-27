import { Worker, type Job, type Processor } from 'bullmq';
import type IORedis from 'ioredis';
import { logger } from '../logger.js';
import { QUEUE_NAMES } from './names.js';

/**
 * Job payload for upstream-poll queue.
 * The gateway enqueues one of these after submitting an async prediction
 * (e.g. fal-ai or kie image jobs that return a request_id immediately).
 */
export interface UpstreamPollJobData {
  jobId: string; // prediction_jobs.id (uuid)
  upstream: string; // upstream slug
  predictionId: string; // upstream-side request id
  /** Absolute deadline epoch ms — abandon job if exceeded */
  deadlineAt?: number;
  /** Polling interval ms (default 5000) — back off on each retry */
  pollIntervalMs?: number;
}

export interface UpstreamPollResult {
  status: 'completed' | 'failed' | 'pending' | 'cancelled';
  outputUrl?: string;
  error?: string;
  /** Raw upstream payload for debugging */
  raw?: unknown;
}

/**
 * Pluggable poller — adapter-specific. In production the worker bootstrap
 * wires this up via UpstreamRegistry; tests inject a stub.
 */
export type UpstreamPoller = (
  upstream: string,
  predictionId: string
) => Promise<UpstreamPollResult>;

/**
 * Pluggable side effect: persist the terminal job state to DB and mirror
 * media to S3. Real impl uses @aiag/database + S3Uploader; tests assert on it.
 */
export type UpstreamPollSink = (input: {
  jobId: string;
  status: UpstreamPollResult['status'];
  outputUrl?: string;
  errorMessage?: string;
}) => Promise<void>;

export interface UpstreamPollDeps {
  poll: UpstreamPoller;
  sink: UpstreamPollSink;
}

/**
 * Build the BullMQ processor. Re-enqueues itself with backoff while pending,
 * persists final state on completion/failure.
 */
export function buildUpstreamPollProcessor(
  deps: UpstreamPollDeps
): Processor<UpstreamPollJobData, UpstreamPollResult, string> {
  return async (job: Job<UpstreamPollJobData>) => {
    const { jobId, upstream, predictionId, deadlineAt, pollIntervalMs } = job.data;

    if (deadlineAt && Date.now() > deadlineAt) {
      const result: UpstreamPollResult = { status: 'failed', error: 'deadline_exceeded' };
      await deps.sink({
        jobId,
        status: 'failed',
        errorMessage: 'deadline_exceeded',
      });
      return result;
    }

    const result = await deps.poll(upstream, predictionId);

    if (result.status === 'pending') {
      // Re-queue with exponential-ish backoff: 5s → 10s → 15s → … capped at 30s.
      const next = Math.min(30_000, (pollIntervalMs ?? 5000) + 5000);
      // bullmq marks job.queue as protected; reach through any to schedule a
      // delayed retry with the same payload.
      await (job as unknown as { queue?: { add: (name: string, data: unknown, opts: unknown) => Promise<unknown> } }).queue?.add(
        job.name,
        { ...job.data, pollIntervalMs: next },
        { delay: next }
      );
      logger.debug({ jobId, predictionId, next }, 'upstream-poll: re-enqueued');
      return result;
    }

    await deps.sink({
      jobId,
      status: result.status,
      outputUrl: result.outputUrl,
      errorMessage: result.error,
    });
    logger.info({ jobId, status: result.status }, 'upstream-poll: terminal');
    return result;
  };
}

export function startUpstreamPollWorker(
  connection: IORedis,
  deps: UpstreamPollDeps
): Worker<UpstreamPollJobData, UpstreamPollResult> {
  return new Worker<UpstreamPollJobData, UpstreamPollResult>(
    QUEUE_NAMES.upstreamPoll,
    buildUpstreamPollProcessor(deps),
    { connection, concurrency: 8 }
  );
}
