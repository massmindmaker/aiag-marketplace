import { LegalPageShell } from '@/components/layout/LegalPageShell';
import { ReportForm } from './ReportForm';

export const metadata = {
  title: 'Сообщить о нарушении — AI-Aggregator',
  description: 'Форма обратной связи для жалоб на недопустимый контент.',
};

export default function ReportPage() {
  return (
    <LegalPageShell title="Сообщить о нарушении" publishedAt="2026-04-24">
      <p>
        Используйте эту форму, чтобы сообщить о недопустимом контенте (CSAM, экстремизм,
        нарушение авторских прав, phishing и т.п.). Мы отвечаем в течение 24 часов для
        срочных жалоб и 72 часов — для остальных.
      </p>
      <p className="text-sm text-muted-foreground">
        Экстренные сообщения о CSAM также можно отправить на{' '}
        <a href="mailto:abuse@ai-aggregator.ru">abuse@ai-aggregator.ru</a>.
      </p>
      <ReportForm />
    </LegalPageShell>
  );
}
