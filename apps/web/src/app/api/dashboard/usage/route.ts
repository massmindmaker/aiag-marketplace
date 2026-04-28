import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { gatewayRequests } from '@aiag/database/schema';
import { and, eq, gte, lte, sql } from '@aiag/database';
import { getOrCreateDefaultOrg } from '@/lib/dashboard/org';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/dashboard/usage?from=ISO&to=ISO&key_id=&model=
 * Returns aggregate stats + cost-by-day series + top-models.
 */
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const orgId = await getOrCreateDefaultOrg(session.user.id);

  const url = new URL(req.url);
  const fromParam = url.searchParams.get('from');
  const toParam = url.searchParams.get('to');
  const keyIdParam = url.searchParams.get('key_id');
  const modelParam = url.searchParams.get('model');

  const now = new Date();
  const defaultFrom = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const from = fromParam ? new Date(fromParam) : defaultFrom;
  const to = toParam ? new Date(toParam) : now;

  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
    return NextResponse.json({ error: 'invalid_date_range' }, { status: 400 });
  }

  const whereClauses = [
    eq(gatewayRequests.orgId, orgId),
    gte(gatewayRequests.createdAt, from),
    lte(gatewayRequests.createdAt, to),
  ];
  if (keyIdParam) whereClauses.push(eq(gatewayRequests.apiKeyId, keyIdParam));
  if (modelParam) whereClauses.push(eq(gatewayRequests.modelSlug, modelParam));

  // Aggregate hero
  const [hero] = await db
    .select({
      totalRequests: sql<number>`COUNT(*)::int`,
      totalCostRub: sql<string>`COALESCE(SUM(${gatewayRequests.totalCostRub}), 0)::text`,
      avgLatencyMs: sql<number>`COALESCE(AVG(${gatewayRequests.latencyMs}), 0)::int`,
    })
    .from(gatewayRequests)
    .where(and(...whereClauses));

  // Cost by day
  const byDay = await db
    .select({
      day: sql<string>`DATE_TRUNC('day', ${gatewayRequests.createdAt})::date::text`,
      totalRub: sql<string>`COALESCE(SUM(${gatewayRequests.totalCostRub}), 0)::text`,
      requests: sql<number>`COUNT(*)::int`,
    })
    .from(gatewayRequests)
    .where(and(...whereClauses))
    .groupBy(sql`DATE_TRUNC('day', ${gatewayRequests.createdAt})`)
    .orderBy(sql`DATE_TRUNC('day', ${gatewayRequests.createdAt})`);

  // Top models
  const topModels = await db
    .select({
      modelSlug: gatewayRequests.modelSlug,
      totalRub: sql<string>`COALESCE(SUM(${gatewayRequests.totalCostRub}), 0)::text`,
      requests: sql<number>`COUNT(*)::int`,
    })
    .from(gatewayRequests)
    .where(and(...whereClauses))
    .groupBy(gatewayRequests.modelSlug)
    .orderBy(sql`SUM(${gatewayRequests.totalCostRub}) DESC`)
    .limit(10);

  return NextResponse.json({
    ok: true,
    range: { from: from.toISOString(), to: to.toISOString() },
    hero: hero ?? { totalRequests: 0, totalCostRub: '0', avgLatencyMs: 0 },
    byDay,
    topModels,
  });
}
