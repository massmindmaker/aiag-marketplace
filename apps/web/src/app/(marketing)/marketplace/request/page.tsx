import type { Metadata } from 'next';
import Link from 'next/link';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/Button';
import { ArrowLeft } from 'lucide-react';
import { ModelRequestForm } from '@/components/marketplace/ModelRequestForm';

export const metadata: Metadata = {
  title: 'Запросить добавление модели — AI Aggregator',
  description:
    'Не нашли нужную модель в каталоге? Предложите её команде AI Aggregator. Рассмотрим заявку и добавим популярные модели в течение 2-4 недель.',
  alternates: { canonical: '/marketplace/request' },
};

export default function RequestModelPage() {
  return (
    <MainLayout>
      <section className="container mx-auto max-w-3xl px-4 py-6 md:py-10">
        <Button
          variant="ghost"
          size="sm"
          asChild
          leftIcon={<ArrowLeft className="h-4 w-4" />}
          className="mb-4"
        >
          <Link href="/marketplace">Каталог моделей</Link>
        </Button>

        <header className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            Запросить модель
          </h1>
          <p className="text-muted-foreground mt-2">
            Какую модель вам не хватает в каталоге? Расскажите — и мы рассмотрим
            добавление в течение 2-4 недель.
          </p>
        </header>

        <ModelRequestForm />
      </section>
    </MainLayout>
  );
}
