'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Divider,
  Checkbox,
  FormControlLabel,
  Alert,
  CircularProgress,
  IconButton,
  InputAdornment,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { GitHub as GithubIcon } from '@mui/icons-material';

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
  const error = searchParams.get('error');

  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false,
  });
  const [fieldErrors, setFieldErrors] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    acceptTerms: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleOAuthSignIn = async (provider: string) => {
    setIsLoading(provider);
    setFormError(null);
    try {
      await signIn(provider, { callbackUrl });
    } catch {
      setFormError('Что-то пошло не так. Пожалуйста, попробуйте снова.');
      setIsLoading(null);
    }
  };

  const validateForm = () => {
    const errors = {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      acceptTerms: '',
    };
    let isValid = true;

    // Name validation
    if (!formData.name.trim()) {
      errors.name = 'Имя обязательно';
      isValid = false;
    } else if (formData.name.trim().length < 2) {
      errors.name = 'Имя должно содержать минимум 2 символа';
      isValid = false;
    }

    // Email validation
    if (!formData.email.trim()) {
      errors.email = 'Email обязателен';
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Некорректный email';
      isValid = false;
    }

    // Password validation
    if (!formData.password) {
      errors.password = 'Пароль обязателен';
      isValid = false;
    } else if (formData.password.length < 8) {
      errors.password = 'Пароль должен содержать минимум 8 символов';
      isValid = false;
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Подтвердите пароль';
      isValid = false;
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Пароли не совпадают';
      isValid = false;
    }

    // Terms validation
    if (!formData.acceptTerms) {
      errors.acceptTerms = 'Необходимо принять условия';
      isValid = false;
    }

    setFieldErrors(errors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);

    if (!validateForm()) {
      return;
    }

    setIsLoading('credentials');

    try {
      // TODO: Implement actual registration API call
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        setFormError(data.message || 'Ошибка регистрации');
        setIsLoading(null);
        return;
      }

      // Auto sign in after registration
      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (result?.error) {
        setFormError('Регистрация успешна, но не удалось войти. Попробуйте войти вручную.');
        setIsLoading(null);
        setTimeout(() => router.push('/login'), 2000);
      } else {
        router.push(callbackUrl);
      }
    } catch {
      setFormError('Что-то пошло не так. Пожалуйста, попробуйте снова.');
      setIsLoading(null);
    }
  };

  const handleInputChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = field === 'acceptTerms' ? e.target.checked : e.target.value;
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear field error on change
    if (fieldErrors[field as keyof typeof fieldErrors]) {
      setFieldErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <Box sx={{ width: '100%', maxWidth: 480, px: 2 }}>
      <Paper
        elevation={4}
        sx={{
          p: 4,
          borderRadius: 2,
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
        }}
      >
        {/* Error Messages */}
        {(error || formError) && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error === 'OAuthAccountNotLinked'
              ? 'Этот email уже связан с другим аккаунтом.'
              : formError || 'Произошла ошибка. Пожалуйста, попробуйте снова.'}
          </Alert>
        )}

        {/* OAuth Buttons */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Button
            onClick={() => handleOAuthSignIn('github')}
            disabled={isLoading !== null}
            variant="outlined"
            fullWidth
            startIcon={
              isLoading === 'github' ? (
                <CircularProgress size={20} />
              ) : (
                <GithubIcon />
              )
            }
            sx={{
              py: 1.5,
              border: '1px solid #777',
              color: '#333',
              backgroundColor: 'transparent',
              textTransform: 'none',
              fontSize: '0.95rem',
              '&:hover': {
                border: '1px solid #0ff',
                backgroundColor: '#fff',
                boxShadow: '0 2px 8px rgba(0, 255, 255, 0.15)',
              },
              '&:disabled': {
                opacity: 0.5,
              },
            }}
          >
            Продолжить с GitHub
          </Button>

          <Button
            onClick={() => handleOAuthSignIn('google')}
            disabled={isLoading !== null}
            variant="outlined"
            fullWidth
            startIcon={
              isLoading === 'google' ? (
                <CircularProgress size={20} />
              ) : (
                <Box
                  component="svg"
                  sx={{ width: 20, height: 20 }}
                  viewBox="0 0 24 24"
                >
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
                </Box>
              )
            }
            sx={{
              py: 1.5,
              border: '1px solid #777',
              color: '#333',
              backgroundColor: 'transparent',
              textTransform: 'none',
              fontSize: '0.95rem',
              '&:hover': {
                border: '1px solid #0ff',
                backgroundColor: '#fff',
                boxShadow: '0 2px 8px rgba(0, 255, 255, 0.15)',
              },
              '&:disabled': {
                opacity: 0.5,
              },
            }}
          >
            Продолжить с Google
          </Button>
        </Box>

        {/* Divider */}
        <Divider sx={{ my: 3 }}>
          <Typography variant="body2" sx={{ color: '#666', fontSize: '0.85rem' }}>
            ИЛИ ПРОДОЛЖИТЬ С EMAIL
          </Typography>
        </Divider>

        {/* Registration Form */}
        <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          {/* Name Field */}
          <TextField
            fullWidth
            id="name"
            name="name"
            label="Имя"
            type="text"
            autoComplete="name"
            required
            value={formData.name}
            onChange={handleInputChange('name')}
            error={!!fieldErrors.name}
            helperText={fieldErrors.name}
            disabled={isLoading !== null}
            sx={{
              '& .MuiOutlinedInput-root': {
                '&:hover fieldset': {
                  borderColor: '#0ff',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#00efdf',
                },
              },
            }}
          />

          {/* Email Field */}
          <TextField
            fullWidth
            id="email"
            name="email"
            label="Email"
            type="email"
            autoComplete="email"
            required
            value={formData.email}
            onChange={handleInputChange('email')}
            error={!!fieldErrors.email}
            helperText={fieldErrors.email}
            disabled={isLoading !== null}
            sx={{
              '& .MuiOutlinedInput-root': {
                '&:hover fieldset': {
                  borderColor: '#0ff',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#00efdf',
                },
              },
            }}
          />

          {/* Password Field */}
          <TextField
            fullWidth
            id="password"
            name="password"
            label="Пароль"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            required
            value={formData.password}
            onChange={handleInputChange('password')}
            error={!!fieldErrors.password}
            helperText={fieldErrors.password}
            disabled={isLoading !== null}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="переключить видимость пароля"
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                    size="small"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                '&:hover fieldset': {
                  borderColor: '#0ff',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#00efdf',
                },
              },
            }}
          />

          {/* Confirm Password Field */}
          <TextField
            fullWidth
            id="confirmPassword"
            name="confirmPassword"
            label="Подтвердите пароль"
            type={showConfirmPassword ? 'text' : 'password'}
            autoComplete="new-password"
            required
            value={formData.confirmPassword}
            onChange={handleInputChange('confirmPassword')}
            error={!!fieldErrors.confirmPassword}
            helperText={fieldErrors.confirmPassword}
            disabled={isLoading !== null}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="переключить видимость пароля"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    edge="end"
                    size="small"
                  >
                    {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                '&:hover fieldset': {
                  borderColor: '#0ff',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#00efdf',
                },
              },
            }}
          />

          {/* Accept Terms Checkbox */}
          <Box>
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.acceptTerms}
                  onChange={handleInputChange('acceptTerms')}
                  disabled={isLoading !== null}
                  sx={{
                    color: fieldErrors.acceptTerms ? '#d32f2f' : '#555',
                    '&.Mui-checked': {
                      color: '#00efdf',
                    },
                  }}
                />
              }
              label={
                <Typography variant="body2" sx={{ fontSize: '0.9rem' }}>
                  Я принимаю{' '}
                  <Link
                    href="/terms"
                    style={{ color: '#00efdf', textDecoration: 'none' }}
                  >
                    Условия использования
                  </Link>{' '}
                  и{' '}
                  <Link
                    href="/privacy"
                    style={{ color: '#00efdf', textDecoration: 'none' }}
                  >
                    Политику конфиденциальности
                  </Link>
                </Typography>
              }
            />
            {fieldErrors.acceptTerms && (
              <Typography variant="caption" sx={{ color: '#d32f2f', ml: 4, display: 'block' }}>
                {fieldErrors.acceptTerms}
              </Typography>
            )}
          </Box>

          {/* Submit Button */}
          <Button
            type="submit"
            fullWidth
            disabled={isLoading !== null}
            sx={{
              py: 1.5,
              mt: 1,
              border: '1px solid #00efdf',
              borderRadius: '5px',
              color: '#000',
              textTransform: 'none',
              fontSize: '1rem',
              fontWeight: 500,
              background: 'linear-gradient(90deg, rgba(150, 246, 215, 1) 0%, rgba(153, 230, 231, 1) 100%)',
              boxShadow: '0 2px 8px rgba(0, 239, 223, 0.2)',
              '&:hover': {
                border: '1px solid #0ff',
                color: '#000',
                background: '#fff',
                boxShadow: '0 4px 16px rgba(0, 255, 255, 0.3)',
              },
              '&:disabled': {
                opacity: 0.6,
              },
            }}
          >
            {isLoading === 'credentials' ? (
              <CircularProgress size={24} sx={{ color: '#000' }} />
            ) : (
              'Зарегистрироваться'
            )}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}

function RegisterFormSkeleton() {
  return (
    <Box sx={{ width: '100%', maxWidth: 480, px: 2 }}>
      <Paper
        elevation={4}
        sx={{
          p: 4,
          borderRadius: 2,
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box sx={{ height: 48, bgcolor: '#f5f5f5', borderRadius: 1, animation: 'pulse 1.5s ease-in-out infinite' }} />
          <Box sx={{ height: 48, bgcolor: '#f5f5f5', borderRadius: 1, animation: 'pulse 1.5s ease-in-out infinite' }} />
          <Box sx={{ height: 24, bgcolor: '#f5f5f5', borderRadius: 1, width: '60%', mx: 'auto', animation: 'pulse 1.5s ease-in-out infinite' }} />
          <Box sx={{ height: 56, bgcolor: '#f5f5f5', borderRadius: 1, animation: 'pulse 1.5s ease-in-out infinite' }} />
          <Box sx={{ height: 56, bgcolor: '#f5f5f5', borderRadius: 1, animation: 'pulse 1.5s ease-in-out infinite' }} />
          <Box sx={{ height: 56, bgcolor: '#f5f5f5', borderRadius: 1, animation: 'pulse 1.5s ease-in-out infinite' }} />
          <Box sx={{ height: 56, bgcolor: '#f5f5f5', borderRadius: 1, animation: 'pulse 1.5s ease-in-out infinite' }} />
          <Box sx={{ height: 40, bgcolor: '#f5f5f5', borderRadius: 1, animation: 'pulse 1.5s ease-in-out infinite' }} />
          <Box sx={{ height: 48, bgcolor: '#f5f5f5', borderRadius: 1, animation: 'pulse 1.5s ease-in-out infinite' }} />
        </Box>
      </Paper>
    </Box>
  );
}

export default function RegisterPage() {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: '#f8f8f8',
        py: 4,
      }}
    >
      <Box sx={{ width: '100%', maxWidth: 480 }}>
        {/* Logo & Header */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <Typography
              variant="h3"
              component="span"
              sx={{
                fontWeight: 700,
                color: '#555',
                fontSize: '2rem',
              }}
            >
              AIAG
            </Typography>
          </Link>
          <Typography
            variant="h5"
            sx={{
              mt: 3,
              fontWeight: 600,
              color: '#333',
              fontSize: '1.5rem',
            }}
          >
            Создать аккаунт
          </Typography>
          <Typography
            variant="body2"
            sx={{
              mt: 1,
              color: '#666',
              fontSize: '0.95rem',
            }}
          >
            Уже есть аккаунт?{' '}
            <Link
              href="/login"
              style={{
                color: '#00efdf',
                textDecoration: 'none',
                fontWeight: 500,
              }}
            >
              Войти
            </Link>
          </Typography>
        </Box>

        <Suspense fallback={<RegisterFormSkeleton />}>
          <RegisterForm />
        </Suspense>

        {/* Footer */}
        <Typography
          variant="caption"
          sx={{
            display: 'block',
            textAlign: 'center',
            mt: 3,
            color: '#999',
            fontSize: '0.8rem',
          }}
        >
          При регистрации вы соглашаетесь с нашими{' '}
          <Link href="/terms" style={{ color: '#00efdf', textDecoration: 'none' }}>
            Условиями использования
          </Link>{' '}
          и{' '}
          <Link href="/privacy" style={{ color: '#00efdf', textDecoration: 'none' }}>
            Политикой конфиденциальности
          </Link>
        </Typography>
      </Box>
    </Box>
  );
}
