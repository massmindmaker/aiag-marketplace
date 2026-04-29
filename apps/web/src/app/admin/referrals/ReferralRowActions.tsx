'use client';

import * as React from 'react';
import { Button } from '@/components/ui/Button';

export function ReferralRowActions({
  id,
  paidOut,
  fraudFlagged,
}: {
  id: string;
  paidOut: boolean;
  fraudFlagged: boolean;
}) {
  const [busy, setBusy] = React.useState(false);

  const call = async (op: string) => {
    setBusy(true);
    try {
      const r = await fetch(`/api/admin/referrals/${id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ op }),
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
  };

  return (
    <div className="inline-flex gap-1">
      {!paidOut && !fraudFlagged && (
        <Button size="sm" variant="outline" disabled={busy} onClick={() => call('pay')}>
          Выплатить
        </Button>
      )}
      {!fraudFlagged && (
        <Button size="sm" variant="destructive" disabled={busy} onClick={() => call('flag')}>
          Фрод
        </Button>
      )}
      {fraudFlagged && (
        <Button size="sm" variant="outline" disabled={busy} onClick={() => call('unflag')}>
          Снять
        </Button>
      )}
    </div>
  );
}
