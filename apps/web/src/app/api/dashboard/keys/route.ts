import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { gatewayApiKeys } from '@aiag/database/schema';
import { and, desc, eq, isNull } from '@aiag/database';
import { getOrCreateDefaultOrg } from '@/lib/dashboard/org';
import { generateApiKey } from '@/lib/dashboard/api-key';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const createSchema = z.object({
  name: z.string().min(1).max(100),
  costLimitMonthlyRub: z.number().positive().max(10_000_000).optional().nullable(),
  ruResidencyOnly: z.boolean().optional().default(false),
  modelWhitelist: z.array(z.string().min(1).max(128)).max(200).optional().default([]),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const orgId = await getOrCreateDefaultOrg(session.user.id);

  const rows = await db
    .select({
      id: gatewayApiKeys.id,
      name: gatewayApiKeys.name,
      keyPrefix: gatewayApiKeys.keyPrefix,
      costLimitMonthlyRub: gatewayApiKeys.costLimitMonthlyRub,
      modelWhitelist: gatewayApiKeys.modelWhitelist,
      ruResidencyOnly: gatewayApiKeys.ruResidencyOnly,
      disabledAt: gatewayApiKeys.disabledAt,
      lastUsedAt: gatewayApiKeys.lastUsedAt,
      createdAt: gatewayApiKeys.createdAt,
    })
    .from(gatewayApiKeys)
    .where(and(eq(gatewayApiKeys.orgId, orgId), isNull(gatewayApiKeys.revokedAt)))
    .orderBy(desc(gatewayApiKeys.createdAt));

  return NextResponse.json({ ok: true, keys: rows });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const raw = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(raw);
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

  const orgId = await getOrCreateDefaultOrg(session.user.id);
  const { key, hash, prefix } = generateApiKey('live');

  const [row] = await db
    .insert(gatewayApiKeys)
    .values({
      orgId,
      name: parsed.data.name,
      keyHash: hash,
      keyPrefix: prefix,
      costLimitMonthlyRub: parsed.data.costLimitMonthlyRub
        ? String(parsed.data.costLimitMonthlyRub)
        : null,
      modelWhitelist: parsed.data.modelWhitelist ?? [],
      ruResidencyOnly: parsed.data.ruResidencyOnly ?? false,
    })
    .returning({
      id: gatewayApiKeys.id,
      name: gatewayApiKeys.name,
      keyPrefix: gatewayApiKeys.keyPrefix,
      createdAt: gatewayApiKeys.createdAt,
    });

  return NextResponse.json(
    {
      ok: true,
      key, // FULL key — shown once, never returned again
      record: row,
    },
    { status: 201 },
  );
}
