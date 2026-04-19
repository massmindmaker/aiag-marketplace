import MainLayout from '@/components/layout/MainLayout';
import { Box, Typography } from '@mui/material';

export const metadata = { title: 'Политика обработки ПДн — AI-Aggregator' };

export default function PrivacyPage() {
  return (
    <MainLayout>
      <Box sx={{ maxWidth: 800, mx: 'auto', p: 4 }}>
        <Typography variant="h3" sx={{ mb: 3 }}>
          Политика обработки персональных данных
        </Typography>
        <Typography variant="body1" sx={{ mb: 2 }}>
          Редакция от 2026-04-18. Оператор: ИП Боборов, ОГРНИП 0000000000.
        </Typography>
        <Typography variant="h5" sx={{ mt: 4, mb: 2 }} id="processing">
          1. Категории обрабатываемых ПДн
        </Typography>
        <Typography variant="body1">
          Email, имя, IP-адрес, user-agent, содержимое API-запросов (prompts),
          платёжные данные (хешированные).
        </Typography>
        <Typography variant="h5" sx={{ mt: 4, mb: 2 }} id="transborder">
          2. Трансграничная передача
        </Typography>
        <Typography variant="body1">
          При использовании моделей, размещённых на зарубежных серверах
          (OpenAI, Anthropic и др.), ваши промпты могут передаваться в США
          или страны ЕС. Для критичных данных используйте модели с меткой
          🛡 «Хостинг РФ».
        </Typography>
        <Typography variant="h5" sx={{ mt: 4, mb: 2 }} id="retention">
          3. Сроки хранения
        </Typography>
        <Typography variant="body1">
          Логи запросов — 30 дней (по умолчанию, настраивается в /dashboard/settings).
          Персональные данные — до отзыва согласия.
        </Typography>
        <Typography variant="h5" sx={{ mt: 4, mb: 2 }} id="rights">
          4. Ваши права
        </Typography>
        <Typography variant="body1">
          Вы можете запросить удаление данных через support@ai-aggregator.ru
          или отозвать согласие в настройках профиля.
        </Typography>
        <Typography variant="caption" sx={{ display: 'block', mt: 4, color: 'text.secondary' }}>
          Эта страница — стартовая версия. Финальная редакция юриста — Plan 08.
        </Typography>
      </Box>
    </MainLayout>
  );
}
