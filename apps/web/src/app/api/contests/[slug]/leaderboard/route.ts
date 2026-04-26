import { NextResponse } from 'next/server';

/**
 * Plan 07 Task 8: GET /api/contests/[slug]/leaderboard
 *
 * MVP: returns 404 so the client falls back to mocked data. Real implementation
 * (Task 22) reads a Redis-cached rank aggregate with private-reveal gating.
 */
export async function GET() {
  return NextResponse.json(
    { error: { message: 'Not yet implemented (MVP mock in client)' } },
    { status: 404 }
  );
}
