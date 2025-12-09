import { Box, Container, Typography, Paper } from '@mui/material';
import MainLayout from '@/components/layout/MainLayout';

export const metadata = {
  title: 'Политика конфиденциальности',
  description: 'Политика конфиденциальности AI Aggregator',
};

export default function PrivacyPage() {
  return (
    <MainLayout>
      <Box sx={{ bgcolor: '#fafafa', minHeight: '100vh', py: 6 }}>
        <Container maxWidth="md">
          <Paper sx={{ p: { xs: 3, md: 6 }, borderRadius: 2 }}>
            <Typography variant="h3" sx={{ fontWeight: 700, color: '#333', mb: 4 }}>
              Политика конфиденциальности
            </Typography>

            <Typography variant="body2" sx={{ color: '#888', mb: 4 }}>
              Последнее обновление: 9 декабря 2024 г.
            </Typography>

            <Typography variant="h5" sx={{ fontWeight: 600, color: '#444', mt: 4, mb: 2 }}>
              1. Сбор информации
            </Typography>
            <Typography variant="body1" sx={{ color: '#555', mb: 3, lineHeight: 1.8 }}>
              Мы собираем информацию, которую вы предоставляете при регистрации:
              имя, email, данные об использовании сервиса. Также автоматически
              собираются технические данные: IP-адрес, тип браузера, данные об устройстве.
            </Typography>

            <Typography variant="h5" sx={{ fontWeight: 600, color: '#444', mt: 4, mb: 2 }}>
              2. Использование информации
            </Typography>
            <Typography variant="body1" sx={{ color: '#555', mb: 3, lineHeight: 1.8 }}>
              Собранная информация используется для:
            </Typography>
            <Box component="ul" sx={{ color: '#555', mb: 3, pl: 3 }}>
              <li>Предоставления и улучшения сервиса</li>
              <li>Персонализации пользовательского опыта</li>
              <li>Обработки платежей и выставления счетов</li>
              <li>Связи с пользователями по вопросам сервиса</li>
              <li>Обеспечения безопасности и предотвращения мошенничества</li>
            </Box>

            <Typography variant="h5" sx={{ fontWeight: 600, color: '#444', mt: 4, mb: 2 }}>
              3. Защита данных
            </Typography>
            <Typography variant="body1" sx={{ color: '#555', mb: 3, lineHeight: 1.8 }}>
              Мы применяем современные меры безопасности для защиты ваших данных:
              шифрование при передаче (TLS), безопасное хранение паролей (bcrypt),
              регулярные аудиты безопасности.
            </Typography>

            <Typography variant="h5" sx={{ fontWeight: 600, color: '#444', mt: 4, mb: 2 }}>
              4. Передача данных третьим лицам
            </Typography>
            <Typography variant="body1" sx={{ color: '#555', mb: 3, lineHeight: 1.8 }}>
              Мы не продаем ваши персональные данные. Данные могут быть переданы
              только платежным провайдерам для обработки транзакций и по требованию
              законодательства.
            </Typography>

            <Typography variant="h5" sx={{ fontWeight: 600, color: '#444', mt: 4, mb: 2 }}>
              5. Cookies
            </Typography>
            <Typography variant="body1" sx={{ color: '#555', mb: 3, lineHeight: 1.8 }}>
              Сайт использует cookies для обеспечения функциональности, аналитики
              и персонализации. Вы можете отключить cookies в настройках браузера.
            </Typography>

            <Typography variant="h5" sx={{ fontWeight: 600, color: '#444', mt: 4, mb: 2 }}>
              6. Ваши права
            </Typography>
            <Typography variant="body1" sx={{ color: '#555', mb: 3, lineHeight: 1.8 }}>
              Вы имеете право на доступ к своим данным, их исправление или удаление.
              Для реализации этих прав свяжитесь с нами: privacy@aiag.ru
            </Typography>

            <Typography variant="h5" sx={{ fontWeight: 600, color: '#444', mt: 4, mb: 2 }}>
              7. Изменения политики
            </Typography>
            <Typography variant="body1" sx={{ color: '#555', mb: 3, lineHeight: 1.8 }}>
              Мы можем обновлять данную политику. Об изменениях мы уведомим
              на сайте или по email.
            </Typography>
          </Paper>
        </Container>
      </Box>
    </MainLayout>
  );
}
