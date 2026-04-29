import * as React from 'react';
import { db, sql } from '@/lib/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { PayoutsBulkActions } from './PayoutsBulkActions';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Выплаты — AIAG Admin' };

type Row = {
  user_id: string;
  email: string;
  accrued_rub: string;
  pending_amount: string;
  last_payout: string | null;
  kyc_status: string;
};

async function fetchPayouts(): Promise<Row[]> {
  try {
    const r = await db.execute(sql`
      SELECT
        u.id::text AS user_id,
        u.email,
        COALESCE((SELECT SUM(author_share_rub) FROM author_earnings WHERE author_id = u.id AND status = 'accruing')::text, '0') AS accrued_rub,
        COALESCE((SELECT SUM(amount) FROM payouts WHERE user_id = u.id AND status = 'pending')::text, '0') AS pending_amount,
        (SELECT MAX(processed_at)::text FROM payouts WHERE user_id = u.id AND status = 'completed') AS last_payout,
        COALESCE((u.preferences->>'kyc_status')::text, 'none') AS kyc_status
      FROM users u
      WHERE EXISTS (SELECT 1 FROM author_earnings WHERE author_id = u.id)
         OR EXISTS (SELECT 1 FROM payouts WHERE user_id = u.id)
      ORDER BY accrued_rub DESC NULLS LAST
      LIMIT 200
    `);
    return ((r as unknown as { rows?: Row[] }).rows ?? (r as unknown as Row[])) || [];
  } catch (e) {
    console.error(e);
    return [];
  }
}

export default async function AdminPayoutsPage() {
  const rows = await fetchPayouts();

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Выплаты авторам</h1>
        <Badge variant="outline">{rows.length}</Badge>
      </div>

      <PayoutsBulkActions />

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Авторы с накоплениями</CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase">
              <tr>
                <th className="text-left px-3 py-2">
                  <input type="checkbox" id="select-all" />
                </th>
                <th className="text-left px-3 py-2">Email</th>
                <th className="text-right px-3 py-2">Начислено ₽</th>
                <th className="text-right px-3 py-2">Pending ₽</th>
                <th className="text-left px-3 py-2">KYC</th>
                <th className="text-left px-3 py-2">Последняя выплата</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.user_id} className="border-t">
                  <td className="px-3 py-2">
                    <input type="checkbox" name="user_id" value={r.user_id} className="payout-cb" />
                  </td>
                  <td className="px-3 py-2 text-xs font-mono">{r.email}</td>
                  <td className="px-3 py-2 text-right">{Number(r.accrued_rub).toFixed(2)}</td>
                  <td className="px-3 py-2 text-right">{Number(r.pending_amount).toFixed(2)}</td>
                  <td className="px-3 py-2">
                    <Badge variant={r.kyc_status === 'verified' ? 'default' : 'outline'}>
                      {r.kyc_status}
                    </Badge>
                  </td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">
                    {r.last_payout ? new Date(r.last_payout).toLocaleDateString('ru-RU') : '—'}
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-3 py-8 text-center text-muted-foreground">
                    Нет данных
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
