import { LegalPageShell } from '@/components/layout/LegalPageShell';
import { HumanReviewForm } from './HumanReviewForm';

export const metadata = {
  title: 'Запрос проверки человеком (ст. 16 152-ФЗ) — AI-Aggregator',
};

export default function RequestHumanReviewPage() {
  return (
    <LegalPageShell title="Проверка автоматизированного решения человеком" publishedAt="2026-04-24">
      <p>
        Согласно ст. 16 Федерального закона № 152-ФЗ вы имеете право оспорить решение,
        принятое исключительно на основе автоматизированной обработки ваших персональных
        данных. Подайте запрос через форму ниже — мы ответим в течение 30 календарных дней.
      </p>
      <p className="text-sm text-muted-foreground">
        Примеры автоматизированных решений: блокировка запроса content-модератором,
        установка fraud-флага, маршрутизация запроса через Shield-RF на локальную модель.
      </p>
      <HumanReviewForm />
    </LegalPageShell>
  );
}
