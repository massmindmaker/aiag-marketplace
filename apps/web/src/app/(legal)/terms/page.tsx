import MainLayout from '@/components/layout/MainLayout';
import { Box, Typography } from '@mui/material';

export const metadata = { title: 'Условия использования — AI-Aggregator' };

export default function TermsPage() {
  return (
    <MainLayout>
      <Box sx={{ maxWidth: 800, mx: 'auto', p: 4 }}>
        <Typography variant="h3" sx={{ mb: 3 }}>
          Условия использования (оферта)
        </Typography>
        <Typography variant="body1" sx={{ mb: 2 }}>
          Редакция от 2026-04-18. Оператор: ИП Боборов, ОГРНИП 0000000000.
        </Typography>
        <Typography variant="h5" sx={{ mt: 4, mb: 2 }}>
          1. Предмет оферты
        </Typography>
        <Typography variant="body1">
          Использование сервиса AI-Aggregator (далее — «Сервис») для доступа
          к API моделей искусственного интеллекта означает безоговорочное
          принятие условий настоящей оферты.
        </Typography>
        <Typography variant="h5" sx={{ mt: 4, mb: 2 }}>
          2. Полная редакция оферты
        </Typography>
        <Typography variant="body1">
          Полный текст публичной оферты будет опубликован в Plan 08 после
          юридической экспертизы. Текущая редакция — стартовая заглушка
          для покрытия требований 152-ФЗ и согласия пользователя на этапе
          регистрации.
        </Typography>
        <Typography variant="h5" sx={{ mt: 4, mb: 2 }}>
          3. Связь с политикой обработки ПДн
        </Typography>
        <Typography variant="body1">
          Условия обработки персональных данных регулируются{' '}
          <a href="/privacy">Политикой обработки ПДн</a>, которая является
          неотъемлемой частью настоящей оферты.
        </Typography>
        <Typography variant="caption" sx={{ display: 'block', mt: 4, color: 'text.secondary' }}>
          Эта страница — стартовая версия. Финальная оферта — Plan 08.
        </Typography>
      </Box>
    </MainLayout>
  );
}
