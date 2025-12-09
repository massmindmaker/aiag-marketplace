import { Box, Container, Typography, Paper } from '@mui/material';
import MainLayout from '@/components/layout/MainLayout';

export const metadata = {
  title: 'Условия использования',
  description: 'Условия использования сервиса AI Aggregator',
};

export default function TermsPage() {
  return (
    <MainLayout>
      <Box sx={{ bgcolor: '#fafafa', minHeight: '100vh', py: 6 }}>
        <Container maxWidth="md">
          <Paper sx={{ p: { xs: 3, md: 6 }, borderRadius: 2 }}>
            <Typography variant="h3" sx={{ fontWeight: 700, color: '#333', mb: 4 }}>
              Условия использования
            </Typography>

            <Typography variant="body2" sx={{ color: '#888', mb: 4 }}>
              Последнее обновление: 9 декабря 2024 г.
            </Typography>

            <Typography variant="h5" sx={{ fontWeight: 600, color: '#444', mt: 4, mb: 2 }}>
              1. Общие положения
            </Typography>
            <Typography variant="body1" sx={{ color: '#555', mb: 3, lineHeight: 1.8 }}>
              Настоящие Условия использования регулируют отношения между AI Aggregator
              (далее — «Сервис») и пользователями платформы. Используя Сервис, вы соглашаетесь
              с данными условиями.
            </Typography>

            <Typography variant="h5" sx={{ fontWeight: 600, color: '#444', mt: 4, mb: 2 }}>
              2. Описание сервиса
            </Typography>
            <Typography variant="body1" sx={{ color: '#555', mb: 3, lineHeight: 1.8 }}>
              AI Aggregator — это маркетплейс AI моделей, предоставляющий доступ к различным
              алгоритмам искусственного интеллекта через единый API. Сервис позволяет
              разработчикам интегрировать AI возможности в свои приложения.
            </Typography>

            <Typography variant="h5" sx={{ fontWeight: 600, color: '#444', mt: 4, mb: 2 }}>
              3. Регистрация и учетная запись
            </Typography>
            <Typography variant="body1" sx={{ color: '#555', mb: 3, lineHeight: 1.8 }}>
              Для использования Сервиса необходимо создать учетную запись. Вы обязуетесь
              предоставить достоверную информацию и обеспечить конфиденциальность данных
              для входа. Вы несете ответственность за все действия, совершенные под вашей
              учетной записью.
            </Typography>

            <Typography variant="h5" sx={{ fontWeight: 600, color: '#444', mt: 4, mb: 2 }}>
              4. Использование API
            </Typography>
            <Typography variant="body1" sx={{ color: '#555', mb: 3, lineHeight: 1.8 }}>
              API ключи являются конфиденциальными и не подлежат передаче третьим лицам.
              Запрещается использование Сервиса для создания вредоносного контента,
              спама или любой незаконной деятельности.
            </Typography>

            <Typography variant="h5" sx={{ fontWeight: 600, color: '#444', mt: 4, mb: 2 }}>
              5. Оплата и тарификация
            </Typography>
            <Typography variant="body1" sx={{ color: '#555', mb: 3, lineHeight: 1.8 }}>
              Оплата за использование платных моделей производится согласно тарифам,
              указанным на странице модели. Сервис оставляет за собой право изменять
              тарифы с предварительным уведомлением пользователей.
            </Typography>

            <Typography variant="h5" sx={{ fontWeight: 600, color: '#444', mt: 4, mb: 2 }}>
              6. Ограничение ответственности
            </Typography>
            <Typography variant="body1" sx={{ color: '#555', mb: 3, lineHeight: 1.8 }}>
              Сервис предоставляется «как есть». Мы не гарантируем бесперебойную работу
              и не несем ответственности за убытки, связанные с использованием или
              невозможностью использования Сервиса.
            </Typography>

            <Typography variant="h5" sx={{ fontWeight: 600, color: '#444', mt: 4, mb: 2 }}>
              7. Контактная информация
            </Typography>
            <Typography variant="body1" sx={{ color: '#555', mb: 3, lineHeight: 1.8 }}>
              По всем вопросам обращайтесь: support@aiag.ru
            </Typography>
          </Paper>
        </Container>
      </Box>
    </MainLayout>
  );
}
