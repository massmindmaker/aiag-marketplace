'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Github, Mail } from 'lucide-react';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Divider,
  CircularProgress,
  Alert,
  styled,
} from '@mui/material';

const customButtonOutline = {
  border: '1px solid #555',
  color: '#555',
  transition: 'all 0.3s ease',
  '&:hover': {
    backgroundColor: 'rgba(85, 85, 85, 0.05)',
    borderColor: '#00efdf',
    color: '#00efdf',
    boxShadow: '0 4px 12px rgba(0, 239, 223, 0.15)',
  },
  '&:disabled': {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
};

const StyledPaper = styled(Paper)({
  padding: '2rem',
  backgroundColor: '#ffffff',
  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
  transition: 'all 0.3s ease',
  '&:hover': {
    boxShadow: '0 12px 32px rgba(0, 0, 0, 0.15)',
  },
});

const CyanButton = styled(Button)({
  backgroundColor: '#00efdf',
  color: '#555',
  fontWeight: 600,
  padding: '12px 16px',
  transition: 'all 0.3s ease',
  '&:hover': {
    backgroundColor: '#0ff',
    boxShadow: '0 4px 12px rgba(0, 239, 223, 0.3)',
  },
  '&:disabled': {
    opacity: 0.5,
    backgroundColor: '#00efdf',
    cursor: 'not-allowed',
  },
});

const StyledTextField = styled(TextField)({
  '& .MuiOutlinedInput-root': {
    '& fieldset': {
      borderColor: 'rgba(85, 85, 85, 0.3)',
      transition: 'all 0.3s ease',
    },
    '&:hover fieldset': {
      borderColor: '#555',
    },
    '&.Mui-focused fieldset': {
      borderColor: '#00efdf',
      borderWidth: '2px',
    },
  },
  '& .MuiInputLabel-root.Mui-focused': {
    color: '#00efdf',
  },
});

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
      setFormError('Что-то пошло не так. Попробуйте снова.');
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
        setFormError('Неверный email или пароль');
        setIsLoading(null);
      } else {
        router.push(callbackUrl);
      }
    } catch {
      setFormError('Что-то пошло не так. Попробуйте снова.');
      setIsLoading(null);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Error Messages */}
      {(error || formError) && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error === 'OAuthAccountNotLinked'
            ? 'Этот email уже связан с другой учетной записью.'
            : formError || 'Произошла ошибка. Попробуйте снова.'}
        </Alert>
      )}

      {/* OAuth Buttons */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Button
          onClick={() => handleOAuthSignIn('github')}
          disabled={isLoading !== null}
          variant="outlined"
          fullWidth
          sx={customButtonOutline}
          startIcon={
            isLoading === 'github' ? (
              <CircularProgress size={20} sx={{ color: '#555' }} />
            ) : (
              <Github size={20} />
            )
          }
        >
          Продолжить с GitHub
        </Button>

        <Button
          onClick={() => handleOAuthSignIn('google')}
          disabled={isLoading !== null}
          variant="outlined"
          fullWidth
          sx={customButtonOutline}
          startIcon={
            isLoading === 'google' ? (
              <CircularProgress size={20} sx={{ color: '#555' }} />
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24">
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
            )
          }
        >
          Продолжить с Google
        </Button>
      </Box>

      {/* Divider */}
      <Divider sx={{ my: 2 }}>
        <Typography
          variant="body2"
          sx={{
            color: 'rgba(85, 85, 85, 0.6)',
            textTransform: 'uppercase',
            fontSize: '0.75rem',
          }}
        >
          Или продолжите с email
        </Typography>
      </Divider>

      {/* Email/Password Form */}
      <Box component="form" onSubmit={handleCredentialsSignIn} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        <StyledTextField
          id="email"
          name="email"
          type="email"
          label="Email"
          autoComplete="email"
          required
          fullWidth
          placeholder="you@example.com"
          variant="outlined"
        />

        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography component="label" htmlFor="password" sx={{ fontSize: '0.875rem', fontWeight: 500, color: '#555' }}>
              Пароль
            </Typography>
            <Link
              href="/forgot-password"
              style={{
                fontSize: '0.75rem',
                color: 'rgba(85, 85, 85, 0.6)',
                textDecoration: 'none',
                transition: 'color 0.3s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#00efdf')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(85, 85, 85, 0.6)')}
            >
              Забыли пароль?
            </Link>
          </Box>
          <StyledTextField
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            fullWidth
            placeholder="••••••••"
            variant="outlined"
            sx={{ mt: 0 }}
          />
        </Box>

        <CyanButton
          type="submit"
          disabled={isLoading !== null}
          fullWidth
          startIcon={
            isLoading === 'credentials' ? (
              <CircularProgress size={16} sx={{ color: '#555' }} />
            ) : (
              <Mail size={16} />
            )
          }
        >
          Войти с Email
        </CyanButton>
      </Box>
    </Box>
  );
}

function LoginFormSkeleton() {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Box sx={{ height: 48, bgcolor: 'rgba(0, 0, 0, 0.05)', borderRadius: 1, animation: 'pulse 1.5s ease-in-out infinite' }} />
      <Box sx={{ height: 48, bgcolor: 'rgba(0, 0, 0, 0.05)', borderRadius: 1, animation: 'pulse 1.5s ease-in-out infinite' }} />
      <Box sx={{ height: 16, bgcolor: 'rgba(0, 0, 0, 0.05)', borderRadius: 1, width: '75%', mx: 'auto', animation: 'pulse 1.5s ease-in-out infinite' }} />
      <Box sx={{ height: 40, bgcolor: 'rgba(0, 0, 0, 0.05)', borderRadius: 1, animation: 'pulse 1.5s ease-in-out infinite' }} />
      <Box sx={{ height: 40, bgcolor: 'rgba(0, 0, 0, 0.05)', borderRadius: 1, animation: 'pulse 1.5s ease-in-out infinite' }} />
      <Box sx={{ height: 48, bgcolor: 'rgba(0, 0, 0, 0.05)', borderRadius: 1, animation: 'pulse 1.5s ease-in-out infinite' }} />
    </Box>
  );
}

export default function LoginPage() {
  return (
    <Box
      sx={{
        display: 'flex',
        minHeight: '100vh',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f5f5f5',
      }}
    >
      <Box sx={{ width: '100%', maxWidth: 448, px: 2 }}>
        {/* Logo and Header */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <Typography
              variant="h3"
              component="span"
              sx={{
                fontWeight: 700,
                color: '#555',
                transition: 'color 0.3s ease',
                '&:hover': {
                  color: '#00efdf',
                },
              }}
            >
              AIAG
            </Typography>
          </Link>
          <Typography variant="h5" component="h1" sx={{ mt: 3, fontWeight: 700, color: '#555' }}>
            Войти в аккаунт
          </Typography>
          <Typography variant="body2" sx={{ mt: 1, color: 'rgba(85, 85, 85, 0.7)' }}>
            Нет аккаунта?{' '}
            <Link
              href="/register"
              style={{
                color: '#555',
                fontWeight: 500,
                textDecoration: 'none',
                transition: 'color 0.3s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#00efdf')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#555')}
            >
              Зарегистрироваться
            </Link>
          </Typography>
        </Box>

        {/* Form Container */}
        <StyledPaper elevation={3}>
          <Suspense fallback={<LoginFormSkeleton />}>
            <LoginForm />
          </Suspense>
        </StyledPaper>

        {/* Footer */}
        <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', mt: 3, color: 'rgba(85, 85, 85, 0.6)' }}>
          Входя в систему, вы соглашаетесь с{' '}
          <Link
            href="/terms"
            style={{
              color: 'rgba(85, 85, 85, 0.6)',
              textDecoration: 'none',
              transition: 'color 0.3s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#00efdf')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(85, 85, 85, 0.6)')}
          >
            Условиями использования
          </Link>{' '}
          и{' '}
          <Link
            href="/privacy"
            style={{
              color: 'rgba(85, 85, 85, 0.6)',
              textDecoration: 'none',
              transition: 'color 0.3s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#00efdf')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(85, 85, 85, 0.6)')}
          >
            Политикой конфиденциальности
          </Link>
        </Typography>
      </Box>
    </Box>
  );
}
