import Link from 'next/link';

export const metadata = { title: 'Условия использования — AI-Aggregator' };

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-3xl px-6 py-12">
        <nav className="mb-8 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground">
            ← На главную
          </Link>
        </nav>
        <article className="prose prose-invert max-w-none">
          <h1 className="text-3xl font-bold mb-4">
            Условия использования (оферта)
          </h1>
          <p className="mb-6 text-muted-foreground">
            Редакция от 2026-04-18. Оператор: ИП Боборов, ОГРНИП 0000000000.
          </p>

          <h2 className="text-xl font-semibold mt-8 mb-3">1. Предмет оферты</h2>
          <p className="mb-4">
            Использование сервиса AI-Aggregator (далее — «Сервис») для доступа
            к API моделей искусственного интеллекта означает безоговорочное
            принятие условий настоящей оферты.
          </p>

          <h2 className="text-xl font-semibold mt-8 mb-3">
            2. Полная редакция оферты
          </h2>
          <p className="mb-4">
            Полный текст публичной оферты будет опубликован в Plan 08 после
            юридической экспертизы. Текущая редакция — стартовая заглушка
            для покрытия требований 152-ФЗ и согласия пользователя на этапе
            регистрации.
          </p>

          <h2 className="text-xl font-semibold mt-8 mb-3">
            3. Связь с политикой обработки ПДн
          </h2>
          <p className="mb-4">
            Условия обработки персональных данных регулируются{' '}
            <Link
              href="/privacy"
              className="text-primary underline-offset-4 hover:underline"
            >
              Политикой обработки ПДн
            </Link>
            , которая является неотъемлемой частью настоящей оферты.
          </p>

          <p className="mt-10 text-xs text-muted-foreground">
            Эта страница — стартовая версия. Финальная оферта — Plan 08.
          </p>
        </article>
      </div>
    </main>
  );
}
