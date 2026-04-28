import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { organizations } from '@aiag/database/schema';
import { eq } from '@aiag/database';
import { getOrCreateDefaultOrg } from '@/lib/dashboard/org';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const schema = z.object({
  enabled: z.boolean(),
  thresholdRub: z.number().positive().max(10_000_000).nullable().optional(),
  amountRub: z.number().positive().max(10_000_000).nullable().optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const orgId = await getOrCreateDefaultOrg(session.user.id);
  const org = await db.query.organizations.findFirst({
    where: eq(organizations.id, orgId),
  });
  if (!org) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  return NextResponse.json({
    ok: true,
    autoTopup: {
      enabled: org.autoTopupEnabled,
      thresholdRub: org.autoTopupThreshold ? Number(org.autoTopupThreshold) : null,
      amountRub: org.autoTopupAmount ? Number(org.autoTopupAmount) : null,
    },
  });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const raw = await req.json().catch(() => null);
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
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

  if (parsed.data.enabled) {
    if (!parsed.data.thresholdRub || !parsed.data.amountRub) {
      return NextResponse.json(
        { error: 'threshold_and_amount_required' },
        { status: 400 },
      );
    }
  }

  const orgId = await getOrCreateDefaultOrg(session.user.id);

  const [row] = await db
    .update(organizations)
    .set({
      autoTopupEnabled: parsed.data.enabled,
      autoTopupThreshold:
        parsed.data.thresholdRub != null ? String(parsed.data.thresholdRub) : null,
      autoTopupAmount:
        parsed.data.amountRub != null ? String(parsed.data.amountRub) : null,
      updatedAt: new Date(),
    })
    .where(eq(organizations.id, orgId))
    .returning({
      autoTopupEnabled: organizations.autoTopupEnabled,
      autoTopupThreshold: organizations.autoTopupThreshold,
      autoTopupAmount: organizations.autoTopupAmount,
    });

  return NextResponse.json({ ok: true, autoTopup: row });
}
