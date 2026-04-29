'use client';

import * as React from 'react';
import { Button } from '@/components/ui/Button';

export function OrgRowActions({ orgId, status }: { orgId: string; status: string }) {
  const [busy, setBusy] = React.useState(false);

  const call = async (body: Record<string, unknown>) => {
    setBusy(true);
    try {
      const r = await fetch(`/api/admin/orgs/${orgId}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        alert(`Ошибка: ${j.error ?? r.status}`);
      } else window.location.reload();
    } finally {
      setBusy(false);
    }
  };

  const onTopup = async () => {
    const raw = prompt('Сумма пополнения PAYG ₽:');
    if (!raw) return;
    const amount = Number(raw);
    if (!Number.isFinite(amount) || amount === 0) return;
    const reason = prompt('Причина (для аудита):') ?? '';
    await call({ op: 'topupPayg', amountRub: amount, reason });
  };

  const onSuspend = async () => {
    if (status === 'suspended') {
      await call({ op: 'unsuspend' });
    } else {
      const reason = prompt('Причина приостановки:') ?? '';
      await call({ op: 'suspend', reason });
    }
  };

  return (
    <div className="flex gap-1 justify-end">
      <Button size="sm" variant="outline" disabled={busy} onClick={onTopup}>
        +₽
      </Button>
      <Button
        size="sm"
        variant={status === 'suspended' ? 'outline' : 'destructive'}
        disabled={busy}
        onClick={onSuspend}
      >
        {status === 'suspended' ? 'Активировать' : 'Приостановить'}
      </Button>
    </div>
  );
}
