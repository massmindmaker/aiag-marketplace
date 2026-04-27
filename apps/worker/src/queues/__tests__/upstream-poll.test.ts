import { describe, it, expect, vi } from 'vitest';
import { buildUpstreamPollProcessor } from '../upstream-poll.js';

function makeJob(data: Record<string, unknown>, queueAdd = vi.fn()) {
  return {
    name: 'poll',
    data,
    queue: { add: queueAdd },
  } as unknown as Parameters<ReturnType<typeof buildUpstreamPollProcessor>>[0];
}

describe('upstream-poll processor', () => {
  it('persists terminal completed status via sink', async () => {
    const sink = vi.fn().mockResolvedValue(undefined);
    const poll = vi.fn().mockResolvedValue({
      status: 'completed',
      outputUrl: 'https://storage.aiag.ru/x.png',
    });
    const proc = buildUpstreamPollProcessor({ poll, sink });
    const result = await proc(
      makeJob({ jobId: 'j1', upstream: 'fal', predictionId: 'p1' }),
      'tok'
    );
    expect(result.status).toBe('completed');
    expect(sink).toHaveBeenCalledWith({
      jobId: 'j1',
      status: 'completed',
      outputUrl: 'https://storage.aiag.ru/x.png',
      errorMessage: undefined,
    });
  });

  it('re-enqueues with backoff while pending', async () => {
    const queueAdd = vi.fn().mockResolvedValue(undefined);
    const sink = vi.fn();
    const poll = vi.fn().mockResolvedValue({ status: 'pending' });
    const proc = buildUpstreamPollProcessor({ poll, sink });
    await proc(
      makeJob({ jobId: 'j2', upstream: 'kie', predictionId: 'p2', pollIntervalMs: 5000 }, queueAdd),
      'tok'
    );
    expect(sink).not.toHaveBeenCalled();
    expect(queueAdd).toHaveBeenCalledOnce();
    const [, , addOpts] = queueAdd.mock.calls[0];
    expect(addOpts.delay).toBeGreaterThanOrEqual(10_000);
    expect(addOpts.delay).toBeLessThanOrEqual(30_000);
  });

  it('fails fast past deadline', async () => {
    const sink = vi.fn().mockResolvedValue(undefined);
    const poll = vi.fn();
    const proc = buildUpstreamPollProcessor({ poll, sink });
    await proc(
      makeJob({
        jobId: 'j3',
        upstream: 'fal',
        predictionId: 'p3',
        deadlineAt: Date.now() - 1000,
      }),
      'tok'
    );
    expect(poll).not.toHaveBeenCalled();
    expect(sink).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'failed', errorMessage: 'deadline_exceeded' })
    );
  });
});
