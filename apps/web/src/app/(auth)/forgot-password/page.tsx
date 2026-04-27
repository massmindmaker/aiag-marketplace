'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Mail, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { Card, CardContent } from '@/components/ui/Card';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        throw new Error(`status ${res.status}`);
      }
      // Always succeed (no user enumeration on the API side either)
      setIsSuccess(true);
    } catch {
      setError('Произошла ошибка. Попробуйте позже.');
    } finally {
      setIsLoading(false);
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
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="-ms-2 mb-4 text-muted-foreground"
            >
              <Link href="/login">
                <ArrowLeft className="me-2 h-4 w-4" />
                Назад к входу
              </Link>
            </Button>

            <div className="text-center mb-6">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-primary">
                <Mail className="h-6 w-6" />
              </div>
              <h1 className="text-2xl font-semibold">Восстановление пароля</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Введите email, указанный при регистрации
              </p>
            </div>

            {isSuccess ? (
              <Alert>
                <AlertDescription>
                  Инструкции по восстановлению пароля отправлены на{' '}
                  <span className="font-mono">{email}</span>. Проверьте почту.
                </AlertDescription>
              </Alert>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    required
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full mt-2"
                  size="lg"
                  disabled={isLoading || !email}
                  loading={isLoading}
                  leftIcon={
                    isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : undefined
                  }
                >
                  Отправить инструкции
                </Button>
              </form>
            )}

            <p className="text-center text-sm text-muted-foreground mt-6">
              Вспомнили пароль?{' '}
              <Link href="/login" className="text-primary hover:underline">
                Войти
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
