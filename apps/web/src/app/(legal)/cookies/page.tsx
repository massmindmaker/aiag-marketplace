import { LegalPageShell } from '@/components/layout/LegalPageShell';

export const metadata = { title: 'Политика cookies — AI-Aggregator' };

export default function CookiesPage() {
  return (
    <LegalPageShell
      title="Политика использования cookies"
      version="v1.0-2026-04-24"
      publishedAt="2026-04-24"
    >
      <section className="space-y-4">
        <h2>Что такое cookies</h2>
        <p>
          Cookies — небольшие текстовые файлы, которые сайт сохраняет в браузере для
          запоминания вашей сессии и настроек. Мы используем 4 категории cookies, из
          которых активны по умолчанию только essential.
        </p>

        <h2>Категории</h2>
        <h3>Essential (обязательные)</h3>
        <p>
          Необходимы для работы сайта: авторизация, CSRF-токен, выбор темы. Отключить
          нельзя — без них сайт не функционирует. Сроки: сессионные (удаляются при
          закрытии браузера) + persistent до 30 дней.
        </p>

        <h3>Functional (функциональные)</h3>
        <p>
          Запоминают ваши предпочтения (язык, отображение маркетплейса). Срок: до 90 дней.
        </p>

        <h3>Analytics (аналитика)</h3>
        <p>
          Яндекс.Метрика и internal product analytics для понимания, какие фичи используются.
          Данные анонимизированы. Срок: до 1 года. Требуют вашего явного согласия.
        </p>

        <h3>Marketing</h3>
        <p>
          Трекинг-пиксели рекламных сетей (VK Ads, myTarget) для показа релевантной
          рекламы. Требуют вашего явного согласия. Срок: до 1 года.
        </p>

        <h2>Как изменить выбор</h2>
        <p>
          Вы можете поменять настройки в любой момент на странице{' '}
          <a href="/account/settings#cookies" className="underline">
            настроек аккаунта
          </a>{' '}
          или очистив cookies в браузере — тогда баннер появится заново при следующем
          визите.
        </p>

        <h2>Do Not Track (DNT)</h2>
        <p>
          Если в вашем браузере включён HTTP-заголовок{' '}
          <code>DNT: 1</code> — мы автоматически сохраняем только essential-cookies и
          не показываем баннер. Ни analytics, ни marketing-пиксели загружаться не будут.
        </p>

        <h2>Вопросы</h2>
        <p>
          По вопросам обращайтесь к ответственному за обработку ПДн:{' '}
          <a href={`mailto:${process.env.NEXT_PUBLIC_DPO_EMAIL ?? 'dpo@ai-aggregator.ru'}`}>
            {process.env.NEXT_PUBLIC_DPO_EMAIL ?? 'dpo@ai-aggregator.ru'}
          </a>
          .
        </p>
      </section>
    </LegalPageShell>
  );
}
