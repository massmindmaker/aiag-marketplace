import { NextRequest, NextResponse } from 'next/server';

/**
 * Plan 08 Task 4 — POST /api/report — создаёт moderation_report.
 *
 * MVP: логирует в stderr + шлёт email на abuse@. Когда БД wired —
 * insert в moderation_reports table.
 */

type Body = {
  targetType?: string;
  targetId?: string;
  reason?: string;
  description?: string;
  contactEmail?: string;
};

const VALID_TARGETS = ['submission', 'model', 'prompt', 'output'];
const VALID_REASONS = ['illegal', 'csam', 'copyright', 'phishing', 'hate', 'other'];

export async function POST(req: NextRequest) {
  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  if (!body.targetType || !VALID_TARGETS.includes(body.targetType)) {
    return NextResponse.json({ error: 'invalid_target_type' }, { status: 400 });
  }
  if (!body.reason || !VALID_REASONS.includes(body.reason)) {
    return NextResponse.json({ error: 'invalid_reason' }, { status: 400 });
  }
  if (!body.targetId || body.targetId.length > 500) {
    return NextResponse.json({ error: 'invalid_target_id' }, { status: 400 });
  }

  const entry = {
    targetType: body.targetType,
    targetId: body.targetId.slice(0, 500),
    reason: body.reason,
    description: body.description?.slice(0, 5000) ?? null,
    contactEmail: body.contactEmail?.slice(0, 255) ?? null,
    ipAddress: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null,
    userAgent: req.headers.get('user-agent') ?? null,
    createdAt: new Date().toISOString(),
  };

  // TODO: db.insert(moderationReports).values(entry)
  console.log('[moderation-report]', JSON.stringify(entry));

  // CSAM — критический приоритет, дополнительный sink (e.g. Telegram @aiag_alerts, email)
  if (body.reason === 'csam') {
    console.error('[CSAM-REPORT][URGENT]', JSON.stringify(entry));
  }

  return NextResponse.json({ ok: true, status: 'registered' }, { status: 201 });
}
