'use client';

import * as React from 'react';
import { Button } from '@/components/ui/Button';

export function PromoRowActions({ id, active }: { id: string; active: boolean }) {
  const [busy, setBusy] = React.useState(false);
  const toggle = async () => {
    setBusy(true);
    try {
      const r = await fetch(`/api/admin/promos/${id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ active: !active }),
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
    <Button size="sm" variant="outline" disabled={busy} onClick={toggle}>
      {active ? 'Отключить' : 'Включить'}
    </Button>
  );
}
