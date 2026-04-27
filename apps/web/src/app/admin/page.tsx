import * as React from 'react';
import Link from 'next/link';
import { db, sql } from '@/lib/db';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

export const metadata = { title: 'Админка — AI-Aggregator' };
export const dynamic = 'force-dynamic';

async function getCounts() {
  // Best-effort — fall back to zeros if DB not available (build-time, etc.)
  try {
    const [models, users, contests, payments, submissions] = await Promise.all([
      db.execute(sql`SELECT COUNT(*)::int AS c FROM models`),
      db.execute(sql`SELECT COUNT(*)::int AS c FROM users`),
      db.execute(sql`SELECT COUNT(*)::int AS c FROM contests`),
      db.execute(sql`SELECT COUNT(*)::int AS c FROM payments`),
      db.execute(sql`SELECT COUNT(*)::int AS c FROM submissions`),
    ]);
    const get = (r: unknown): number => {
      // drizzle pg returns { rows: [{ c: N }] }, neon returns array directly
      // Normalise both shapes.
      const rows = (r as { rows?: Array<{ c: number }> }).rows ??
        (r as Array<{ c: number }>);
      return rows?.[0]?.c ?? 0;
    };
    return {
      models: get(models),
      users: get(users),
      contests: get(contests),
      payments: get(payments),
      submissions: get(submissions),
    };
  } catch {
    return { models: 0, users: 0, contests: 0, payments: 0, submissions: 0 };
  }
}

export default async function AdminHomePage() {
  const counts = await getCounts();

  const cards = [
    { title: 'Моделей в реестре', value: counts.models, href: '/admin/models' },
    { title: 'Пользователей', value: counts.users, href: '/admin/users' },
    { title: 'Контестов', value: counts.contests, href: '/admin/contests' },
    { title: 'Платежей', value: counts.payments, href: '/admin/payments' },
    { title: 'Сабмишенов', value: counts.submissions, href: '/admin/moderation/submissions' },
  ];

  const queues = [
    {
      slug: 'models',
      title: 'Модели на модерацию',
      count: 3,
      href: '/admin/moderation/models',
      description: 'Request-to-publish — review endpoint + pricing',
    },
    {
      slug: 'submissions',
      title: 'Flagged submissions',
      count: 2,
      href: '/admin/moderation/submissions',
      description: 'Overfitting / virus / manual flags',
    },
  ];

  return (
    <div className="container mx-auto px-4 py-10 max-w-6xl">
      <h1 className="text-3xl font-bold tracking-tight mb-6">Админка</h1>

      <h2 className="text-lg font-semibold mb-3">Обзор</h2>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-10">
        {cards.map((c) => (
          <Link key={c.title} href={c.href}>
            <Card className="hover:border-primary transition-colors h-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-normal text-muted-foreground">
                  {c.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{c.value}</div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <h2 className="text-lg font-semibold mb-3">Очереди модерации</h2>
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
  );
}
