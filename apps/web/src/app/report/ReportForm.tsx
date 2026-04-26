'use client';

import { useState } from 'react';

const REASONS = [
  { value: 'illegal', label: 'Незаконный контент' },
  { value: 'csam', label: 'CSAM / детский контент' },
  { value: 'copyright', label: 'Нарушение авторских прав' },
  { value: 'phishing', label: 'Phishing / мошенничество' },
  { value: 'hate', label: 'Экстремизм / ненависть' },
  { value: 'other', label: 'Другое' },
];

const TARGET_TYPES = [
  { value: 'submission', label: 'Submission (конкурс)' },
  { value: 'model', label: 'Модель в маркетплейсе' },
  { value: 'prompt', label: 'Prompt / ответ модели' },
  { value: 'output', label: 'Сгенерированный output' },
];

export function ReportForm() {
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus('sending');
    const fd = new FormData(e.currentTarget);
    const body = Object.fromEntries(fd.entries());
    const r = await fetch('/api/report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    setStatus(r.ok ? 'sent' : 'error');
  }

  if (status === 'sent') {
    return (
      <div className="rounded-md border border-green-500/50 bg-green-500/10 p-4 text-sm">
        Жалоба зарегистрирована. Мы свяжемся с вами в течение 24-72 часов.
      </div>
    );
  }

  return (
    <form className="mt-6 space-y-4" onSubmit={onSubmit}>
      <label className="block">
        <span className="text-sm font-medium">Тип объекта</span>
        <select name="targetType" required className="mt-1 w-full rounded-md border p-2">
          {TARGET_TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="text-sm font-medium">ID / URL объекта</span>
        <input
          name="targetId"
          required
          placeholder="напр., /marketplace/openai/gpt-4o"
          className="mt-1 w-full rounded-md border p-2"
        />
      </label>
      <label className="block">
        <span className="text-sm font-medium">Причина</span>
        <select name="reason" required className="mt-1 w-full rounded-md border p-2">
          {REASONS.map((r) => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="text-sm font-medium">Описание</span>
        <textarea
          name="description"
          rows={5}
          className="mt-1 w-full rounded-md border p-2"
          placeholder="Опишите, что именно не так"
        />
      </label>
      <label className="block">
        <span className="text-sm font-medium">Контакт (email, опционально)</span>
        <input
          name="contactEmail"
          type="email"
          className="mt-1 w-full rounded-md border p-2"
        />
      </label>
      <button
        type="submit"
        disabled={status === 'sending'}
        className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50"
      >
        {status === 'sending' ? 'Отправка…' : 'Отправить жалобу'}
      </button>
      {status === 'error' && (
        <p className="text-sm text-red-500">
          Ошибка отправки. Попробуйте ещё раз или напишите на abuse@ai-aggregator.ru.
        </p>
      )}
    </form>
  );
}
