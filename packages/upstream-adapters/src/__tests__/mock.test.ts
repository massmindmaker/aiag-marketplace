import { describe, it, expect } from 'vitest';
import { MockAdapter } from '../adapters/mock';

describe('MockAdapter', () => {
  it('listModels returns default curated catalog', async () => {
    const adapter = new MockAdapter();
    const models = await adapter.listModels();
    expect(models.length).toBeGreaterThanOrEqual(3);
    expect(models.some((m) => m.id === 'mock-gpt-4o')).toBe(true);
    expect(models.some((m) => m.id === 'mock-dall-e-3')).toBe(true);
  });

  it('listModels returns custom models when provided', async () => {
    const adapter = new MockAdapter({
      models: [{ id: 'custom-1', name: 'Custom', modality: 'chat' }],
    });
    const models = await adapter.listModels();
    expect(models).toHaveLength(1);
    expect(models[0].id).toBe('custom-1');
  });

  it('chatCompletions returns deterministic JSON response', async () => {
    const adapter = new MockAdapter();
    const res = await adapter.chatCompletions(
      { model: 'mock-gpt-4o', messages: [{ role: 'user', content: 'hi' }] },
      { request_id: 'req-1' },
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { choices: Array<{ message: { content: string } }> };
    expect(body.choices[0].message.content).toContain('mock response');
  });

  it('chatCompletions with stream returns SSE', async () => {
    const adapter = new MockAdapter();
    const res = await adapter.chatCompletions(
      { model: 'mock-gpt-4o', messages: [{ role: 'user', content: 'hi' }] },
      { request_id: 'req-2', stream: true },
    );
    expect(res.headers.get('content-type')).toBe('text/event-stream');
    const text = await res.text();
    expect(text).toContain('[DONE]');
    expect(text).toContain('data:');
  });

  it('chatCompletions uses custom chatResponse when configured', async () => {
    const adapter = new MockAdapter({
      chatResponse: { role: 'assistant', content: 'CUSTOM' },
    });
    const res = await adapter.chatCompletions(
      { model: 'x', messages: [{ role: 'user', content: 'hi' }] },
      { request_id: 'r' },
    );
    const body = (await res.json()) as { choices: Array<{ message: { content: string } }> };
    expect(body.choices[0].message.content).toBe('CUSTOM');
  });

  it('imageGenerations returns async handle', async () => {
    const adapter = new MockAdapter();
    const handle = await adapter.imageGenerations(
      { model: 'mock-dall-e-3', prompt: 'cat' },
      { request_id: 'r3' },
    );
    expect(handle.task_id).toBe('mock-img-r3');
    expect(handle.poll_url).toContain('/mock/poll/');
  });

  it('videoGenerations returns async handle', async () => {
    const adapter = new MockAdapter();
    const handle = await adapter.videoGenerations(
      { model: 'mock-vid', prompt: 'dog' },
      { request_id: 'r4' },
    );
    expect(handle.task_id).toBe('mock-vid-r4');
  });

  it('pollAsync returns completed image output', async () => {
    const adapter = new MockAdapter();
    const result = await adapter.pollAsync('mock-img-r5', { request_id: 'r5' });
    expect(result.status).toBe('completed');
    expect((result.output as { url: string }).url).toContain('mock/images/');
  });

  it('pollAsync returns completed video output', async () => {
    const adapter = new MockAdapter();
    const result = await adapter.pollAsync('mock-vid-r6', { request_id: 'r6' });
    expect(result.status).toBe('completed');
    expect((result.output as { url: string }).url).toContain('mock/videos/');
  });

  it('pollAsync returns pending for unknown task ids', async () => {
    const adapter = new MockAdapter();
    const result = await adapter.pollAsync('other-task', { request_id: 'r' });
    expect(result.status).toBe('pending');
  });

  it('embeddings returns synthetic vectors', async () => {
    const adapter = new MockAdapter();
    const res = await adapter.embeddings(
      { model: 'mock-embedding-3', input: 'hello' },
      { request_id: 'r7' },
    );
    const body = (await res.json()) as { data: Array<{ embedding: number[] }> };
    expect(body.data).toHaveLength(1);
    expect(body.data[0].embedding.length).toBe(1536);
  });

  it('audioSpeech returns a WAV blob', async () => {
    const adapter = new MockAdapter();
    const res = await adapter.audioSpeech({ model: 'mock-tts', input: 'hello' }, { request_id: 'r8' });
    expect(res.headers.get('content-type')).toBe('audio/wav');
    const buf = await res.arrayBuffer();
    expect(buf.byteLength).toBeGreaterThan(0);
  });

  it('audioTranscriptions returns mock text', async () => {
    const adapter = new MockAdapter();
    const res = await adapter.audioTranscriptions({ model: 'mock-whisper' }, { request_id: 'r9' });
    const body = (await res.json()) as { text: string };
    expect(body.text).toContain('mock transcription');
  });

  it('healthCheck returns healthy', async () => {
    const adapter = new MockAdapter();
    const h = await adapter.healthCheck();
    expect(h.status).toBe('healthy');
  });

  it('estimateCost computes credits from model pricing', async () => {
    const adapter = new MockAdapter({ usd_rate: 100, markup: 1.0 });
    const model = await adapter.listModels().then((m) => m.find((x) => x.id === 'mock-gpt-4o')!);
    const cost = await adapter.estimateCost({ messages: [{ role: 'user', content: 'hi' }] }, model);
    expect(cost.credits).toBeGreaterThan(0);
    expect(cost.upstream_cost_usd).toBeGreaterThan(0);
  });

  it('estimateCost returns flat 1.0 credit when pricing is zero', async () => {
    const adapter = new MockAdapter({ usd_rate: 100, markup: 1.0 });
    const cost = await adapter.estimateCost(
      { prompt: 'x' },
      { id: 'free-model', name: 'Free', modality: 'chat' },
    );
    expect(cost.credits).toBe(1.0);
  });

  it('failEveryN simulates errors predictably', async () => {
    const adapter = new MockAdapter({ failEveryN: 2 });
    // 1st call succeeds
    await expect(adapter.healthCheck()).resolves.toBeDefined();
    // 2nd call fails
    await expect(adapter.healthCheck()).rejects.toThrow('simulated failure');
    // 3rd call succeeds
    await expect(adapter.healthCheck()).resolves.toBeDefined();
  });

  it('latencyMs adds artificial delay', async () => {
    const adapter = new MockAdapter({ latencyMs: 50 });
    const start = Date.now();
    await adapter.healthCheck();
    expect(Date.now() - start).toBeGreaterThanOrEqual(45);
  });
});
