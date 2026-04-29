'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

type ModelOpt = { id: string; slug: string; type: string };
type UpstreamOpt = { id: string; provider: string };

export function AddRouteForm({
  models,
  upstreams,
}: {
  models: ModelOpt[];
  upstreams: UpstreamOpt[];
}) {
  const [open, setOpen] = React.useState(false);
  const [modelId, setModelId] = React.useState(models[0]?.id ?? '');
  const [upstreamId, setUpstreamId] = React.useState(upstreams[0]?.id ?? '');
  const [upstreamModelId, setUpstreamModelId] = React.useState('');
  const [markup, setMarkup] = React.useState('1.25');
  const [busy, setBusy] = React.useState(false);

  const submit = async () => {
    if (!modelId || !upstreamId || !upstreamModelId) {
      alert('Заполните все поля');
      return;
    }
    setBusy(true);
    try {
      const r = await fetch('/api/admin/routing', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          model_id: modelId,
          upstream_id: upstreamId,
          upstream_model_id: upstreamModelId,
          markup: Number(markup),
        }),
      });
      const j = await r.json();
      if (!r.ok) {
        alert(`Ошибка: ${j.error ?? r.status}`);
      } else {
        window.location.reload();
      }
    } finally {
      setBusy(false);
    }
  };

  if (!open) {
    return (
      <Button variant="outline" onClick={() => setOpen(true)}>
        + Добавить маршрут
      </Button>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Новый маршрут</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-5 gap-3">
        <div>
          <label className="text-xs text-muted-foreground">Модель</label>
          <select
            className="w-full h-9 rounded-md border bg-background px-2 text-sm"
            value={modelId}
            onChange={(e) => setModelId(e.target.value)}
          >
            {models.map((m) => (
              <option key={m.id} value={m.id}>
                {m.slug} ({m.type})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Аплинк</label>
          <select
            className="w-full h-9 rounded-md border bg-background px-2 text-sm"
            value={upstreamId}
            onChange={(e) => setUpstreamId(e.target.value)}
          >
            {upstreams.map((u) => (
              <option key={u.id} value={u.id}>
                {u.provider}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Upstream model id</label>
          <Input
            value={upstreamModelId}
            onChange={(e) => setUpstreamModelId(e.target.value)}
            placeholder="openai/gpt-5"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Markup ×</label>
          <Input value={markup} onChange={(e) => setMarkup(e.target.value)} />
        </div>
        <div className="flex items-end gap-2">
          <Button disabled={busy} onClick={submit}>
            Создать
          </Button>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Отмена
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
