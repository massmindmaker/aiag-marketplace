'use client';

import { useState } from 'react';

const REQUEST_TYPES = [
  { value: 'moderation_block', label: 'Мой запрос заблокирован модерацией' },
  { value: 'fraud_flag', label: 'На мой аккаунт установлен fraud-флаг' },
  { value: 'shield_rf_routing', label: 'Shield-RF перенаправил мой запрос' },
  { value: 'automated_decision_general', label: 'Другое автоматизированное решение' },
];

export function HumanReviewForm() {
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [slaDate, setSlaDate] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus('sending');
    const fd = new FormData(e.currentTarget);
    const body = Object.fromEntries(fd.entries());
    const r = await fetch('/api/account/request-human-review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (r.ok) {
      const data = await r.json();
      setSlaDate(data.slaDeadline ?? null);
      setStatus('sent');
    } else {
      setStatus('error');
    }
  }

  if (status === 'sent') {
    return (
      <div className="mt-6 rounded-md border border-green-500/50 bg-green-500/10 p-4 text-sm">
        <p className="font-medium">Запрос зарегистрирован.</p>
        <p className="mt-1">
          Мы ответим до{' '}
          {slaDate ? new Date(slaDate).toLocaleDateString('ru-RU') : 'ближайших 30 дней'}.
          Копия направлена на ваш email.
        </p>
      </div>
    );
  }

  return (
    <form className="mt-6 space-y-4" onSubmit={onSubmit}>
      <label className="block">
        <span className="text-sm font-medium">Тип оспариваемого решения</span>
        <select name="requestType" required className="mt-1 w-full rounded-md border p-2">
          {REQUEST_TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="text-sm font-medium">Связанный объект (опционально)</span>
        <input
          name="relatedEntityId"
          placeholder="напр. request ID или submission ID"
          className="mt-1 w-full rounded-md border p-2"
        />
      </label>
      <label className="block">
        <span className="text-sm font-medium">Объяснение (почему вы не согласны)</span>
        <textarea
          name="userStatement"
          required
          rows={6}
          className="mt-1 w-full rounded-md border p-2"
        />
      </label>
      <button
        type="submit"
        disabled={status === 'sending'}
        className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50"
      >
        {status === 'sending' ? 'Отправка…' : 'Отправить запрос'}
      </button>
      {status === 'error' && (
        <p className="text-sm text-red-500">
          Ошибка отправки. Напишите на{' '}
          <a href="mailto:dpo@ai-aggregator.ru" className="underline">
            dpo@ai-aggregator.ru
          </a>
          .
        </p>
      )}
    </form>
  );
}
