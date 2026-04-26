import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Plan 08 — /api/health для Next.js web app.
 * Быстрый liveness-check (nginx upstream / pm2 / load balancer).
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'web',
    timestamp: new Date().toISOString(),
  });
}
