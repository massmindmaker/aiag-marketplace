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

export const metadata = { title: 'Flagged submissions — AI-Aggregator' };

interface FlagRow {
  id: string;
  contestSlug: string;
  contestName: string;
  authorUsername: string;
  reason: 'overfit' | 'virus' | 'invalid' | 'manual_flag';
  scorePublic: number;
  scorePrivate: number;
  createdAt: string;
  status: 'open' | 'dismissed' | 'invalidated';
}

const MOCK_FLAGS: FlagRow[] = [
  {
    id: 'f1',
    contestSlug: 'launch-banking-tx',
    contestName: 'Классификация банковских транзакций',
    authorUsername: 'test-user',
    reason: 'overfit',
    scorePublic: 0.95,
    scorePrivate: 0.62,
    createdAt: '2026-04-22T16:00:00Z',
    status: 'open',
  },
  {
    id: 'f2',
    contestSlug: 'launch-banking-tx',
    contestName: 'Классификация банковских транзакций',
    authorUsername: 'another',
    reason: 'virus',
    scorePublic: 0,
    scorePrivate: 0,
    createdAt: '2026-04-23T02:45:00Z',
    status: 'open',
  },
];

const REASON_META: Record<FlagRow['reason'], { label: string; variant: 'destructive' | 'warning' | 'outline' }> = {
  overfit: { label: 'Overfit', variant: 'warning' },
  virus: { label: 'Virus', variant: 'destructive' },
  invalid: { label: 'Invalid', variant: 'destructive' },
  manual_flag: { label: 'Manual', variant: 'outline' },
};

export default function AdminFlaggedSubmissionsPage() {
  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-10 max-w-6xl">
        <h1 className="text-3xl font-bold tracking-tight mb-2">
          Flagged submissions
        </h1>
        <p className="text-muted-foreground mb-6">
          Автоматические флаги от eval-runner (overfit, virus, schema) +
          ручные пометки от админов.
        </p>

        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Конкурс</TableHead>
                <TableHead>Автор</TableHead>
                <TableHead>Причина</TableHead>
                <TableHead className="text-right">Public</TableHead>
                <TableHead className="text-right">Private</TableHead>
                <TableHead>Дата</TableHead>
                <TableHead>Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {MOCK_FLAGS.map((f) => {
                const meta = REASON_META[f.reason];
                return (
                  <TableRow key={f.id}>
                    <TableCell>{f.contestName}</TableCell>
                    <TableCell>@{f.authorUsername}</TableCell>
                    <TableCell>
                      <Badge variant={meta.variant as any}>{meta.label}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {f.scorePublic.toFixed(4)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {f.scorePrivate.toFixed(4)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(f.createdAt).toLocaleDateString('ru-RU')}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        <Button size="sm" variant="outline">
                          Dismiss
                        </Button>
                        <Button size="sm" variant="destructive">
                          Invalidate
                        </Button>
                        <Button size="sm" variant="ghost">
                          Warn author
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </MainLayout>
  );
}
