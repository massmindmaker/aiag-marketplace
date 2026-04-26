import * as React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import MainLayout from '@/components/layout/MainLayout';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { formatPrice, formatNumber, formatDate } from '@aiag/shared';

// MVP: mock — заменяется на SELECT * FROM contests в Task 22.
const MOCK_CONTESTS_BY_SLUG: Record<string, any> = {
  'launch-banking-tx': {
    slug: 'launch-banking-tx',
    name: 'Классификация банковских транзакций',
    description:
      'Определите категорию транзакции по описанию платежа. Используйте обучающую выборку с 250k размеченных примеров. F1-score на private split.',
    evalMetric: 'F1 macro',
    datasetSizeMb: 120,
    rules:
      'Не используйте внешние данные. Максимум 20 сабмитов в день на участника. Призы выплачиваются в течение 14 дней после завершения.',
    sponsorName: 'Банк пример',
    prizePoolRub: 500_000,
    prizeBreakdown: [
      { place: 1, amount: 300_000, extra: 'Публикация модели 75% revshare' },
      { place: 2, amount: 150_000 },
      { place: 3, amount: 50_000 },
    ],
    participantsCount: 142,
    submissionsCount: 892,
    startsAt: new Date('2026-04-15T00:00:00Z'),
    endsAt: new Date('2026-06-15T00:00:00Z'),
    status: 'open',
  },
  'ru-doc-summarization': {
    slug: 'ru-doc-summarization',
    name: 'Резюмирование русских документов',
    description:
      'Сжатое описание юридических документов объёмом 5–15 страниц. Метрика — ROUGE-L.',
    evalMetric: 'ROUGE-L',
    datasetSizeMb: 340,
    rules: 'Нельзя использовать закрытые коммерческие API (GPT-4, Claude).',
    sponsorName: null,
    prizePoolRub: 250_000,
    prizeBreakdown: [
      { place: 1, amount: 150_000 },
      { place: 2, amount: 70_000 },
      { place: 3, amount: 30_000 },
    ],
    participantsCount: 37,
    submissionsCount: 82,
    startsAt: new Date('2026-05-01T00:00:00Z'),
    endsAt: new Date('2026-07-01T00:00:00Z'),
    status: 'upcoming',
  },
  'ru-ner-medical': {
    slug: 'ru-ner-medical',
    name: 'NER для медицинских текстов',
    description:
      'Извлечение сущностей (симптомы, диагнозы, препараты) из анамнезов. F1 macro.',
    evalMetric: 'F1 macro',
    datasetSizeMb: 55,
    rules: 'Обязательна деидентификация данных перед использованием.',
    sponsorName: 'HealthTech RU',
    prizePoolRub: 1_000_000,
    prizeBreakdown: [
      { place: 1, amount: 600_000 },
      { place: 2, amount: 300_000 },
      { place: 3, amount: 100_000 },
    ],
    participantsCount: 284,
    submissionsCount: 1_842,
    startsAt: new Date('2026-01-15T00:00:00Z'),
    endsAt: new Date('2026-04-01T00:00:00Z'),
    status: 'completed',
  },
};

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}) {
  const c = MOCK_CONTESTS_BY_SLUG[params.slug];
  if (!c) return { title: 'Конкурс не найден' };
  return {
    title: `${c.name} — AI-Aggregator`,
    description: c.description,
  };
}

export default function ContestDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const c = MOCK_CONTESTS_BY_SLUG[params.slug];
  if (!c) notFound();

  const isOpen = c.status === 'open' || c.status === 'active';

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-10 max-w-6xl">
        {/* Hero */}
        <section className="mb-8">
          <div className="aspect-[16/5] w-full overflow-hidden rounded-lg bg-gradient-to-br from-primary/20 via-primary/10 to-background flex items-center justify-center mb-6">
            <span className="text-8xl opacity-30">🏆</span>
          </div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <Badge variant={isOpen ? 'default' : 'secondary'}>
              {isOpen
                ? 'Приём работ'
                : c.status === 'upcoming'
                  ? 'Скоро'
                  : 'Завершён'}
            </Badge>
            {c.sponsorName && <Badge variant="outline">{c.sponsorName}</Badge>}
            <Badge variant="outline">Метрика: {c.evalMetric}</Badge>
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-2">{c.name}</h1>
          <p className="text-lg text-muted-foreground max-w-3xl">
            {c.description}
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 p-4 rounded-lg border bg-muted/30">
            <Stat label="Призовой фонд" value={formatPrice(c.prizePoolRub)} />
            <Stat label="Участники" value={formatNumber(c.participantsCount)} />
            <Stat label="Сабмитов" value={formatNumber(c.submissionsCount)} />
            <Stat label="Завершение" value={formatDate(c.endsAt)} />
          </div>

          <div className="flex flex-wrap gap-3 mt-6">
            {isOpen && (
              <Button asChild size="lg">
                <Link href={`/contests/${c.slug}/register`}>
                  Участвовать
                </Link>
              </Button>
            )}
            <Button asChild variant="outline" size="lg">
              <Link href={`/contests/${c.slug}/leaderboard`}>Leaderboard</Link>
            </Button>
          </div>
        </section>

        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Обзор</TabsTrigger>
            <TabsTrigger value="data">Данные</TabsTrigger>
            <TabsTrigger value="rules">Правила</TabsTrigger>
            <TabsTrigger value="prizes">Призы</TabsTrigger>
            <TabsTrigger value="discussion">Обсуждение</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6 prose dark:prose-invert max-w-none">
            <p>{c.description}</p>
            <p>
              Метрика оценки — <strong>{c.evalMetric}</strong>. Public leaderboard
              считается на 20% тестовой выборки; финальный private score — на
              оставшихся 80% после закрытия приёма работ.
            </p>
          </TabsContent>

          <TabsContent value="data" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Датасет конкурса</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Размер публичной части: <strong>{c.datasetSizeMb} MB</strong>.
                  Формат — CSV с колонками <code>id, text, label</code>.
                </p>
                <p className="text-xs text-muted-foreground">
                  Лимит скачиваний — 10 на участника, 5 GB трафика. Регистрация
                  на конкурс обязательна.
                </p>
                <Button disabled variant="secondary" size="sm">
                  Скачать (требуется регистрация)
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="rules" className="mt-6 prose dark:prose-invert max-w-none">
            <p>{c.rules}</p>
            <ul>
              <li>Максимум 20 submissions в день</li>
              <li>Максимум 5 одновременных (pending) evaluations</li>
              <li>Запрещено использование private test set</li>
              <li>Победитель обязуется подписать договор в течение 10 дней</li>
            </ul>
          </TabsContent>

          <TabsContent value="prizes" className="mt-6">
            <div className="space-y-3">
              {c.prizeBreakdown.map(
                (p: { place: number; amount: number; extra?: string }) => (
                  <Card key={p.place}>
                    <CardContent className="pt-6 flex items-center justify-between">
                      <div>
                        <div className="text-sm text-muted-foreground">
                          {p.place} место
                        </div>
                        <div className="text-2xl font-bold">
                          {formatPrice(p.amount)}
                        </div>
                        {p.extra && (
                          <div className="text-sm text-primary mt-1">
                            + {p.extra}
                          </div>
                        )}
                      </div>
                      <div className="text-4xl">
                        {['🥇', '🥈', '🥉'][p.place - 1] ?? '🎖'}
                      </div>
                    </CardContent>
                  </Card>
                )
              )}
            </div>
          </TabsContent>

          <TabsContent value="discussion" className="mt-6">
            <div className="py-12 text-center text-muted-foreground border rounded-lg">
              Обсуждения скоро будут доступны (Phase 2).
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className="font-semibold mt-1">{value}</div>
    </div>
  );
}
