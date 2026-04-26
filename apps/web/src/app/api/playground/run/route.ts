import { NextRequest } from 'next/server';
import { getModelBySlug } from '@/lib/marketplace/catalog';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface RunRequest {
  model?: string;
  prompt?: string;
}

/**
 * Mock playground endpoint.
 *
 * Until Plan 04 gateway is wired up, this returns a canned streaming response
 * in SSE format compatible with the client playground UI. The request shape
 * matches what the future real gateway will expect so the UI won't change.
 */
export async function POST(req: NextRequest) {
  let body: RunRequest;
  try {
    body = (await req.json()) as RunRequest;
  } catch {
    return Response.json({ error: 'invalid_json' }, { status: 400 });
  }

  const modelSlug = (body.model ?? '').trim();
  const prompt = (body.prompt ?? '').trim();

  if (!modelSlug) {
    return Response.json({ error: 'model_required' }, { status: 400 });
  }
  if (!prompt) {
    return Response.json({ error: 'prompt_required' }, { status: 400 });
  }
  const model = getModelBySlug(modelSlug);
  if (!model) {
    return Response.json({ error: 'model_not_found' }, { status: 404 });
  }

  const response = buildMockResponse(model.name, prompt);

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      for (const chunk of chunkText(response, 18)) {
        controller.enqueue(encoder.encode(sseEvent({ delta: chunk })));
        await sleep(40);
      }
      controller.enqueue(encoder.encode(sseEvent({ done: true })));
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}

function sseEvent(payload: unknown): string {
  return `data: ${JSON.stringify(payload)}\n\n`;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function chunkText(text: string, size: number): string[] {
  const chunks: string[] = [];
  for (let i = 0; i < text.length; i += size) {
    chunks.push(text.slice(i, i + size));
  }
  return chunks;
}

function buildMockResponse(modelName: string, prompt: string): string {
  const truncated = prompt.length > 80 ? prompt.slice(0, 80) + '…' : prompt;
  return (
    `Это mock-ответ от ${modelName} для тестирования интерфейса Playground. ` +
    `Ваш запрос: "${truncated}". ` +
    'Реальное подключение к моделям появится после мерджа Plan 04 gateway — ' +
    'единого API с маршрутизацией на провайдеров и биллингом в рублях.'
  );
}
