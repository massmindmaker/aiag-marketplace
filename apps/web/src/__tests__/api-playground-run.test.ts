import { describe, it, expect } from 'vitest';
import { POST } from '@/app/api/playground/run/route';

function makeRequest(body: unknown) {
  return new Request('http://localhost/api/playground/run', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }) as unknown as Parameters<typeof POST>[0];
}

describe('POST /api/playground/run', () => {
  it('rejects request without model', async () => {
    const res = await POST(makeRequest({ prompt: 'hi' }));
    expect(res.status).toBe(400);
    const j = await res.json();
    expect(j.error).toBe('model_required');
  });

  it('rejects request without prompt', async () => {
    const res = await POST(makeRequest({ model: 'openai/gpt-4-turbo' }));
    expect(res.status).toBe(400);
    const j = await res.json();
    expect(j.error).toBe('prompt_required');
  });

  it('returns 404 for unknown model', async () => {
    const res = await POST(
      makeRequest({ model: 'fake/nope', prompt: 'hi' }),
    );
    expect(res.status).toBe(404);
    const j = await res.json();
    expect(j.error).toBe('model_not_found');
  });

  it('streams SSE events with delta chunks for known model', async () => {
    const res = await POST(
      makeRequest({ model: 'openai/gpt-4-turbo', prompt: 'Привет' }),
    );
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toContain('text/event-stream');

    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    let text = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      text += decoder.decode(value, { stream: true });
    }
    expect(text).toMatch(/"delta"/);
    expect(text).toMatch(/"done":true/);
  }, 10000);
});
