import * as React from 'react';
import { db, sql } from '@/lib/db';
import { rowsOf } from '@/lib/admin/rows';
import { requireAdmin } from '@/lib/admin/guard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { RequestsFilters } from './RequestsFilters';
import { RequestRow } from './RequestRow';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Запросы — AIAG Admin' };

type Row = {
  request_id: string;
  created_at: string;
  user_email: string | null;
  org_id: string;
  model_slug: string;
  upstream_id: string;
  status_code: number | null;
  latency_ms: number | null;
  total_cost_rub: string | null;
  mode_applied: string | null;
};

const MAX_DAYS = 30;
const PAGE_SIZE = 50;

export type RequestSearchParams = {
  from?: string;
  to?: string;
  status?: string;
  user_email?: string;
  request_id?: string;
  model?: string;
  page?: string;
};

function clampDateRange(fromIso?: string, toIso?: string) {
  const now = new Date();
  const to = toIso ? new Date(toIso) : now;
  const defaultFrom = new Date(to.getTime() - 24 * 3600_000);
  let from = fromIso ? new Date(fromIso) : defaultFrom;
  const minFrom = new Date(to.getTime() - MAX_DAYS * 24 * 3600_000);
  if (from < minFrom) from = minFrom;
  return { from, to };
}

async function fetchRequests(params: RequestSearchParams): Promise<{ rows: Row[]; total: number }> {
  const { from, to } = clampDateRange(params.from, params.to);
  const page = Math.max(0, parseInt(params.page ?? '0', 10) || 0);
  const offset = page * PAGE_SIZE;

  const statusFilter = params.status;
  const userEmail = params.user_email?.trim() || null;
  const requestId = params.request_id?.trim() || null;
  const model = params.model?.trim() || null;

  try {
    const r = await db.execute(sql`
      SELECT r.request_id,
             r.created_at,
             u.email AS user_email,
             r.org_id::text AS org_id,
             r.model_slug,
             r.upstream_id,
             r.status_code,
             r.latency_ms,
             r.total_cost_rub,
             r.mode_applied
      FROM requests r
      LEFT JOIN organizations o ON o.id = r.org_id
      LEFT JOIN users u ON u.id = o.owner_id
      WHERE r.created_at >= ${from.toISOString()}::timestamptz
        AND r.created_at <= ${to.toISOString()}::timestamptz
        AND (${requestId}::text IS NULL OR r.request_id = ${requestId})
        AND (${userEmail}::text IS NULL OR u.email ILIKE ${'%' + (userEmail ?? '') + '%'})
        AND (${model}::text IS NULL OR r.model_slug ILIKE ${'%' + (model ?? '') + '%'})
        AND (
          ${statusFilter}::text IS NULL
          OR (${statusFilter} = 'success' AND r.status_code BETWEEN 200 AND 299)
          OR (${statusFilter} = '4xx'     AND r.status_code BETWEEN 400 AND 499)
          OR (${statusFilter} = '5xx'     AND r.status_code BETWEEN 500 AND 599)
          OR (${statusFilter} = 'timeout' AND r.status_code IS NULL)
        )
      ORDER BY r.created_at DESC
      LIMIT ${PAGE_SIZE} OFFSET ${offset}
    `);
    const rows = rowsOf<Row>(r);

    const c = await db.execute(sql`
      SELECT COUNT(*)::int AS c
      FROM requests r
      WHERE r.created_at >= ${from.toISOString()}::timestamptz
        AND r.created_at <= ${to.toISOString()}::timestamptz
    `);
    const total = rowsOf<{ c: number }>(c)[0]?.c ?? 0;

    return { rows, total };
  } catch (e) {
    console.error('[admin/requests] fetch failed', e);
    return { rows: [], total: 0 };
  }
}

function statusBadge(code: number | null) {
  if (code === null) return <Badge variant="outline">timeout</Badge>;
  if (code >= 200 && code < 300) return <Badge variant="default">{code}</Badge>;
  if (code >= 400 && code < 500) return <Badge variant="destructive">{code}</Badge>;
  if (code >= 500) return <Badge variant="destructive">{code}</Badge>;
  return <Badge variant="outline">{code}</Badge>;
}

export default async function AdminRequestsPage({
  searchParams,
}: {
  searchParams: Promise<RequestSearchParams>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const { from, to } = clampDateRange(params.from, params.to);
  const { rows, total } = await fetchRequests(params);
  const page = Math.max(0, parseInt(params.page ?? '0', 10) || 0);

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Запросы</h1>
        <Badge variant="outline">{total} за период</Badge>
      </div>

      <RequestsFilters
        defaultFrom={from.toISOString().slice(0, 16)}
        defaultTo={to.toISOString().slice(0, 16)}
        defaultStatus={params.status ?? ''}
        defaultUserEmail={params.user_email ?? ''}
        defaultRequestId={params.request_id ?? ''}
        defaultModel={params.model ?? ''}
      />

      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-sm">
            Gateway requests — последние {PAGE_SIZE} (страница {page + 1})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase">
              <tr>
                <th className="text-left px-3 py-2">Request ID</th>
                <th className="text-left px-3 py-2">Время</th>
                <th className="text-left px-3 py-2">Юзер</th>
                <th className="text-left px-3 py-2">Модель</th>
                <th className="text-left px-3 py-2">Аплинк</th>
                <th className="text-left px-3 py-2">Статус</th>
                <th className="text-right px-3 py-2">Latency</th>
                <th className="text-right px-3 py-2">Cost ₽</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <RequestRow
                  key={r.request_id + r.created_at}
                  requestId={r.request_id}
                  createdAt={r.created_at}
                  userEmail={r.user_email}
                  modelSlug={r.model_slug}
                  upstream={r.upstream_id}
                  statusBadge={statusBadge(r.status_code)}
                  latencyMs={r.latency_ms}
                  costRub={r.total_cost_rub}
                />
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-3 py-8 text-center text-muted-foreground">
                    Нет запросов
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2 mt-4 text-sm">
        {page > 0 && (
          <a
            className="text-amber-400 hover:underline"
            href={`?${new URLSearchParams({ ...(params as Record<string, string>), page: String(page - 1) }).toString()}`}
          >
            ← Предыдущая
          </a>
        )}
        {rows.length === PAGE_SIZE && (
          <a
            className="text-amber-400 hover:underline"
            href={`?${new URLSearchParams({ ...(params as Record<string, string>), page: String(page + 1) }).toString()}`}
          >
            Следующая →
          </a>
        )}
      </div>
    </div>
  );
}
