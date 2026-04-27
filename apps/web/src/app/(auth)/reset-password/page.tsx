'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, KeyRound, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { Card, CardContent } from '@/components/ui/Card';

function ResetPasswordInner() {
  const params = useSearchParams();
  const token = params.get('token') ?? '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!token) {
      setError('Отсутствует токен. Запросите сброс заново.');
      return;
    }
    if (password !== confirm) {
      setError('Пароли не совпадают.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, new_password: password }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(j.error ?? `status ${res.status}`);
      }
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-8 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <span className="text-3xl font-mono font-bold tracking-tight">
              ai-aggregator<span className="text-primary">.ru</span>
            </span>
          </Link>
        </div>
        <Card className="shadow-lg">
          <CardContent className="p-8">
            <Button asChild variant="ghost" size="sm" className="-ms-2 mb-4 text-muted-foreground">
              <Link href="/login">
                <ArrowLeft className="me-2 h-4 w-4" />
                Назад к входу
              </Link>
            </Button>
            <div className="text-center mb-6">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-primary">
                <KeyRound className="h-6 w-6" />
              </div>
              <h1 className="text-2xl font-semibold">Новый пароль</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Минимум 8 символов, заглавные/строчные буквы и цифры.
              </p>
            </div>
            {success ? (
              <Alert>
                <AlertDescription>
                  Пароль обновлён.{' '}
                  <Link href="/login" className="text-primary hover:underline">
                    Войти
                  </Link>
                </AlertDescription>
              </Alert>
            ) : (
              <form onSubmit={submit} className="flex flex-col gap-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="password">Новый пароль</Label>
                  <Input
                    id="password"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="confirm">Подтверждение</Label>
                  <Input
                    id="confirm"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    disabled={loading}
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full mt-2"
                  size="lg"
                  disabled={loading || !password || !confirm}
                  loading={loading}
                  leftIcon={loading ? <Loader2 className="h-4 w-4 animate-spin" /> : undefined}
                >
                  Сохранить новый пароль
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordInner />
    </Suspense>
  );
}
