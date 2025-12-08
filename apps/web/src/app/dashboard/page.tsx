'use client';

import React from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  LinearProgress,
  IconButton,
  Avatar,
} from '@mui/material';
import {
  AccountBalanceWallet,
  TrendingUp,
  Code,
  Stars,
  Refresh,
  Settings,
  VpnKey,
  PaymentOutlined,
  UpgradeOutlined,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import MainLayout from '@/components/layout/MainLayout';

// Styled components with animations
const StyledCard = styled(Card)(() => ({
  height: '100%',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: '0 12px 24px rgba(0, 239, 223, 0.15)',
  },
}));

const StatCard = styled(Card)(() => ({
  height: '100%',
  background: 'linear-gradient(135deg, #555 0%, #333 100%)',
  color: '#fff',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    right: 0,
    width: '100px',
    height: '100px',
    background: 'radial-gradient(circle, rgba(0, 239, 223, 0.2) 0%, transparent 70%)',
    borderRadius: '50%',
    transform: 'translate(30%, -30%)',
  },
  '&:hover': {
    transform: 'scale(1.02)',
    boxShadow: '0 8px 16px rgba(0, 239, 223, 0.2)',
  },
}));

const ActionButton = styled(Button)(() => ({
  background: 'linear-gradient(135deg, #555 0%, #333 100%)',
  color: '#00efdf',
  border: '1px solid #00efdf',
  transition: 'all 0.3s ease',
  '&:hover': {
    background: 'linear-gradient(135deg, #00efdf 0%, #0ff 100%)',
    color: '#333',
    transform: 'translateY(-2px)',
    boxShadow: '0 4px 12px rgba(0, 239, 223, 0.3)',
  },
}));

const CircularProgressWithLabel = ({ value }: { value: number }) => {
  return (
    <Box position="relative" display="inline-flex">
      <CircularProgress
        variant="determinate"
        value={value}
        size={120}
        thickness={4}
        sx={{
          color: '#00efdf',
          '& .MuiCircularProgress-circle': {
            strokeLinecap: 'round',
          },
        }}
      />
      <Box
        sx={{
          top: 0,
          left: 0,
          bottom: 0,
          right: 0,
          position: 'absolute',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
        }}
      >
        <Typography variant="h4" component="div" color="#00efdf" fontWeight="bold">
          {`${Math.round(value)}%`}
        </Typography>
        <Typography variant="caption" color="#999">
          использовано
        </Typography>
      </Box>
    </Box>
  );
};

// Mock data
const mockStats = {
  tokens: {
    used: 750000,
    total: 1000000,
    percentage: 75,
  },
  apiCalls: 1234,
  activeModels: 3,
  plan: 'Профессиональный',
};

const mockRecentCalls = [
  {
    id: 1,
    timestamp: '2025-12-07 14:23:15',
    model: 'GPT-4',
    tokens: 1250,
    status: 'success',
    endpoint: '/v1/chat/completions',
  },
  {
    id: 2,
    timestamp: '2025-12-07 14:15:42',
    model: 'Claude Sonnet',
    tokens: 890,
    status: 'success',
    endpoint: '/v1/chat/completions',
  },
  {
    id: 3,
    timestamp: '2025-12-07 13:58:30',
    model: 'GPT-3.5',
    tokens: 450,
    status: 'success',
    endpoint: '/v1/chat/completions',
  },
  {
    id: 4,
    timestamp: '2025-12-07 13:42:18',
    model: 'GPT-4',
    tokens: 2100,
    status: 'error',
    endpoint: '/v1/chat/completions',
  },
  {
    id: 5,
    timestamp: '2025-12-07 13:30:05',
    model: 'Claude Opus',
    tokens: 1680,
    status: 'success',
    endpoint: '/v1/chat/completions',
  },
];

export default function DashboardPage() {
  return (
    <MainLayout>
      <Box sx={{ p: 4 }}>
        {/* Welcome Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, color: '#333' }}>
            Добро пожаловать, Пользователь
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Обзор вашего аккаунта и использования API
          </Typography>
        </Box>

        {/* Stats Cards Row */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard elevation={3}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ bgcolor: '#00efdf', color: '#333', mr: 2 }}>
                    <AccountBalanceWallet />
                  </Avatar>
                  <Typography variant="h6">Токены</Typography>
                </Box>
                <Typography variant="h4" sx={{ mb: 1, fontWeight: 'bold', color: '#00efdf' }}>
                  {mockStats.tokens.used.toLocaleString()}
                </Typography>
                <Typography variant="body2" sx={{ color: '#aaa' }}>
                  из {mockStats.tokens.total.toLocaleString()}
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={mockStats.tokens.percentage}
                  sx={{
                    mt: 2,
                    height: 6,
                    borderRadius: 3,
                    bgcolor: '#444',
                    '& .MuiLinearProgress-bar': {
                      bgcolor: '#00efdf',
                    },
                  }}
                />
              </CardContent>
            </StatCard>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <StatCard elevation={3}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ bgcolor: '#0ff', color: '#333', mr: 2 }}>
                    <TrendingUp />
                  </Avatar>
                  <Typography variant="h6">API вызовы</Typography>
                </Box>
                <Typography variant="h4" sx={{ mb: 1, fontWeight: 'bold', color: '#0ff' }}>
                  {mockStats.apiCalls.toLocaleString()}
                </Typography>
                <Typography variant="body2" sx={{ color: '#aaa' }}>
                  в этом месяце
                </Typography>
                <Box sx={{ mt: 2, display: 'flex', alignItems: 'center' }}>
                  <TrendingUp sx={{ fontSize: 16, mr: 0.5, color: '#0ff' }} />
                  <Typography variant="caption" sx={{ color: '#0ff' }}>
                    +12.5% от прошлого месяца
                  </Typography>
                </Box>
              </CardContent>
            </StatCard>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <StatCard elevation={3}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ bgcolor: '#00efdf', color: '#333', mr: 2 }}>
                    <Code />
                  </Avatar>
                  <Typography variant="h6">Активные модели</Typography>
                </Box>
                <Typography variant="h4" sx={{ mb: 1, fontWeight: 'bold', color: '#00efdf' }}>
                  {mockStats.activeModels}
                </Typography>
                <Typography variant="body2" sx={{ color: '#aaa' }}>
                  моделей доступно
                </Typography>
                <Box sx={{ mt: 2, display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                  <Chip label="GPT-4" size="small" sx={{ bgcolor: '#444', color: '#00efdf' }} />
                  <Chip label="Claude" size="small" sx={{ bgcolor: '#444', color: '#00efdf' }} />
                  <Chip label="GPT-3.5" size="small" sx={{ bgcolor: '#444', color: '#00efdf' }} />
                </Box>
              </CardContent>
            </StatCard>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <StatCard elevation={3}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ bgcolor: '#0ff', color: '#333', mr: 2 }}>
                    <Stars />
                  </Avatar>
                  <Typography variant="h6">Тариф</Typography>
                </Box>
                <Typography variant="h4" sx={{ mb: 1, fontWeight: 'bold', color: '#0ff' }}>
                  {mockStats.plan}
                </Typography>
                <Typography variant="body2" sx={{ color: '#aaa' }}>
                  активен до 31.12.2025
                </Typography>
                <Button
                  size="small"
                  sx={{
                    mt: 2,
                    color: '#0ff',
                    borderColor: '#0ff',
                    '&:hover': { borderColor: '#0ff', bgcolor: 'rgba(0, 255, 255, 0.1)' },
                  }}
                  variant="outlined"
                >
                  Подробнее
                </Button>
              </CardContent>
            </StatCard>
          </Grid>
        </Grid>

        {/* Main Content Grid */}
        <Grid container spacing={3}>
          {/* Token Balance Card */}
          <Grid item xs={12} md={4}>
            <StyledCard elevation={3}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#555' }}>
                    Баланс токенов
                  </Typography>
                  <IconButton size="small" sx={{ color: '#00efdf' }}>
                    <Refresh />
                  </IconButton>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
                  <CircularProgressWithLabel value={mockStats.tokens.percentage} />
                </Box>
                <Box sx={{ textAlign: 'center', mb: 3 }}>
                  <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#555', mb: 1 }}>
                    {mockStats.tokens.used.toLocaleString()} / {mockStats.tokens.total.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    токенов использовано
                  </Typography>
                </Box>
                <ActionButton fullWidth startIcon={<PaymentOutlined />} sx={{ mb: 1 }}>
                  Пополнить баланс
                </ActionButton>
              </CardContent>
            </StyledCard>
          </Grid>

          {/* Current Plan & Quick Actions */}
          <Grid item xs={12} md={4}>
            <StyledCard elevation={3}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#555', mb: 3 }}>
                  Текущий тариф
                </Typography>
                <Box sx={{ mb: 3, p: 2, bgcolor: '#f5f5f5', borderRadius: 2 }}>
                  <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#555', mb: 1 }}>
                    {mockStats.plan}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    1,000,000 токенов в месяц
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Chip label="Приоритетная поддержка" size="small" color="primary" />
                    <Chip label="Все модели" size="small" color="primary" />
                  </Box>
                </Box>
                <ActionButton fullWidth startIcon={<UpgradeOutlined />} sx={{ mb: 1 }}>
                  Сменить тариф
                </ActionButton>
                <ActionButton fullWidth startIcon={<VpnKey />}>
                  API ключи
                </ActionButton>
              </CardContent>
            </StyledCard>
          </Grid>

          {/* Usage Statistics */}
          <Grid item xs={12} md={4}>
            <StyledCard elevation={3}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#555', mb: 3 }}>
                  Статистика использования
                </Typography>
                <Box sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      API вызовов в этом месяце
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600, color: '#00efdf' }}>
                      {mockStats.apiCalls.toLocaleString()}
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={45}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      bgcolor: '#f0f0f0',
                      '& .MuiLinearProgress-bar': {
                        bgcolor: '#00efdf',
                        borderRadius: 4,
                      },
                    }}
                  />
                </Box>
                <Box sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Токенов использовано
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600, color: '#0ff' }}>
                      {mockStats.tokens.used.toLocaleString()}
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={mockStats.tokens.percentage}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      bgcolor: '#f0f0f0',
                      '& .MuiLinearProgress-bar': {
                        bgcolor: '#0ff',
                        borderRadius: 4,
                      },
                    }}
                  />
                </Box>
                <Box
                  sx={{
                    p: 2,
                    bgcolor: '#f5f5f5',
                    borderRadius: 2,
                    border: '1px solid #00efdf',
                  }}
                >
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Средняя стоимость вызова
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#555' }}>
                    608 токенов
                  </Typography>
                </Box>
              </CardContent>
            </StyledCard>
          </Grid>

          {/* Recent API Calls */}
          <Grid item xs={12}>
            <StyledCard elevation={3}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#555' }}>
                    Последние API вызовы
                  </Typography>
                  <Button
                    size="small"
                    sx={{ color: '#00efdf' }}
                    endIcon={<Settings />}
                  >
                    Настройки
                  </Button>
                </Box>
                <TableContainer component={Paper} elevation={0} sx={{ bgcolor: 'transparent' }}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600, color: '#555' }}>Время</TableCell>
                        <TableCell sx={{ fontWeight: 600, color: '#555' }}>Модель</TableCell>
                        <TableCell sx={{ fontWeight: 600, color: '#555' }}>Endpoint</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600, color: '#555' }}>
                          Токены
                        </TableCell>
                        <TableCell align="center" sx={{ fontWeight: 600, color: '#555' }}>
                          Статус
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {mockRecentCalls.map((call) => (
                        <TableRow
                          key={call.id}
                          sx={{
                            '&:hover': {
                              bgcolor: 'rgba(0, 239, 223, 0.05)',
                            },
                            transition: 'background-color 0.2s ease',
                          }}
                        >
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">
                              {call.timestamp}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={call.model}
                              size="small"
                              sx={{
                                bgcolor: '#555',
                                color: '#00efdf',
                                fontWeight: 500,
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                              {call.endpoint}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" sx={{ fontWeight: 600, color: '#555' }}>
                              {call.tokens.toLocaleString()}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              label={call.status === 'success' ? 'Успешно' : 'Ошибка'}
                              size="small"
                              color={call.status === 'success' ? 'success' : 'error'}
                              sx={{ minWidth: 80 }}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
                  <Button sx={{ color: '#00efdf' }}>
                    Показать все вызовы
                  </Button>
                </Box>
              </CardContent>
            </StyledCard>
          </Grid>
        </Grid>
      </Box>
    </MainLayout>
  );
}
