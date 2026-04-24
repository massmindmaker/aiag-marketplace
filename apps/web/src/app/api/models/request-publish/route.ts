import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';

/**
 * Plan 07 Task 13: POST /api/models/request-publish
 *
 * MVP: validates payload and logs the intent. Real implementation (Task 22):
 *   1. encrypt authToken with active KEK (packages/shared/crypto.ts)
 *   2. INSERT INTO ai_models (status='review', hosted_by, exclusive_until)
 *   3. enqueue BullMQ `model-publish-path2` for health check
 *   4. audit_log insert
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(
      { error: { message: 'Требуется вход' } },
      { status: 401 }
    );
  }

  const body = await req.json().catch(() => ({}));

  const required = ['name', 'slug', 'description', 'endpointUrl', 'authToken'];
  for (const k of required) {
    if (!body[k] || typeof body[k] !== 'string') {
      return NextResponse.json(
        { error: { message: `Поле ${k} обязательно` } },
        { status: 400 }
      );
    }
  }

  if (!/^[a-z0-9-]+$/.test(body.slug)) {
    return NextResponse.json(
      { error: { message: 'slug должен содержать только a-z, 0-9, -' } },
      { status: 400 }
    );
  }

  // TODO Task 22: encrypt + INSERT ai_models + enqueue worker + audit_log.
  return NextResponse.json({
    success: true,
    data: {
      status: 'review',
      hostedBy: body.hostedBy ?? 'platform',
      tierPct: body.exclusive
        ? 85
        : body.hostedBy === 'author'
          ? 80
          : 70,
    },
  });
}
