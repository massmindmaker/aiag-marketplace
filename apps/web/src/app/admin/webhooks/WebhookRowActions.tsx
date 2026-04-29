'use client';

import * as React from 'react';
import { Button } from '@/components/ui/Button';

export function WebhookRowActions({ id, canRetry }: { id: string; canRetry: boolean }) {
  const [busy, setBusy] = React.useState(false);

  const onRetry = async () => {
    setBusy(true);
    try {
      const r = await fetch(`/api/admin/webhooks/${id}/retry`, { method: 'POST' });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) alert(`Ошибка: ${j.error ?? r.status}`);
      else window.location.reload();
    } finally {
      setBusy(false);
    }
  };

  const onResolve = async () => {
    setBusy(true);
    try {
      const r = await fetch(`/api/admin/webhooks/${id}/retry`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ resolve: true }),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        alert(`Ошибка: ${j.error ?? r.status}`);
      } else window.location.reload();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex gap-1 justify-end">
      <Button size="sm" variant="outline" disabled={busy || !canRetry} onClick={onRetry}>
        Retry
      </Button>
      <Button size="sm" variant="outline" disabled={busy} onClick={onResolve}>
        Resolve
      </Button>
    </div>
  );
}
