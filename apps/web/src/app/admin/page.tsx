import * as React from 'react';
import Link from 'next/link';
import MainLayout from '@/components/layout/MainLayout';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

export const metadata = { title: 'Админка — AI-Aggregator' };

/**
 * Plan 07 Task 14: admin moderation queue landing.
 * Shows pending counts for contests, submissions, models, payouts.
 */
export default function AdminHomePage() {
  // TODO Task 22: real counts from DB (pending_review contests, review models,
  // flagged submissions, requested payouts).
  const queues = [
    {
      slug: 'contests',
      title: 'Контесты на ревью',
      count: 1,
      href: '/admin/contests?status=pending_review',
      description: 'B2B brief / custom eval scripts, требующие approval',
    },
    {
      slug: 'models',
      title: 'Модели на модерацию',
      count: 3,
      href: '/admin/moderation/models',
      description: 'Request-to-publish: review endpoint + pricing',
    },
    {
      slug: 'submissions',
      title: 'Flagged submissions',
      count: 2,
      href: '/admin/moderation/submissions',
      description: 'Overfitting / virus / manual flags',
    },
    {
      slug: 'payouts',
      title: 'Выплаты',
      count: 0,
      href: '/admin/payouts',
      description: 'Запрошенные автором выплаты',
    },
  ];

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-10 max-w-5xl">
        <h1 className="text-3xl font-bold tracking-tight mb-6">Админка</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {queues.map((q) => (
            <Link key={q.slug} href={q.href} className="block">
              <Card className="hover:border-primary transition-colors h-full">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>{q.title}</CardTitle>
                    <Badge
                      variant={q.count > 0 ? 'default' : 'outline'}
                      className="min-w-[2rem] justify-center"
                    >
                      {q.count}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  {q.description}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </MainLayout>
  );
}
