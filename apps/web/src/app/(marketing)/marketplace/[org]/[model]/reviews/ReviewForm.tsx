'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';

export function ReviewForm({ slug }: { slug: string }) {
  const router = useRouter();
  const [rating, setRating] = React.useState(5);
  const [title, setTitle] = React.useState('');
  const [content, setContent] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/models/${encodeURIComponent(slug)}/reviews`,
        {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ rating, title, content }),
        }
      );
      const json = await res.json();
      if (!res.ok || json.error) {
        setError(json.error?.message ?? 'Ошибка отправки');
      } else {
        setSuccess(true);
        setTitle('');
        setContent('');
        router.refresh();
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 border rounded-lg p-4">
      <div>
        <Label>Оценка</Label>
        <div className="flex gap-2 mt-1" role="radiogroup" aria-label="Оценка">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              aria-label={`${n} звёзд`}
              onClick={() => setRating(n)}
              className={`text-2xl ${
                n <= rating ? 'text-yellow-500' : 'text-muted-foreground'
              }`}
            >
              ★
            </button>
          ))}
        </div>
      </div>
      <div>
        <Label htmlFor="rev-title">Заголовок (необязательно)</Label>
        <Input
          id="rev-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Кратко"
        />
      </div>
      <div>
        <Label htmlFor="rev-content">Отзыв</Label>
        <textarea
          id="rev-content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={4}
          className="w-full rounded border bg-background px-3 py-2 text-sm"
          placeholder="Что вам понравилось или нет?"
        />
      </div>
      {error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : null}
      {success ? (
        <p className="text-sm text-green-600">Отзыв сохранён, спасибо!</p>
      ) : null}
      <Button type="submit" disabled={submitting}>
        {submitting ? 'Отправка…' : 'Отправить отзыв'}
      </Button>
    </form>
  );
}
