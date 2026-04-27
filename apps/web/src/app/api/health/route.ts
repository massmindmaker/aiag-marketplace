import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sql } from '@aiag/database';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/health — liveness + DB check.
 * Used by uptime cron and load balancer.
 */
export async function GET() {
  const start = Date.now();
  let dbOk = false;
  try {
    await db.execute(sql`SELECT 1`);
    dbOk = true;
  } catch {
    dbOk = false;
  }
  return NextResponse.json(
    {
      ok: dbOk,
      service: 'web',
      db: dbOk ? 'ok' : 'error',
      uptime_s: process.uptime(),
      ts: Date.now(),
      latency_ms: Date.now() - start,
    },
    { status: dbOk ? 200 : 503 }
  );
}
