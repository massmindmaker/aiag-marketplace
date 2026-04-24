import { NextRequest } from 'next/server';
import { z } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_BODY_SIZE = 8 * 1024;

export const modelRequestSchema = z.object({
  modelName: z.string().trim().min(2).max(120),
  provider: z.string().trim().min(2).max(120),
  website: z.string().url().optional().or(z.literal('')),
  modality: z.enum([
    'llm',
    'image',
    'audio',
    'video',
    'embedding',
    'code',
    'speech-to-text',
    'text-to-speech',
    'multimodal',
  ]),
  hostingRegion: z.enum(['ru', 'eu', 'us', 'global']).optional(),
  useCase: z.string().trim().min(10).max(1200),
  contactEmail: z.string().trim().email(),
  contactName: z.string().trim().min(2).max(120).optional(),
});

export type ModelRequestPayload = z.infer<typeof modelRequestSchema>;

/**
 * Public form endpoint: "request a model to be added".
 *
 * For Plan 06 MVP we only validate the payload and log it. Phase 2 will
 * persist into `model_requests` table and notify ops via Slack/email.
 */
export async function POST(req: NextRequest) {
  const contentLength = Number(req.headers.get('content-length') ?? 0);
  if (contentLength > MAX_BODY_SIZE) {
    return Response.json({ error: 'payload_too_large' }, { status: 413 });
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return Response.json({ error: 'invalid_json' }, { status: 400 });
  }

  const parsed = modelRequestSchema.safeParse(raw);
  if (!parsed.success) {
    return Response.json(
      {
        error: 'validation_failed',
        issues: parsed.error.issues.map((i) => ({
          path: i.path.join('.'),
          message: i.message,
        })),
      },
      { status: 400 },
    );
  }

  // Phase 1 MVP — only log. Phase 2 will persist + notify ops.
  console.info(
    '[marketplace] model-request',
    JSON.stringify({
      at: new Date().toISOString(),
      ...parsed.data,
    }),
  );

  return Response.json({ ok: true }, { status: 202 });
}
