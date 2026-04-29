import * as React from 'react';
import { db, sql } from '@/lib/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { WebhookRowActions } from './WebhookRowActions';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Вебхуки — AIAG Admin' };

type Row = {
  id: string;
  event_type: string;
  payment_id: string | null;
  signature_valid: string | null;
  processed_at: string | null;
  processing_error: string | null;
  created_at: string;
};

async function fetchWebhooks(): Promise<Row[]> {
  try {
    const r = await db.execute(sql`
      SELECT id::text, event_type, payment_id::text, signature_valid::text,
             processed_at::text, processing_error, created_at::text
      FROM payment_webhook_logs
      ORDER BY created_at DESC LIMIT 500
    `);
    return ((r as unknown as { rows?: Row[] }).rows ?? (r as unknown as Row[])) || [];
  } catch (e) {
    console.error(e);
    return [];
  }
}

function statusOf(r: Row): { label: string; color: 'default' | 'destructive' | 'outline' } {
  if (r.processing_error) return { label: 'failed', color: 'destructive' };
  if (r.processed_at) return { label: 'success', color: 'default' };
  return { label: 'pending', color: 'outline' };
}

export default async function AdminWebhooksPage() {
  const rows = await fetchWebhooks();

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Webhook логи</h1>
        <Badge variant="outline">{rows.length}</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Последние события</CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase">
              <tr>
                <th className="text-left px-3 py-2">Когда</th>
                <th className="text-left px-3 py-2">Event</th>
                <th className="text-left px-3 py-2">Payment</th>
                <th className="text-left px-3 py-2">Статус</th>
                <th className="text-left px-3 py-2">Подпись</th>
                <th className="text-left px-3 py-2">Ошибка</th>
                <th className="text-right px-3 py-2">Действия</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const s = statusOf(r);
                return (
                  <tr key={r.id} className="border-t">
                    <td className="px-3 py-2 text-xs whitespace-nowrap">
                      {new Date(r.created_at).toLocaleString('ru-RU')}
                    </td>
                    <td className="px-3 py-2 text-xs font-mono">{r.event_type}</td>
                    <td className="px-3 py-2 text-xs font-mono">
                      {r.payment_id?.slice(0, 8) ?? '—'}
                    </td>
                    <td className="px-3 py-2">
                      <Badge variant={s.color}>{s.label}</Badge>
                    </td>
                    <td className="px-3 py-2 text-xs">{r.signature_valid ?? '—'}</td>
                    <td className="px-3 py-2 text-xs max-w-md truncate text-red-400">
                      {r.processing_error ?? '—'}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <WebhookRowActions
                        id={r.id}
                        canRetry={!!r.processing_error || !r.processed_at}
                      />
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-3 py-8 text-center text-muted-foreground">
                    Нет webhook-логов
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
