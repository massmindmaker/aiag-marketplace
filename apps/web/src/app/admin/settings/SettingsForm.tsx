'use client';

import * as React from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Switch } from '@/components/ui/Switch';

type Field = { key: string; label: string; type: 'text' | 'number' | 'bool' | 'json' };

export function SettingsForm({
  fields,
  values,
}: {
  section: string;
  fields: Field[];
  values: Record<string, unknown>;
}) {
  const [busy, setBusy] = React.useState(false);
  const [state, setState] = React.useState<Record<string, unknown>>(() => {
    const s: Record<string, unknown> = {};
    for (const f of fields) {
      s[f.key] = values[f.key];
      if (f.type === 'json') s[f.key] = JSON.stringify(values[f.key] ?? {}, null, 2);
    }
    return s;
  });

  const onSave = async () => {
    setBusy(true);
    try {
      const updates: Record<string, unknown> = {};
      for (const f of fields) {
        let v = state[f.key];
        if (f.type === 'number') v = Number(v);
        if (f.type === 'json') {
          try {
            v = JSON.parse(v as string);
          } catch {
            alert(`Невалидный JSON в ${f.key}`);
            setBusy(false);
            return;
          }
        }
        updates[f.key] = v;
      }
      const r = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        alert(`Ошибка: ${j.error ?? r.status}`);
      } else {
        alert('Сохранено');
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3">
      {fields.map((f) => (
        <div key={f.key} className="grid grid-cols-[1fr_2fr] gap-3 items-center">
          <label className="text-sm">{f.label}</label>
          {f.type === 'bool' ? (
            <Switch
              checked={!!state[f.key]}
              onCheckedChange={(c: boolean) => setState((s) => ({ ...s, [f.key]: c }))}
            />
          ) : f.type === 'json' ? (
            <textarea
              className="w-full border rounded-md px-3 py-2 bg-background text-xs font-mono min-h-[100px]"
              value={String(state[f.key] ?? '')}
              onChange={(e) => setState((s) => ({ ...s, [f.key]: e.target.value }))}
            />
          ) : (
            <Input
              type={f.type === 'number' ? 'number' : 'text'}
              value={String(state[f.key] ?? '')}
              onChange={(e) => setState((s) => ({ ...s, [f.key]: e.target.value }))}
            />
          )}
        </div>
      ))}
      <Button disabled={busy} onClick={onSave}>
        Сохранить
      </Button>
    </div>
  );
}
