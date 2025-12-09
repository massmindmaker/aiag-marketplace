'use client';

import { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Paper,
  Alert,
  CircularProgress,
} from '@mui/material';
import { ArrowBack as ArrowBackIcon, Email as EmailIcon } from '@mui/icons-material';
import Link from 'next/link';

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
      // TODO: Implement actual password reset API
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setIsSuccess(true);
    } catch {
      setError('Произошла ошибка. Попробуйте позже.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: '#fafafa',
        py: 4,
      }}
    >
      <Container maxWidth="sm">
        <Paper sx={{ p: { xs: 3, md: 5 }, borderRadius: 2 }}>
          <Button
            component={Link}
            href="/login"
            startIcon={<ArrowBackIcon />}
            sx={{ mb: 3, color: '#666' }}
          >
            Назад к входу
          </Button>

          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                bgcolor: '#00efdf20',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 2,
              }}
            >
              <EmailIcon sx={{ fontSize: 32, color: '#00efdf' }} />
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#333', mb: 1 }}>
              Восстановление пароля
            </Typography>
            <Typography variant="body1" sx={{ color: '#666' }}>
              Введите email, указанный при регистрации
            </Typography>
          </Box>

          {isSuccess ? (
            <Alert severity="success" sx={{ mb: 3 }}>
              Инструкции по восстановлению пароля отправлены на {email}.
              Проверьте почту.
            </Alert>
          ) : (
            <form onSubmit={handleSubmit}>
              {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  {error}
                </Alert>
              )}

              <TextField
                fullWidth
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                sx={{
                  mb: 3,
                  '& .MuiOutlinedInput-root': {
                    '&:hover fieldset': { borderColor: '#00efdf' },
                    '&.Mui-focused fieldset': { borderColor: '#00efdf' },
                  },
                  '& .MuiInputLabel-root.Mui-focused': { color: '#00efdf' },
                }}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={isLoading || !email}
                sx={{
                  py: 1.5,
                  bgcolor: '#00efdf',
                  color: '#000',
                  fontWeight: 600,
                  '&:hover': { bgcolor: '#00d4c5' },
                  '&:disabled': { bgcolor: '#ccc' },
                }}
              >
                {isLoading ? (
                  <CircularProgress size={24} sx={{ color: '#666' }} />
                ) : (
                  'Отправить инструкции'
                )}
              </Button>
            </form>
          )}

          <Typography
            variant="body2"
            sx={{ textAlign: 'center', mt: 3, color: '#888' }}
          >
            Вспомнили пароль?{' '}
            <Link href="/login" style={{ color: '#00efdf', textDecoration: 'none' }}>
              Войти
            </Link>
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
}
