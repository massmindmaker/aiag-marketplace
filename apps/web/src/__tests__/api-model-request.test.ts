import { describe, it, expect } from 'vitest';
import { POST } from '@/app/api/marketplace/model-request/route';

function makeRequest(body: unknown) {
  return new Request('http://localhost/api/marketplace/model-request', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }) as unknown as Parameters<typeof POST>[0];
}

const validPayload = {
  modelName: 'Llama 3 70B',
  provider: 'Meta',
  website: 'https://llama.meta.com',
  modality: 'llm',
  hostingRegion: 'us',
  useCase:
    'Нужна open-source LLM для внутреннего инструмента аналитики — суммаризация тикетов поддержки.',
  contactEmail: 'dev@example.com',
  contactName: 'Иван Петров',
};

describe('POST /api/marketplace/model-request', () => {
  it('accepts a valid payload and returns 202', async () => {
    const res = await POST(makeRequest(validPayload));
    expect(res.status).toBe(202);
    const j = await res.json();
    expect(j.ok).toBe(true);
  });

  it('rejects missing required fields', async () => {
    const res = await POST(
      makeRequest({
        modelName: 'X',
        provider: '',
        modality: 'llm',
        useCase: 'short',
        contactEmail: 'bad',
      }),
    );
    expect(res.status).toBe(400);
    const j = await res.json();
    expect(j.error).toBe('validation_failed');
    expect(Array.isArray(j.issues)).toBe(true);
    expect(j.issues.length).toBeGreaterThan(0);
  });

  it('rejects invalid modality enum', async () => {
    const res = await POST(
      makeRequest({ ...validPayload, modality: 'quantum' }),
    );
    expect(res.status).toBe(400);
  });

  it('rejects invalid JSON', async () => {
    const res = await POST(
      new Request('http://localhost/api/marketplace/model-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{not json',
      }) as unknown as Parameters<typeof POST>[0],
    );
    expect(res.status).toBe(400);
    const j = await res.json();
    expect(j.error).toBe('invalid_json');
  });
});
