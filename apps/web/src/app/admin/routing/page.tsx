import * as React from 'react';
import { db, sql } from '@/lib/db';
import { rowsOf } from '@/lib/admin/rows';
import { requireAdmin } from '@/lib/admin/guard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { RoutingRowActions } from './RoutingRowActions';
import { AddRouteForm } from './AddRouteForm';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Роутинг — AIAG Admin' };

type Row = {
  id: string;
  model_id: string;
  model_slug: string;
  modality: string;
  upstream_id: string;
  upstream_provider: string;
  upstream_model_id: string;
  markup: string;
  enabled: boolean;
};

async function fetchRouting(): Promise<Row[]> {
  try {
    const r = await db.execute(sql`
      SELECT mu.id::text AS id,
             mu.model_id::text AS model_id,
             m.slug AS model_slug,
             m.type AS modality,
             mu.upstream_id,
             u.provider AS upstream_provider,
             mu.upstream_model_id,
             mu.markup::text AS markup,
             mu.enabled
      FROM model_upstreams mu
      JOIN models m ON m.id = mu.model_id
      JOIN upstreams u ON u.id = mu.upstream_id
      ORDER BY m.slug, mu.markup DESC
    `);
    return rowsOf<Row>(r);
  } catch (e) {
    console.error('[admin/routing] fetch failed', e);
    return [];
  }
}

async function fetchModels() {
  try {
    const r = await db.execute(
      sql`SELECT id::text AS id, slug, type FROM models WHERE enabled ORDER BY slug`
    );
    return rowsOf<{ id: string; slug: string; type: string }>(r);
  } catch {
    return [];
  }
}

async function fetchUpstreams() {
  try {
    const r = await db.execute(
      sql`SELECT id, provider FROM upstreams WHERE enabled ORDER BY provider`
    );
    return rowsOf<{ id: string; provider: string }>(r);
  } catch {
    return [];
  }
}

export default async function AdminRoutingPage() {
  await requireAdmin();
  const [rows, models, upstreams] = await Promise.all([
    fetchRouting(),
    fetchModels(),
    fetchUpstreams(),
  ]);

  const enabled = rows.filter((r) => r.enabled).length;

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Routing matrix</h1>
        <div className="flex gap-2">
          <Badge variant="outline">{rows.length} маршрутов</Badge>
          <Badge variant="default">{enabled} активных</Badge>
        </div>
      </div>

      <AddRouteForm models={models} upstreams={upstreams} />

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-sm">model_upstreams</CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase">
              <tr>
                <th className="text-left px-3 py-2">Model</th>
                <th className="text-left px-3 py-2">Mod</th>
                <th className="text-left px-3 py-2">Upstream</th>
                <th className="text-left px-3 py-2">Upstream model id</th>
                <th className="text-right px-3 py-2">Markup</th>
                <th className="text-left px-3 py-2">Status</th>
                <th className="text-right px-3 py-2">Действия</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="px-3 py-2 font-mono text-xs">{r.model_slug}</td>
                  <td className="px-3 py-2 text-xs">{r.modality}</td>
                  <td className="px-3 py-2 text-xs">{r.upstream_provider}</td>
                  <td className="px-3 py-2 font-mono text-xs">{r.upstream_model_id}</td>
                  <td className="px-3 py-2 text-right text-xs">
                    {Number(r.markup).toFixed(4)}
                  </td>
                  <td className="px-3 py-2">
                    {r.enabled ? (
                      <Badge variant="default">enabled</Badge>
                    ) : (
                      <Badge variant="outline">disabled</Badge>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <RoutingRowActions
                      id={r.id}
                      enabled={r.enabled}
                      markup={Number(r.markup)}
                    />
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-3 py-8 text-center text-muted-foreground">
                    Нет маршрутов
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
