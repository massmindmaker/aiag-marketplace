import { describe, it, expect } from 'vitest';
import { HuggingFaceAdapter } from '../adapters/huggingface';
import { createFetchMock } from './fetch-mock';

describe('HuggingFaceAdapter', () => {
  it('chatCompletions posts to /models/{id}/v1/chat/completions with Bearer token', async () => {
    const mock = createFetchMock([
      { status: 200, body: { choices: [{ message: { role: 'assistant', content: 'hi' } }] } },
    ]);
    const adapter = new HuggingFaceAdapter({ apiKey: 'hf_abc', fetch: mock.fetch });
    const res = await adapter.chatCompletions(
      {
        model: 'meta-llama/Meta-Llama-3-8B-Instruct',
        messages: [{ role: 'user', content: 'hi' }],
      },
      { request_id: 'r1' },
    );
    expect(res.ok).toBe(true);
    expect(mock.calls[0].url).toContain(
      '/models/meta-llama%2FMeta-Llama-3-8B-Instruct/v1/chat/completions',
    );
    expect(mock.calls[0].headers['authorization']).toBe('Bearer hf_abc');
    const body = JSON.parse(mock.calls[0].body ?? '{}');
    expect(body.messages[0].content).toBe('hi');
  });

  it('embeddings posts to /models/{id}/pipeline/feature-extraction with inputs', async () => {
    const mock = createFetchMock([{ status: 200, body: [[0.1, 0.2, 0.3]] }]);
    const adapter = new HuggingFaceAdapter({ apiKey: 'hf', fetch: mock.fetch });
    await adapter.embeddings(
      { model: 'sentence-transformers/all-MiniLM-L6-v2', input: 'hello' },
      { request_id: 'r' },
    );
    expect(mock.calls[0].url).toContain(
      '/models/sentence-transformers%2Fall-MiniLM-L6-v2/pipeline/feature-extraction',
    );
    const body = JSON.parse(mock.calls[0].body ?? '{}');
    expect(body.inputs).toBe('hello');
  });

  it('imageGenerations posts to /models/{id} with accept: image/png', async () => {
    const mock = createFetchMock([
      {
        status: 200,
        headers: { 'content-type': 'image/png' },
        body: 'BINARY',
      },
    ]);
    const adapter = new HuggingFaceAdapter({ apiKey: 'hf', fetch: mock.fetch });
    await adapter.imageGenerations(
      { model: 'stabilityai/stable-diffusion-xl-base-1.0', prompt: 'cat' },
      { request_id: 'r' },
    );
    expect(mock.calls[0].url).toContain('/models/stabilityai%2Fstable-diffusion-xl-base-1.0');
    expect(mock.calls[0].headers['accept']).toBe('image/png');
    const body = JSON.parse(mock.calls[0].body ?? '{}');
    expect(body.inputs).toBe('cat');
  });

  it('estimateCost returns 0 when model has no pricing (admin must fill)', async () => {
    const adapter = new HuggingFaceAdapter({ apiKey: 'hf' });
    const est = await adapter.estimateCost(
      { messages: [{ role: 'user', content: 'x' }] },
      { id: 'x', name: 'X', modality: 'chat' },
    );
    expect(est.credits).toBe(0);
    expect(est.upstream_cost_usd).toBe(0);
  });

  it('estimateCost delegates to base when pricing is set', async () => {
    const adapter = new HuggingFaceAdapter({ apiKey: 'hf', markup: 1.4, usd_rate: 100 });
    const est = await adapter.estimateCost(
      { messages: [{ role: 'user', content: 'hi' }], max_tokens: 1000 },
      {
        id: 'x',
        name: 'X',
        modality: 'chat',
        context_length: 4096,
        pricing: { input_per_1k: 0.001, output_per_1k: 0.002 },
      },
    );
    expect(est.credits).toBeGreaterThan(0);
  });

  it('default markup is 1.4 (buffer for HF cold-starts / rate limits)', async () => {
    const adapter = new HuggingFaceAdapter({ apiKey: 'hf', usd_rate: 100 });
    const est = await adapter.estimateCost(
      { max_tokens: 1000 },
      {
        id: 'x',
        name: 'X',
        modality: 'chat',
        pricing: { output_per_1k: 1 },
      },
    );
    expect(est.breakdown.markup).toBe(1.4);
  });

  it('listModels returns empty array (admin picks from HF hub)', async () => {
    const adapter = new HuggingFaceAdapter({ apiKey: 'hf' });
    expect(await adapter.listModels()).toEqual([]);
  });

  it('pricingSync returns empty (HF has no pricing API)', async () => {
    const adapter = new HuggingFaceAdapter({ apiKey: 'hf' });
    expect(await adapter.pricingSync()).toEqual([]);
  });
});
