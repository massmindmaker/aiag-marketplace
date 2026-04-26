import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    service: 'web',
    version: process.env.APP_VERSION ?? '0.0.0-dev',
    gitSha: process.env.GIT_SHA ?? process.env.VERCEL_GIT_COMMIT_SHA ?? 'unknown',
    buildTime: process.env.BUILD_TIME ?? 'unknown',
  });
}
