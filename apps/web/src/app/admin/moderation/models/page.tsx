import * as React from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/Table';

export const metadata = { title: 'Модерация моделей — AI-Aggregator' };

interface PendingModelRow {
  id: string;
  slug: string;
  name: string;
  authorUsername: string;
  hostedBy: 'platform' | 'author';
  tierPct: 70 | 75 | 80 | 85;
  endpointUrl: string;
  healthStatus: 'ok' | 'degraded' | 'down' | 'auth_fail' | 'pending';
  submittedAt: string;
  exclusive: boolean;
}

const MOCK_PENDING: PendingModelRow[] = [
  {
    id: 'm1',
    slug: 'medner-ru-v2',
    name: 'MedNER RU v2',
    authorUsername: 'irina-k',
    hostedBy: 'author',
    tierPct: 80,
    endpointUrl: 'https://api.example.com/v1/ner',
    healthStatus: 'ok',
    submittedAt: '2026-04-23T09:00:00Z',
    exclusive: false,
  },
  {
    id: 'm2',
    slug: 'ru-summarizer-lite',
    name: 'RU Summarizer Lite',
    authorUsername: 'pavel-n',
    hostedBy: 'platform',
    tierPct: 70,
    endpointUrl: '(fal pending)',
    healthStatus: 'pending',
    submittedAt: '2026-04-22T19:30:00Z',
    exclusive: false,
  },
  {
    id: 'm3',
    slug: 'banking-tx-classifier',
    name: 'Banking TX Classifier',
    authorUsername: 'alexey-m',
    hostedBy: 'author',
    tierPct: 85,
    endpointUrl: 'https://self-host.example.ru/tx-cls',
    healthStatus: 'auth_fail',
    submittedAt: '2026-04-21T11:15:00Z',
    exclusive: true,
  },
];

const HEALTH_META: Record<
  PendingModelRow['healthStatus'],
  { label: string; variant: 'success' | 'warning' | 'destructive' | 'outline' }
> = {
  ok: { label: 'ok', variant: 'success' },
  degraded: { label: 'degraded', variant: 'warning' },
  down: { label: 'down', variant: 'destructive' },
  auth_fail: { label: 'auth fail', variant: 'destructive' },
  pending: { label: 'pending', variant: 'outline' },
};

export default function AdminModelsModerationPage() {
  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-10 max-w-6xl">
        <h1 className="text-3xl font-bold tracking-tight mb-2">
          Модели на модерацию
        </h1>
        <p className="text-muted-foreground mb-6">
          Review health-check + pricing. Нажмите «Approve» чтобы опубликовать,
          либо «Reject» с причиной (автор получит email).
        </p>

        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Модель</TableHead>
                <TableHead>Автор</TableHead>
                <TableHead>Хостинг</TableHead>
                <TableHead>Tier</TableHead>
                <TableHead>Health</TableHead>
                <TableHead>Дата</TableHead>
                <TableHead>Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {MOCK_PENDING.map((m) => {
                const health = HEALTH_META[m.healthStatus];
                return (
                  <TableRow key={m.id}>
                    <TableCell>
                      <div className="font-medium">{m.name}</div>
                      <div className="text-xs text-muted-foreground font-mono truncate max-w-[18rem]">
                        {m.endpointUrl}
                      </div>
                    </TableCell>
                    <TableCell>@{m.authorUsername}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {m.hostedBy === 'author' ? 'self-host' : 'platform'}
                      </Badge>
                      {m.exclusive && (
                        <Badge variant="default" className="ml-1">
                          exclusive
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>{m.tierPct}%</TableCell>
                    <TableCell>
                      <Badge variant={health.variant as any}>
                        {health.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(m.submittedAt).toLocaleDateString('ru-RU')}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="sm" variant="default">
                          Approve
                        </Button>
                        <Button size="sm" variant="outline">
                          Reject
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {MOCK_PENDING.length === 0 && (
          <div className="py-12 text-center text-muted-foreground">
            Очередь пуста.
          </div>
        )}
      </div>
    </MainLayout>
  );
}
