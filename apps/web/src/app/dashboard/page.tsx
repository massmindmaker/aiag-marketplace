'use client';

import Link from 'next/link';
import {
  Wallet,
  TrendingUp,
  Zap,
  Stars,
  Plus,
  KeyRound,
  ArrowUpRight,
  RefreshCw,
} from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Progress } from '@/components/ui/Progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/Table';

const stats = {
  credits: { used: 750, total: 1200, percent: Math.round((750 / 1200) * 100) },
  apiCalls: 1234,
  activeModels: 3,
  plan: 'Starter',
};

const recentCalls = [
  {
    id: 1,
    timestamp: '2026-04-26 14:23:15',
    model: 'gpt-4o-mini',
    tokens: 1250,
    status: 'success',
    endpoint: '/v1/chat/completions',
  },
  {
    id: 2,
    timestamp: '2026-04-26 14:15:42',
    model: 'claude-sonnet-4',
    tokens: 890,
    status: 'success',
    endpoint: '/v1/chat/completions',
  },
  {
    id: 3,
    timestamp: '2026-04-26 13:58:30',
    model: 'gpt-4o-mini',
    tokens: 450,
    status: 'success',
    endpoint: '/v1/chat/completions',
  },
  {
    id: 4,
    timestamp: '2026-04-26 13:42:18',
    model: 'flux-1.1-pro',
    tokens: 2100,
    status: 'error',
    endpoint: '/v1/images/generations',
  },
  {
    id: 5,
    timestamp: '2026-04-26 13:30:05',
    model: 'yandexgpt-pro',
    tokens: 1680,
    status: 'success',
    endpoint: '/v1/chat/completions',
  },
];

function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  children,
}: {
  label: string;
  value: string;
  hint?: string;
  icon: React.ComponentType<{ className?: string }>;
  children?: React.ReactNode;
}) {
  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-sm text-muted-foreground">{label}</div>
            <div className="mt-2 text-3xl font-bold tracking-tight">
              {value}
            </div>
            {hint && (
              <div className="mt-1 text-xs text-muted-foreground">{hint}</div>
            )}
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-primary/30 bg-primary/10 text-primary">
            <Icon className="h-5 w-5" />
          </div>
        </div>
        {children && <div className="mt-4">{children}</div>}
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  return (
    <MainLayout>
      <section className="container mx-auto max-w-7xl px-4 py-8 md:py-12">
        {/* Header */}
        <header className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
              Личный кабинет
            </h1>
            <p className="text-muted-foreground mt-1">
              Обзор расходов, баланса и последних запросов
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" leftIcon={<KeyRound className="h-4 w-4" />}>
              API-ключи
            </Button>
            <Button leftIcon={<Plus className="h-4 w-4" />}>Пополнить</Button>
          </div>
        </header>

        {/* Stats grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            label="Кредиты"
            value={stats.credits.used.toLocaleString('ru-RU')}
            hint={`из ${stats.credits.total.toLocaleString('ru-RU')} в этом месяце`}
            icon={Wallet}
          >
            <Progress value={stats.credits.percent} className="h-1.5" />
          </StatCard>

          <StatCard
            label="API-вызовы"
            value={stats.apiCalls.toLocaleString('ru-RU')}
            hint="за этот месяц"
            icon={TrendingUp}
          >
            <div className="flex items-center text-xs text-primary">
              <ArrowUpRight className="me-1 h-3.5 w-3.5" />
              +12.5% к прошлому месяцу
            </div>
          </StatCard>

          <StatCard
            label="Активные модели"
            value={String(stats.activeModels)}
            hint="используете сейчас"
            icon={Zap}
          >
            <div className="flex flex-wrap gap-1.5">
              <Badge variant="secondary" className="font-mono text-xs">gpt-4o</Badge>
              <Badge variant="secondary" className="font-mono text-xs">claude</Badge>
              <Badge variant="secondary" className="font-mono text-xs">flux</Badge>
            </div>
          </StatCard>

          <StatCard
            label="Тариф"
            value={stats.plan}
            hint="активен до 31.05.2026"
            icon={Stars}
          >
            <Button asChild variant="ghost" size="sm" className="-ms-3 text-primary">
              <Link href="/pricing">
                Сменить тариф <ArrowUpRight className="ms-1 h-3.5 w-3.5" />
              </Link>
            </Button>
          </StatCard>
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <Card className="lg:col-span-2">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-semibold">Последние API-вызовы</h2>
                <Button variant="ghost" size="sm" leftIcon={<RefreshCw className="h-3.5 w-3.5" />}>
                  Обновить
                </Button>
              </div>
              <div className="overflow-x-auto -mx-2">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Время</TableHead>
                      <TableHead>Модель</TableHead>
                      <TableHead>Endpoint</TableHead>
                      <TableHead className="text-end">Токены</TableHead>
                      <TableHead className="text-center">Статус</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentCalls.map((call) => (
                      <TableRow key={call.id}>
                        <TableCell className="font-mono text-xs text-muted-foreground whitespace-nowrap">
                          {call.timestamp}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="font-mono">
                            {call.model}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {call.endpoint}
                        </TableCell>
                        <TableCell className="text-end tabular-nums">
                          {call.tokens.toLocaleString('ru-RU')}
                        </TableCell>
                        <TableCell className="text-center">
                          {call.status === 'success' ? (
                            <Badge className="bg-green-500/15 text-green-400 border-green-500/30 hover:bg-green-500/15">
                              OK
                            </Badge>
                          ) : (
                            <Badge variant="destructive">Ошибка</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="mt-4 text-center">
                <Button asChild variant="ghost" size="sm">
                  <Link href="#">Показать все вызовы</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold mb-1">Текущий тариф</h2>
              <div className="text-3xl font-bold mt-3 mb-1">
                {stats.plan}
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                3 200 кредитов / мес · 300 RPM · приоритет в роутинге
              </p>
              <div className="flex flex-wrap gap-1.5 mb-5">
                <Badge variant="secondary">Все модели</Badge>
                <Badge variant="secondary">Webhooks</Badge>
                <Badge variant="secondary">BYOK</Badge>
              </div>
              <div className="space-y-2">
                <Button asChild className="w-full">
                  <Link href="/pricing">Сменить тариф</Link>
                </Button>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/docs">Документация</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </MainLayout>
  );
}
