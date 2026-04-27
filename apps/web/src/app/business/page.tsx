import Link from 'next/link';
import type { Metadata } from 'next';
import MainLayout from '@/components/layout/MainLayout';

export const metadata: Metadata = {
  title: 'Для бизнеса — AI-Aggregator',
  description:
    'AI-Aggregator для бизнеса: договор с ИП/ООО, УПД, счёт, NDA, on-premise, выделенные ключи и SLA 99.9%.',
};

export default function BusinessPage() {
  return (
    <MainLayout>
      <section style={{ padding: '96px 20px', maxWidth: 880, margin: '0 auto' }}>
        <div
          className="font-mono uppercase mb-3.5"
          style={{
            fontSize: 11,
            color: 'var(--accent)',
            letterSpacing: '0.12em',
          }}
        >
          // Для бизнеса
        </div>
        <h1
          className="font-bold"
          style={{
            fontSize: 'clamp(36px, 5vw, 56px)',
            lineHeight: 1.05,
            letterSpacing: '-0.025em',
            margin: '0 0 24px',
          }}
        >
          AI-инфраструктура для команд и юрлиц
        </h1>
        <p
          style={{
            fontSize: 18,
            color: 'var(--ink-muted)',
            lineHeight: 1.6,
            marginBottom: 40,
          }}
        >
          Договор с ИП/ООО, УПД, счёт. NDA и 152-ФЗ. On-premise по запросу.
          Выделенные API-ключи, кастомные rate-limits, dedicated support в
          Slack/Telegram. SLA 99.9% с компенсацией.
        </p>

        <div className="flex gap-3.5 flex-wrap">
          <a
            href="mailto:team@ai-aggregator.ru?subject=Запрос%20договора%20—%20AI-Aggregator"
            className="inline-flex items-center gap-2 font-semibold rounded-sm hover:-translate-y-px transition-all"
            style={{
              padding: '14px 24px',
              fontSize: 15,
              background: 'var(--accent)',
              color: '#000',
              border: '1px solid var(--accent)',
            }}
          >
            Запросить договор →
          </a>
          <Link
            href="/pricing"
            className="inline-flex items-center gap-2 font-semibold rounded-sm hover:bg-white/[0.04] transition-colors"
            style={{
              padding: '14px 24px',
              fontSize: 15,
              background: 'transparent',
              color: 'var(--ink)',
              border: '1px solid var(--line)',
            }}
          >
            Тарифы
          </Link>
        </div>
      </section>
    </MainLayout>
  );
}
