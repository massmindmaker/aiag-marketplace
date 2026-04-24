import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';

/**
 * Plan 07 Task 4: POST /api/contests/[slug]/register
 *
 * MVP: returns 200 mock; real impl will:
 *   1. auth() → session.user.id
 *   2. SELECT contest by slug (+ verify status in ('announced','open','active'))
 *   3. INSERT INTO contest_participants ON CONFLICT DO NOTHING
 *   4. audit_log insert (actor_type='user', action='contest_register')
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(
      { error: { message: 'Требуется вход', code: 'UNAUTHORIZED' } },
      { status: 401 }
    );
  }

  const body = (await req.json().catch(() => ({}))) as {
    rulesAccepted?: boolean;
    privacyAccepted?: boolean;
  };

  if (!body.rulesAccepted || !body.privacyAccepted) {
    return NextResponse.json(
      {
        error: {
          message: 'Необходимо подтвердить правила и согласие на обработку ПД',
          code: 'CONSENT_REQUIRED',
        },
      },
      { status: 400 }
    );
  }

  // TODO Task 22: real INSERT + audit_log once migration 0005 is applied on VPS.
  return NextResponse.json({
    success: true,
    data: { slug: params.slug, registered: true },
  });
}
