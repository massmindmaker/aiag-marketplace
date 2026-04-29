'use client';

import * as React from 'react';
import { Button } from '@/components/ui/Button';

export function UpstreamRowActions({
  upstreamId,
  enabled,
  markupPct,
}: {
  upstreamId: string;
  enabled: boolean;
  markupPct: number;
}) {
  const [busy, setBusy] = React.useState(false);

  const call = async (path: string, body?: Record<string, unknown>, method = 'PATCH') => {
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
        if (path.endsWith('/test')) alert(`Тест: ${j.ok ? 'ОК' : 'FAIL'} ${j.latency_ms ?? ''} ms ${j.error ?? ''}`);
        else window.location.reload();
      }
    } finally {
      setBusy(false);
    }
  };

  const onToggle = () => call(`/api/admin/upstreams/${upstreamId}`, { op: 'toggle', enabled: !enabled });
  const onMarkup = async () => {
    const raw = prompt('Markup %:', String(markupPct));
    if (raw == null) return;
    const v = Number(raw);
    if (!Number.isFinite(v)) return;
    await call(`/api/admin/upstreams/${upstreamId}`, { op: 'setMarkup', markupPct: v });
  };
  const onTest = () => call(`/api/admin/upstreams/${upstreamId}/test`, undefined, 'POST');

  return (
    <div className="flex gap-1 justify-end">
      <Button size="sm" variant="outline" disabled={busy} onClick={onTest}>
        Тест
      </Button>
      <Button size="sm" variant="outline" disabled={busy} onClick={onMarkup}>
        %
      </Button>
      <Button
        size="sm"
        variant={enabled ? 'destructive' : 'default'}
        disabled={busy}
        onClick={onToggle}
      >
        {enabled ? 'Выкл' : 'Вкл'}
      </Button>
    </div>
  );
}
