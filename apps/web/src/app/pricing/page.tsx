'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Check, Sparkles, ArrowRight } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/Button';
import { Switch } from '@/components/ui/Switch';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';

interface Tier {
  name: string;
  monthlyPrice: number;
  yearlyPrice: number;
  tagline: string;
  credits: string;
  features: string[];
  cta: string;
  ctaHref: string;
  isPopular?: boolean;
  isContact?: boolean;
}

// Финальные тарифы из Knowledge/14-pricing-validation.md
const tiers: Tier[] = [
  {
    name: 'Free',
    monthlyPrice: 0,
    yearlyPrice: 0,
    tagline: 'Попробовать без регистрации карты',
    credits: '200 кредитов',
    features: [
      '500 запросов в день',
      '10 запросов в минуту',
      'Доступ к Llama, DeepSeek, gpt-oss',
      'Email-поддержка',
    ],
    cta: 'Начать бесплатно',
    ctaHref: '/register',
  },
  {
    name: 'Basic',
    monthlyPrice: 990,
    yearlyPrice: 9900,
    tagline: 'Для пет-проектов и MVP',
    credits: '1 200 кредитов / мес',
    features: [
      'Все модели платформы',
      '60 запросов в минуту',
      'Webhooks и события',
      'Чат-поддержка в Telegram',
    ],
    cta: 'Выбрать Basic',
    ctaHref: '/register?plan=basic',
  },
  {
    name: 'Starter',
    monthlyPrice: 2490,
    yearlyPrice: 24900,
    tagline: 'Для растущих команд',
    credits: '3 200 кредитов / мес',
    features: [
      'Всё из Basic',
      'Приоритет в роутинге',
      '300 запросов в минуту',
      'BYOK для своих API-ключей',
      'Аналитика расходов',
    ],
    cta: 'Выбрать Starter',
    ctaHref: '/register?plan=starter',
    isPopular: true,
  },
  {
    name: 'Pro',
    monthlyPrice: 6990,
    yearlyPrice: 69900,
    tagline: 'Для продуктовых команд',
    credits: '10 000 кредитов / мес',
    features: [
      'Всё из Starter',
      '500 запросов в минуту',
      'Retention логов 90 дней',
      'Выделенный менеджер',
      'Custom rate-limits',
    ],
    cta: 'Выбрать Pro',
    ctaHref: '/register?plan=pro',
  },
];

function formatPrice(n: number) {
  return n.toLocaleString('ru-RU');
}

export default function PricingPage() {
  const [isYearly, setIsYearly] = useState(false);

  return (
    <MainLayout>
      <section className="container mx-auto max-w-7xl px-4 py-16 md:py-20">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <Badge
            variant="outline"
            className="rounded-full border-primary/40 text-primary px-3 py-1 mb-4"
          >
            Прозрачные тарифы
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            Платите за то, что используете
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Pay-per-request в рублях. Подписки дают бонус-кредиты, повышенный
            rate-limit и приоритет в роутинге. Free-tier — без карты.
          </p>

          <div className="mt-8 inline-flex items-center gap-3 rounded-full border border-border bg-card p-1.5 px-4">
            <span
              className={cn(
                'text-sm transition-colors',
                !isYearly ? 'text-foreground font-medium' : 'text-muted-foreground'
              )}
            >
              Ежемесячно
            </span>
            <Switch checked={isYearly} onCheckedChange={setIsYearly} aria-label="Переключить ежегодную оплату" />
            <span
              className={cn(
                'text-sm transition-colors',
                isYearly ? 'text-foreground font-medium' : 'text-muted-foreground'
              )}
            >
              Ежегодно
            </span>
            <Badge className="ms-1 bg-primary/15 text-primary border-primary/30 hover:bg-primary/15">
              −15%
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {tiers.map((tier) => {
            const displayPrice = isYearly
              ? Math.round(tier.yearlyPrice / 12)
              : tier.monthlyPrice;

            return (
              <div
                key={tier.name}
                className={cn(
                  'relative flex flex-col rounded-2xl border bg-card p-6 transition-all',
                  tier.isPopular
                    ? 'border-primary/60 shadow-[0_0_0_1px_rgba(245,158,11,0.4),0_24px_64px_-16px_rgba(245,158,11,0.25)]'
                    : 'border-border hover:border-primary/30'
                )}
              >
                {tier.isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground border-0 shadow-md">
                      <Sparkles className="me-1 h-3 w-3" /> Популярный
                    </Badge>
                  </div>
                )}

                <div className="mb-1">
                  <h3 className="text-xl font-semibold">{tier.name}</h3>
                  <p className="text-sm text-muted-foreground">{tier.tagline}</p>
                </div>

                <div className="mt-5 mb-2">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-4xl font-bold tracking-tight">
                      {formatPrice(displayPrice)}
                    </span>
                    <span className="text-lg text-muted-foreground">₽</span>
                    <span className="text-sm text-muted-foreground">/мес</span>
                  </div>
                  {isYearly && tier.monthlyPrice > 0 && (
                    <div className="mt-1 text-xs text-muted-foreground">
                      <span className="line-through">
                        {formatPrice(tier.monthlyPrice)} ₽
                      </span>{' '}
                      при годовой оплате
                    </div>
                  )}
                  <div className="mt-3 inline-flex items-center rounded-md border border-primary/20 bg-primary/5 px-2.5 py-1 text-xs font-mono text-primary">
                    {tier.credits}
                  </div>
                </div>

                <ul className="mt-5 space-y-2.5 flex-1">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <span className="text-foreground/90">{f}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  asChild
                  className="mt-6 w-full"
                  variant={tier.isPopular ? 'default' : 'outline'}
                  size="lg"
                >
                  <Link href={tier.ctaHref}>
                    {tier.cta}
                    <ArrowRight className="ms-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            );
          })}
        </div>

        {/* Enterprise / Business contact */}
        <div className="mt-10 rounded-2xl border border-border bg-card/60 p-8 md:p-10 flex flex-col md:flex-row md:items-center gap-6">
          <div className="flex-1">
            <h3 className="text-xl md:text-2xl font-semibold">
              Business / Enterprise
            </h3>
            <p className="text-muted-foreground mt-2">
              SLA 99.5%, выделенные ресурсы, счёт юрлицу, кастомные SLA и
              roadmap. От 29 900 ₽/мес.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button asChild size="lg" variant="outline">
              <a href="mailto:team@ai-aggregator.ru?subject=Business plan">
                Обсудить условия
              </a>
            </Button>
            <Button asChild size="lg" variant="ghost">
              <Link href="/docs">Посмотреть docs</Link>
            </Button>
          </div>
        </div>

        <p className="mt-10 text-center text-sm text-muted-foreground">
          Все тарифы включают доступ к OpenAI-совместимому API, RU-residency
          для критичных моделей и оплату в рублях.
        </p>
      </section>
    </MainLayout>
  );
}
