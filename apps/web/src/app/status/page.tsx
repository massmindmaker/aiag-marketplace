import { headers } from 'next/headers';
import { promises as fs } from 'node:fs';

export const metadata = { title: 'Статус — AI-Aggregator' };
export const dynamic = 'force-dynamic';

const UPTIME_LOG = process.env.UPTIME_LOG_PATH ?? '/var/log/aiag-uptime.log';

async function getUptimeTail(): Promise<string[]> {
  try {
    const raw = await fs.readFile(UPTIME_LOG, 'utf8');
    const lines = raw.trim().split('\n');
    return lines.slice(-50);
  } catch {
    return [];
  }
}

type StatusResponse = {
  providers: Array<{
    provider: string;
    status: 'operational' | 'degraded' | 'down';
    successRate: number;
    p95TtftMs: number | null;
  }>;
  activeIncidents: Array<{
    id: string;
    title: string;
    status: string;
    impact: string;
    startedAt: string;
  }>;
  recentIncidents: Array<{
    id: string;
    title: string;
    status: string;
    startedAt: string;
    resolvedAt: string | null;
  }>;
};

async function getStatus(): Promise<StatusResponse> {
  const h = await headers();
  const host = h.get('host') ?? 'localhost:3000';
  const proto = h.get('x-forwarded-proto') ?? 'http';
  const res = await fetch(`${proto}://${host}/api/status`, { cache: 'no-store' });
  if (!res.ok) {
    return { providers: [], activeIncidents: [], recentIncidents: [] };
  }
  return res.json();
}

function statusColor(s: string) {
  return s === 'operational'
    ? 'bg-green-500'
    : s === 'degraded'
    ? 'bg-amber-500'
    : 'bg-red-500';
}

export default async function StatusPage() {
  const [data, uptimeLines] = await Promise.all([getStatus(), getUptimeTail()]);
  const allOk = data.providers.every((p) => p.status === 'operational') && data.activeIncidents.length === 0;

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="text-3xl font-bold">Статус сервиса</h1>
        <div
          className={`mt-6 rounded-lg border p-4 ${
            allOk ? 'border-green-500/50 bg-green-500/10' : 'border-amber-500/50 bg-amber-500/10'
          }`}
        >
          <p className="font-medium">
            {allOk ? 'Все системы работают штатно' : 'Есть деградация или активный инцидент'}
          </p>
        </div>

        <h2 className="mt-8 text-xl font-semibold">Компоненты</h2>
        <ul className="mt-4 space-y-2">
          {data.providers.length === 0 ? (
            <li className="text-sm text-muted-foreground">
              Метрики загружаются… (нет данных за последние 10 минут)
            </li>
          ) : (
            data.providers.map((p) => (
              <li
                key={p.provider}
                className="flex items-center justify-between rounded-md border p-3 text-sm"
              >
                <span className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${statusColor(p.status)}`} />
                  <span className="font-medium">{p.provider}</span>
                </span>
                <span className="text-muted-foreground">
                  {(p.successRate * 100).toFixed(1)}% · p95 {p.p95TtftMs ?? '—'} ms
                </span>
              </li>
            ))
          )}
        </ul>

        {data.activeIncidents.length > 0 && (
          <>
            <h2 className="mt-8 text-xl font-semibold">Активные инциденты</h2>
            <ul className="mt-4 space-y-3">
              {data.activeIncidents.map((i) => (
                <li key={i.id} className="rounded-md border border-amber-500/50 bg-amber-500/10 p-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{i.title}</span>
                    <span className="text-xs text-muted-foreground">{i.status} · {i.impact}</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    с {new Date(i.startedAt).toLocaleString('ru-RU')}
                  </p>
                </li>
              ))}
            </ul>
          </>
        )}

        <h2 className="mt-8 text-xl font-semibold">Uptime monitor</h2>
        {uptimeLines.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">
            Uptime monitoring active, see Grafana for details.
          </p>
        ) : (
          <pre className="mt-4 max-h-72 overflow-auto rounded-md border bg-muted/30 p-3 text-xs leading-relaxed font-mono">
            {uptimeLines.join('\n')}
          </pre>
        )}

        <h2 className="mt-8 text-xl font-semibold">История инцидентов</h2>
        {data.recentIncidents.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">Инцидентов пока не было.</p>
        ) : (
          <ul className="mt-4 space-y-2 text-sm">
            {data.recentIncidents.map((i) => (
              <li key={i.id} className="flex items-center justify-between rounded-md border p-3">
                <span>{i.title}</span>
                <span className="text-xs text-muted-foreground">
                  {new Date(i.startedAt).toLocaleDateString('ru-RU')}{' '}
                  {i.resolvedAt ? '· resolved' : '· ongoing'}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
