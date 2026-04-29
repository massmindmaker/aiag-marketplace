'use client';

import * as React from 'react';
import { Button } from '@/components/ui/Button';

export function RoutingRowActions({
  id,
  enabled,
  markup,
}: {
  id: string;
  enabled: boolean;
  markup: number;
}) {
  const [busy, setBusy] = React.useState(false);

  const call = async (path: string, method: string, body?: Record<string, unknown>) => {
    setBusy(true);
    try {
      const r = await fetch(path, {
        method,
        headers: { 'content-type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined,
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) {
        alert(`Ошибка: ${j.error ?? r.status}`);
      } else {
        if (path.endsWith('/test')) {
          alert(
            `Тест: ${j.ok ? 'ОК' : 'FAIL'} ${j.latency_ms ?? ''} ms\n${
              j.sample ? String(j.sample).slice(0, 300) : j.error ?? ''
            }`
          );
        } else {
          window.location.reload();
        }
      }
    } finally {
      setBusy(false);
    }
  };

  const onToggle = () =>
    call(`/api/admin/routing/${id}`, 'PATCH', { op: 'toggle', enabled: !enabled });

  const onMarkup = async () => {
    const raw = prompt('Markup multiplier (e.g. 1.25):', String(markup));
    if (raw == null) return;
    const v = Number(raw);
    if (!Number.isFinite(v) || v <= 0) return;
    await call(`/api/admin/routing/${id}`, 'PATCH', { op: 'setMarkup', markup: v });
  };

  const onTest = () => call(`/api/admin/routing/${id}/test`, 'POST');

  const onDelete = async () => {
    if (!confirm('Удалить маршрут?')) return;
    await call(`/api/admin/routing/${id}`, 'DELETE');
  };

  return (
    <div className="flex gap-1 justify-end">
      <Button size="sm" variant="outline" disabled={busy} onClick={onTest}>
        Тест
      </Button>
      <Button size="sm" variant="outline" disabled={busy} onClick={onMarkup}>
        ×
      </Button>
      <Button
        size="sm"
        variant={enabled ? 'destructive' : 'default'}
        disabled={busy}
        onClick={onToggle}
      >
        {enabled ? 'Выкл' : 'Вкл'}
      </Button>
      <Button size="sm" variant="outline" disabled={busy} onClick={onDelete}>
        ✕
      </Button>
    </div>
  );
}
