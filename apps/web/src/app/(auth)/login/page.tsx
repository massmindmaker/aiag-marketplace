'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Github, Mail, Loader2 } from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
  const error = searchParams.get('error');

  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const handleOAuthSignIn = async (provider: string) => {
    setIsLoading(provider);
    setFormError(null);
    try {
      await signIn(provider, { callbackUrl });
    } catch {
      setFormError('Something went wrong. Please try again.');
      setIsLoading(null);
    }
  };

  const handleCredentialsSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading('credentials');
    setFormError(null);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setFormError('Invalid email or password');
        setIsLoading(null);
      } else {
        router.push(callbackUrl);
      }
    } catch {
      setFormError('Something went wrong. Please try again.');
      setIsLoading(null);
    }
  };

  return (
    <>
      {/* Error Messages */}
      {(error || formError) && (
        <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
          {error === 'OAuthAccountNotLinked'
            ? 'This email is already associated with another account.'
            : formError || 'An error occurred. Please try again.'}
        </div>
      )}

      {/* OAuth Buttons */}
      <div className="space-y-3">
        <button
          onClick={() => handleOAuthSignIn('github')}
          disabled={isLoading !== null}
          className="flex w-full items-center justify-center gap-3 rounded-md border bg-background px-4 py-3 text-sm font-medium transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading === 'github' ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Github className="h-5 w-5" />
          )}
          Continue with GitHub
        </button>

        <button
          onClick={() => handleOAuthSignIn('google')}
          disabled={isLoading !== null}
          className="flex w-full items-center justify-center gap-3 rounded-md border bg-background px-4 py-3 text-sm font-medium transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading === 'google' ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
          )}
          Continue with Google
        </button>
      </div>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Or continue with email
          </span>
        </div>
      </div>

      {/* Email/Password Form */}
      <form onSubmit={handleCredentialsSignIn} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className="mt-1 block w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="block text-sm font-medium">
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-xs text-muted-foreground hover:text-primary"
            >
              Forgot password?
            </Link>
          </div>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className="mt-1 block w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="••••••••"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading !== null}
          className="flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading === 'credentials' ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Mail className="h-4 w-4" />
          )}
          Sign in with Email
        </button>
      </form>
    </>
  );
}

function LoginFormSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-12 bg-muted rounded-md" />
      <div className="h-12 bg-muted rounded-md" />
      <div className="h-4 bg-muted rounded-md w-3/4 mx-auto" />
      <div className="h-10 bg-muted rounded-md" />
      <div className="h-10 bg-muted rounded-md" />
      <div className="h-12 bg-muted rounded-md" />
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-md space-y-8 px-4">
        {/* Logo */}
        <div className="text-center">
          <Link href="/" className="inline-block">
            <span className="text-3xl font-bold text-primary">AIAG</span>
          </Link>
          <h1 className="mt-6 text-2xl font-bold tracking-tight">Sign in to your account</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Don't have an account?{' '}
            <Link href="/register" className="font-medium text-primary hover:underline">
              Sign up
            </Link>
          </p>
        </div>

        <Suspense fallback={<LoginFormSkeleton />}>
          <LoginForm />
        </Suspense>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground">
          By signing in, you agree to our{' '}
          <Link href="/terms" className="hover:text-primary">
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link href="/privacy" className="hover:text-primary">
            Privacy Policy
          </Link>
        </p>
      </div>
    </div>
  );
}
