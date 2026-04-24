import { NextResponse } from 'next/server';

/**
 * Plan 08 Task 12 — Live upstream health JSON для /status page.
 *
 * MVP: отдаёт синтетический ответ (все operational) пока gateway
 * не подключен через приватный SQL-запрос. TODO: в Plan 08 deploy
 * заменить на реальный `SELECT provider, avg(success), p95(ttft) FROM requests`.
 */

export const dynamic = 'force-dynamic';
export const revalidate = 30;

const PROVIDERS = [
  'openai',
  'anthropic',
  'yandex',
  'gigachat',
  'fal',
  'kie',
  'together',
];

export async function GET() {
  const providers = PROVIDERS.map((p) => ({
    provider: p,
    status: 'operational' as const,
    successRate: 1.0,
    p95TtftMs: null,
  }));

  return NextResponse.json({
    providers,
    activeIncidents: [],
    recentIncidents: [],
    generatedAt: new Date().toISOString(),
  });
}
