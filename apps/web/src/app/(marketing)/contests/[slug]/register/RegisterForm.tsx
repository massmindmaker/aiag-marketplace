'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { ConsentCheckbox } from '@/components/ConsentCheckbox';

export default function RegisterForm({ slug }: { slug: string }) {
  const router = useRouter();
  const [rulesAccepted, setRulesAccepted] = React.useState(false);
  const [privacyAccepted, setPrivacyAccepted] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const canSubmit = rulesAccepted && privacyAccepted && !submitting;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch(`/api/contests/${slug}/register`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ rulesAccepted, privacyAccepted }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error?.message || 'Ошибка регистрации');
      }
      router.push(`/contests/${slug}/submit`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка');
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <ConsentCheckbox
        id="rules"
        checked={rulesAccepted}
        onChange={setRulesAccepted}
        required
        label="Принимаю правила конкурса"
      />
      <ConsentCheckbox
        id="privacy"
        checked={privacyAccepted}
        onChange={setPrivacyAccepted}
        required
        label="Согласен на обработку персональных данных (152-ФЗ)"
      />

      {error && (
        <div className="text-sm text-destructive" role="alert">
          {error}
        </div>
      )}

      <Button type="submit" disabled={!canSubmit} className="w-full">
        {submitting ? 'Регистрация…' : 'Зарегистрироваться и получить доступ'}
      </Button>
    </form>
  );
}
