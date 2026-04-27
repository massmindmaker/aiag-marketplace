'use client';

import { useMemo, useState } from 'react';
import { Filter, RefreshCcw, RotateCcw } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';

type Status = 'pending' | 'authorized' | 'confirmed' | 'refunded' | 'partial_refunded' | 'cancelled' | 'rejected' | 'failed';

interface PaymentRow {
  id: string;
  createdAt: string;
  user: string;
  provider: 'tinkoff' | 'yookassa' | 'sbp';
  amount: number;
  status: Status;
  description: string;
  providerPaymentId: string;
}

// Empty MVP. TODO: GET /api/admin/payments → render rows.
const MOCK: PaymentRow[] = [];

const STATUS_LABELS: Record<Status, string> = {
  pending: 'Ожидает',
  authorized: 'Авторизован',
  confirmed: 'Подтверждён',
  refunded: 'Возвращён',
  partial_refunded: 'Частично возвращён',
  cancelled: 'Отменён',
  rejected: 'Отклонён',
  failed: 'Ошибка',
};

const STATUS_VARIANT: Record<Status, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  pending: 'outline',
  authorized: 'secondary',
  confirmed: 'default',
  refunded: 'secondary',
  partial_refunded: 'secondary',
  cancelled: 'outline',
  rejected: 'destructive',
  failed: 'destructive',
};

export default function AdminPaymentsPage() {
  const [statusFilter, setStatusFilter] = useState<Status | 'all'>('all');
  const [providerFilter, setProviderFilter] = useState<'all' | PaymentRow['provider']>('all');
  const [refundingId, setRefundingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return MOCK.filter((p) => {
      if (statusFilter !== 'all' && p.status !== statusFilter) return false;
      if (providerFilter !== 'all' && p.provider !== providerFilter) return false;
      return true;
    });
  }, [statusFilter, providerFilter]);

  async function handleRefund(payment: PaymentRow) {
    if (!confirm(`Вернуть ${payment.amount} ₽ за платёж ${payment.id}?`)) return;
    setRefundingId(payment.id);
    try {
      const res = await fetch('/api/admin/payments/refund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentId: payment.id,
          provider: payment.provider,
          providerPaymentId: payment.providerPaymentId,
          amount: payment.amount,
          reason: 'admin_manual_refund',
        }),
      });
      if (!res.ok) {
        alert(`Ошибка возврата: ${res.status}`);
      } else {
        alert('Возврат отправлен');
      }
    } finally {
      setRefundingId(null);
    }
  }

  return (
    <MainLayout>
      <section className="container mx-auto max-w-7xl px-4 py-10">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Платежи</h1>
            <p className="mt-1 text-muted-foreground">
              Все платежи и возвраты по провайдерам Tinkoff / YooKassa / СБП.
            </p>
          </div>
          <Button variant="outline" size="sm">
            <RefreshCcw className="me-2 h-4 w-4" />
            Обновить
          </Button>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 text-sm">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Статус:</span>
          {(['all', 'pending', 'confirmed', 'refunded', 'cancelled', 'failed'] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(s)}
              className={cn(
                'px-3 py-1 rounded-full border text-xs transition-colors',
                statusFilter === s
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border hover:border-primary/40'
              )}
            >
              {s === 'all' ? 'Все' : STATUS_LABELS[s as Status] || s}
            </button>
          ))}
          <span className="ms-4 text-xs text-muted-foreground">Провайдер:</span>
          {(['all', 'tinkoff', 'yookassa', 'sbp'] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setProviderFilter(p)}
              className={cn(
                'px-3 py-1 rounded-full border text-xs transition-colors',
                providerFilter === p
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border hover:border-primary/40'
              )}
            >
              {p === 'all' ? 'Все' : p}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          {filtered.length === 0 ? (
            <div className="px-6 py-16 text-center text-sm text-muted-foreground">
              Платежей не найдено.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-xs uppercase text-muted-foreground bg-muted/30">
                <tr>
                  <th className="px-4 py-3 text-left">Дата</th>
                  <th className="px-4 py-3 text-left">Пользователь</th>
                  <th className="px-4 py-3 text-left">Провайдер</th>
                  <th className="px-4 py-3 text-left">Описание</th>
                  <th className="px-4 py-3 text-right">Сумма</th>
                  <th className="px-4 py-3 text-left">Статус</th>
                  <th className="px-4 py-3 text-right">Действия</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id} className="border-t border-border">
                    <td className="px-4 py-3 whitespace-nowrap">{p.createdAt}</td>
                    <td className="px-4 py-3">{p.user}</td>
                    <td className="px-4 py-3">{p.provider}</td>
                    <td className="px-4 py-3">{p.description}</td>
                    <td className="px-4 py-3 text-right">
                      {p.amount.toLocaleString('ru-RU')} ₽
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={STATUS_VARIANT[p.status]}>
                        {STATUS_LABELS[p.status]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {p.status === 'confirmed' && (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={refundingId === p.id}
                          onClick={() => handleRefund(p)}
                        >
                          <RotateCcw className="me-1 h-3 w-3" />
                          {refundingId === p.id ? 'Возврат…' : 'Возврат'}
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </MainLayout>
  );
}
