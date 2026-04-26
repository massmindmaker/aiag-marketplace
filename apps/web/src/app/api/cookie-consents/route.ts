import { NextRequest, NextResponse } from 'next/server';

/**
 * Plan 08 Task 4b — POST endpoint для сохранения выбора cookie-категорий.
 *
 * В MVP пишем в лог (stderr) — когда БД-layer готов, insert в cookie_consents.
 * Сохраняем: essential/functional/analytics/marketing + DNT flag + IP/UA.
 */

type Body = {
  essential?: boolean;
  functional?: boolean;
  analytics?: boolean;
  marketing?: boolean;
  dntHeader?: boolean;
};

export async function POST(req: NextRequest) {
  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const entry = {
    essential: body.essential !== false,
    functional: !!body.functional,
    analytics: !!body.analytics,
    marketing: !!body.marketing,
    dntHeader: !!body.dntHeader,
    ipAddress: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null,
    userAgent: req.headers.get('user-agent') ?? null,
    acceptedAt: new Date().toISOString(),
  };

  // TODO: insert в cookie_consents (drizzle) — см. packages/database/src/schema/cookieConsents.ts
  // Пока логируем для audit trail.
  console.log('[cookie-consent]', JSON.stringify(entry));

  return NextResponse.json({ ok: true });
}
