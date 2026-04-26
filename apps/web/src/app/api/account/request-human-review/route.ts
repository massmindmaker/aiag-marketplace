import { NextRequest, NextResponse } from 'next/server';

/**
 * Plan 08 Task 4c (H3, ст.16 152-ФЗ) — регистрация запроса на human review.
 *
 * SLA: 30 календарных дней на ответ от даты создания. SLA deadline вычисляется
 * на сервере и возвращается клиенту + сохраняется в human_review_requests.
 */

const VALID_TYPES = [
  'moderation_block',
  'fraud_flag',
  'shield_rf_routing',
  'automated_decision_general',
];

export async function POST(req: NextRequest) {
  // TODO: проверка аутентификации — userId из session.
  // В MVP если нет авторизации — 401.
  let body: {
    requestType?: string;
    relatedEntityId?: string;
    userStatement?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  if (!body.requestType || !VALID_TYPES.includes(body.requestType)) {
    return NextResponse.json({ error: 'invalid_request_type' }, { status: 400 });
  }
  if (!body.userStatement || body.userStatement.length < 10) {
    return NextResponse.json({ error: 'statement_too_short' }, { status: 400 });
  }

  const now = new Date();
  const slaDeadline = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const entry = {
    requestType: body.requestType,
    relatedEntityId: body.relatedEntityId?.slice(0, 100) ?? null,
    userStatement: body.userStatement.slice(0, 10000),
    status: 'pending' as const,
    createdAt: now.toISOString(),
    slaDeadline: slaDeadline.toISOString(),
  };

  // TODO: db.insert(humanReviewRequests).values(...)
  console.log('[human-review-request]', JSON.stringify(entry));

  return NextResponse.json(
    {
      ok: true,
      status: 'pending',
      slaDeadline: slaDeadline.toISOString(),
    },
    { status: 201 }
  );
}
