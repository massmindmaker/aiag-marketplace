import Link from 'next/link';
import type { Metadata } from 'next';
import {
  ArrowRight,
  Boxes,
  Trophy,
  Wallet,
  ShieldCheck,
  Zap,
  Code2,
  Send,
  Mail,
} from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import HeroAnimation from '@/components/HeroAnimation';

export const metadata: Metadata = {
  title: 'AI Aggregator — Маркетплейс AI-моделей с API в рублях',
  description:
    'Любая AI-модель. Один API. Оплата в рублях. GPT, Claude, YandexGPT, GigaChat, Stable Diffusion, Whisper — без VPN, с RU-residency.',
};

const features = [
  {
    icon: Boxes,
    title: 'Маркетплейс моделей',
    text: 'Десятки моделей через единый OpenAI-совместимый API: GPT, Claude, YandexGPT, GigaChat, Llama, Flux, Whisper, Veo.',
    cta: { label: 'Открыть каталог', href: '/marketplace' },
  },
  {
    icon: Trophy,
    title: 'ML-конкурсы',
    text: 'Победители публикуют модели в маркетплейсе и получают 70% с подписок. Постоянный приток свежих решений от сообщества.',
    cta: { label: 'К конкурсам', href: '/contests' },
  },
  {
    icon: Wallet,
    title: 'Оплата в рублях',
    text: 'T-Bank, СБП, ЮKassa, счёт юрлицу. Без VPN и валютных комиссий. Прозрачный pay-per-request — никаких скрытых лимитов.',
    cta: { label: 'Тарифы', href: '/pricing' },
  },
];

const valueProps = [
  {
    icon: ShieldCheck,
    title: '152-ФЗ и RU-residency',
    text: 'Open-source модели хостим в РФ. Shield-RF бэйдж — для критичных данных.',
  },
  {
    icon: Zap,
    title: 'Низкая задержка',
    text: 'Роутинг через ближайший регион РФ. Стабильно < 200мс до first-token.',
  },
  {
    icon: Code2,
    title: 'OpenAI-совместимо',
    text: 'Поменяйте baseURL — и существующий код продолжит работать.',
  },
];

export default function HomePage() {
  return (
    <MainLayout>
      {/* HERO */}
      <section className="relative overflow-hidden border-b border-border">
        {/* Layer 1: cellular automaton (Brian's Brain) */}
        <HeroAnimation className="pointer-events-none absolute inset-0 -z-30" />
        {/* Layer 2: gradient + grid backdrop */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-20"
        >
          <div
            className="absolute inset-0 opacity-[0.35]"
            style={{
              backgroundImage:
                'radial-gradient(ellipse 60% 50% at 50% 0%, rgba(245,158,11,0.18), transparent 60%), radial-gradient(ellipse 80% 60% at 80% 100%, rgba(245,158,11,0.10), transparent 70%)',
            }}
          />
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage:
                'linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)',
              backgroundSize: '64px 64px',
              maskImage:
                'radial-gradient(ellipse at center, black 20%, transparent 70%)',
            }}
          />
        </div>
        {/* Layer 3: radial vignette to keep hero text legible above the CA */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            background:
              'radial-gradient(ellipse 70% 65% at 25% 50%, rgba(10,10,11,0) 0%, rgba(10,10,11,0.85) 70%), linear-gradient(135deg, rgba(10,10,11,0.25) 0%, rgba(10,10,11,0.9) 100%)',
          }}
        />

        <div className="container mx-auto max-w-6xl px-4 py-20 md:py-28 lg:py-32">
          <div className="flex flex-col items-start gap-6 max-w-3xl">
            <Badge
              variant="outline"
              className="rounded-full border-primary/40 text-primary px-3 py-1 text-xs font-mono"
            >
              <span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              Russian Replicate × Russian Kaggle
            </Badge>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.05]">
              Любая AI-модель.{' '}
              <span className="bg-gradient-to-r from-amber-300 via-primary to-amber-600 bg-clip-text text-transparent">
                Один API.
              </span>
              <br />
              Оплата в рублях.
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl">
              GPT, Claude, YandexGPT, GigaChat, Stable Diffusion, Whisper и
              ещё десятки моделей. Без VPN, с RU-residency, 152-ФЗ. Pay
              per-request — платите только за то, что используете.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mt-2">
              <Button asChild size="lg" className="font-semibold">
                <Link href="/marketplace">
                  Открыть каталог моделей{' '}
                  <ArrowRight className="ms-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/register">Создать аккаунт</Link>
              </Button>
            </div>

            {/* Code-snippet teaser */}
            <div className="mt-8 w-full max-w-2xl rounded-lg border border-border bg-card/60 backdrop-blur p-4 font-mono text-xs md:text-sm overflow-x-auto">
              <div className="flex items-center gap-2 mb-3 text-muted-foreground">
                <span className="h-2.5 w-2.5 rounded-full bg-red-500/60" />
                <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/60" />
                <span className="h-2.5 w-2.5 rounded-full bg-green-500/60" />
                <span className="ms-2 text-[11px]">first-request.sh</span>
              </div>
              <pre className="text-foreground/90 whitespace-pre">
{`$ curl https://api.ai-aggregator.ru/v1/chat/completions \\
    -H "Authorization: Bearer $AIAG_KEY" \\
    -d '{"model":"gpt-4o-mini","messages":[
      {"role":"user","content":"Привет"}
    ]}'`}
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* VALUE PROPS strip */}
      <section className="border-b border-border bg-background">
        <div className="container mx-auto max-w-6xl px-4 py-10 grid grid-cols-1 md:grid-cols-3 gap-6">
          {valueProps.map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-primary/30 bg-primary/10 text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <div className="font-semibold text-foreground">{title}</div>
                <p className="text-sm text-muted-foreground mt-0.5">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES — 3 main */}
      <section className="container mx-auto max-w-6xl px-4 py-20 md:py-24">
        <div className="mb-12 max-w-2xl">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
            Три продукта в одной платформе
          </h2>
          <p className="text-muted-foreground mt-3 text-lg">
            Маркетплейс закрывает спрос. Конкурсы решают chicken-and-egg
            проблему предложения. Оплата в рублях снимает барьер на входе для
            российских команд.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map(({ icon: Icon, title, text, cta }) => (
            <div
              key={title}
              className="group relative flex flex-col rounded-xl border border-border bg-card p-6 transition-all hover:border-primary/40 hover:shadow-[0_0_0_1px_rgba(245,158,11,0.2),0_8px_32px_-8px_rgba(245,158,11,0.15)]"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-primary/30 bg-primary/10 text-primary mb-5">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{title}</h3>
              <p className="text-muted-foreground text-sm flex-1">{text}</p>
              <Link
                href={cta.href}
                className="mt-5 inline-flex items-center text-sm font-medium text-primary hover:underline"
              >
                {cta.label}{' '}
                <ArrowRight className="ms-1 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="border-t border-border bg-gradient-to-b from-background via-background to-card/40">
        <div className="container mx-auto max-w-4xl px-4 py-20 md:py-24 text-center">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
            Подключите модели за{' '}
            <span className="text-primary">2 минуты</span>
          </h2>
          <p className="text-muted-foreground mt-4 text-lg max-w-2xl mx-auto">
            Регистрация занимает минуту. Free-tier даёт 200 кредитов на
            тесты. Платёж в рублях, без VPN, без валютных комиссий.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button asChild size="lg" className="font-semibold">
              <Link href="/register">
                Начать бесплатно <ArrowRight className="ms-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="ghost">
              <Link href="/docs">Посмотреть документацию</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-border bg-background">
        <div className="container mx-auto max-w-6xl px-4 py-10 grid grid-cols-2 md:grid-cols-4 gap-8 text-sm">
          <div className="col-span-2">
            <div className="font-mono font-bold text-foreground">
              ai-aggregator<span className="text-primary">.ru</span>
            </div>
            <p className="text-muted-foreground mt-2 max-w-xs">
              Маркетплейс AI-моделей с API в рублях. ИП, РФ. 152-ФЗ
              compliant.
            </p>
            <div className="mt-4 flex items-center gap-3">
              <a
                href="https://t.me/aiaggregatorsupport"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Telegram"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <Send className="h-5 w-5" />
              </a>
              <a
                href="mailto:team@ai-aggregator.ru"
                aria-label="Email"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <Mail className="h-5 w-5" />
              </a>
            </div>
          </div>
          <div>
            <div className="font-semibold text-foreground mb-3">Продукт</div>
            <ul className="space-y-2 text-muted-foreground">
              <li><Link href="/marketplace" className="hover:text-foreground">Маркетплейс</Link></li>
              <li><Link href="/pricing" className="hover:text-foreground">Тарифы</Link></li>
              <li><Link href="/docs" className="hover:text-foreground">Документация</Link></li>
              <li><Link href="/contests" className="hover:text-foreground">Конкурсы</Link></li>
            </ul>
          </div>
          <div>
            <div className="font-semibold text-foreground mb-3">Правовое</div>
            <ul className="space-y-2 text-muted-foreground">
              <li><Link href="/privacy" className="hover:text-foreground">Конфиденциальность</Link></li>
              <li><Link href="/terms" className="hover:text-foreground">Условия</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-border">
          <div className="container mx-auto max-w-6xl px-4 py-5 text-xs text-muted-foreground flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <span>© {new Date().getFullYear()} AI Aggregator</span>
            <span className="font-mono">team@ai-aggregator.ru · @aiaggregatorsupport</span>
          </div>
        </div>
      </footer>
    </MainLayout>
  );
}
