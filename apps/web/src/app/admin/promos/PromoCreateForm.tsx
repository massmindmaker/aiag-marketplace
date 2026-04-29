'use client';

import * as React from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export function PromoCreateForm() {
  const [busy, setBusy] = React.useState(false);
  const [state, setState] = React.useState({
    code: '',
    description: '',
    kind: 'percent_off',
    value: '',
    minAmountRub: '',
    maxUses: '',
    perUserLimit: '1',
    validUntil: '',
    appliesTo: 'topup',
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const body = {
        code: state.code.trim().toUpperCase(),
        description: state.description || null,
        kind: state.kind,
        value: Number(state.value),
        minAmountRub: state.minAmountRub ? Number(state.minAmountRub) : null,
        maxUses: state.maxUses ? Number(state.maxUses) : null,
        perUserLimit: Number(state.perUserLimit) || 1,
        validUntil: state.validUntil || null,
        appliesTo: state.appliesTo,
      };
      const r = await fetch('/api/admin/promos', {
        method: 'POST',
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
  };

  return (
    <form className="grid grid-cols-1 md:grid-cols-2 gap-3" onSubmit={submit}>
      <Field label="Код">
        <Input
          required
          value={state.code}
          onChange={(e) => setState((s) => ({ ...s, code: e.target.value }))}
          placeholder="LAUNCH50"
        />
      </Field>
      <Field label="Описание">
        <Input
          value={state.description}
          onChange={(e) => setState((s) => ({ ...s, description: e.target.value }))}
        />
      </Field>
      <Field label="Тип">
        <select
          value={state.kind}
          onChange={(e) => setState((s) => ({ ...s, kind: e.target.value }))}
          className="border rounded-md px-3 py-2 bg-background text-sm w-full"
        >
          <option value="percent_off">% скидка</option>
          <option value="fixed_off">фикс ₽</option>
          <option value="free_credit">+ кредиты ₽</option>
        </select>
      </Field>
      <Field label="Значение">
        <Input
          required
          type="number"
          step="0.01"
          value={state.value}
          onChange={(e) => setState((s) => ({ ...s, value: e.target.value }))}
        />
      </Field>
      <Field label="Мин сумма ₽ (опц)">
        <Input
          type="number"
          step="0.01"
          value={state.minAmountRub}
          onChange={(e) => setState((s) => ({ ...s, minAmountRub: e.target.value }))}
        />
      </Field>
      <Field label="Макс использований (опц)">
        <Input
          type="number"
          value={state.maxUses}
          onChange={(e) => setState((s) => ({ ...s, maxUses: e.target.value }))}
        />
      </Field>
      <Field label="Лимит на юзера">
        <Input
          type="number"
          min="1"
          value={state.perUserLimit}
          onChange={(e) => setState((s) => ({ ...s, perUserLimit: e.target.value }))}
        />
      </Field>
      <Field label="Действует до (ISO дата)">
        <Input
          type="date"
          value={state.validUntil}
          onChange={(e) => setState((s) => ({ ...s, validUntil: e.target.value }))}
        />
      </Field>
      <Field label="Применяется к">
        <select
          value={state.appliesTo}
          onChange={(e) => setState((s) => ({ ...s, appliesTo: e.target.value }))}
          className="border rounded-md px-3 py-2 bg-background text-sm w-full"
        >
          <option value="topup">Пополнение</option>
          <option value="subscription">Подписка</option>
          <option value="first_topup_only">Только первое пополнение</option>
        </select>
      </Field>
      <div className="md:col-span-2">
        <Button type="submit" disabled={busy}>
          {busy ? 'Создаём…' : 'Создать промокод'}
        </Button>
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="space-y-1 block">
      <span className="text-xs text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
