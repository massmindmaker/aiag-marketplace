'use client';

import * as React from 'react';
import { Button } from '@/components/ui/Button';

export function UserRowActions({
  userId,
  email,
  isBanned,
}: {
  userId: string;
  email: string;
  isBanned: boolean;
}) {
  const [busy, setBusy] = React.useState(false);

  const call = React.useCallback(
    async (body: Record<string, unknown>) => {
      setBusy(true);
      try {
        const r = await fetch(`/api/admin/users/${userId}`, {
          method: 'PATCH',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(body),
        });
        if (!r.ok) {
          const j = await r.json().catch(() => ({}));
          alert(`Ошибка: ${j.error ?? r.status}`);
        } else {
          window.location.reload();
        }
      } finally {
        setBusy(false);
      }
    },
    [userId]
  );

  const onAdjust = async () => {
    const raw = prompt(`Корректировка баланса для ${email}\nСумма ₽ (плюс/минус):`);
    if (raw == null) return;
    const amount = Number(raw);
    if (!Number.isFinite(amount) || amount === 0) return;
    const reason = prompt('Причина (для аудита):') ?? '';
    await call({ op: 'adjustBalance', amountRub: amount, reason });
  };

  const onBan = async () => {
    if (isBanned) {
      await call({ op: 'unban' });
    } else {
      const reason = prompt('Причина бана:') ?? '';
      await call({ op: 'ban', reason });
    }
  };

  const onReset = async () => {
    if (!confirm(`Сбросить пароль ${email}?`)) return;
    await call({ op: 'resetPassword' });
    alert('Письмо отправлено (если email сервис настроен).');
  };

  return (
    <div className="flex gap-1 justify-end">
      <Button size="sm" variant="outline" disabled={busy} onClick={onAdjust}>
        ±₽
      </Button>
      <Button size="sm" variant={isBanned ? 'outline' : 'destructive'} disabled={busy} onClick={onBan}>
        {isBanned ? 'Анбан' : 'Бан'}
      </Button>
      <Button size="sm" variant="outline" disabled={busy} onClick={onReset}>
        Сброс
      </Button>
    </div>
  );
}
