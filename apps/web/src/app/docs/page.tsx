'use client';

import React, { useState } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  List,
  ListItemButton,
  ListItemText,
  Grid,
  useTheme,
  useMediaQuery,
  Drawer,
  IconButton,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import MainLayout from '@/components/layout/MainLayout';

const sections = [
  { id: 'quick-start', title: 'Быстрый старт' },
  { id: 'api-reference', title: 'API Reference' },
  { id: 'authentication', title: 'Аутентификация' },
  { id: 'models', title: 'Модели' },
  { id: 'examples', title: 'Примеры' },
  { id: 'sdk', title: 'SDK' },
];

const CodeBlock = ({ children }: { children: string }) => (
  <Paper
    sx={{
      backgroundColor: '#1e1e1e',
      color: '#d4d4d4',
      p: 2,
      borderRadius: 1,
      overflow: 'auto',
      fontFamily: '"Fira Code", "Consolas", "Monaco", monospace',
      fontSize: '0.875rem',
      lineHeight: 1.6,
      my: 2,
      border: '1px solid rgba(0, 239, 223, 0.2)',
    }}
  >
    <Box component="pre" sx={{ m: 0 }}>
      <code>{children}</code>
    </Box>
  </Paper>
);

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState('quick-start');
  const [mobileOpen, setMobileOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      const offset = 80;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
    }
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  const sidebarContent = (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        backgroundColor: 'transparent',
        height: '100%',
      }}
    >
      <Typography
        variant="h6"
        sx={{
          mb: 3,
          color: '#00efdf',
          fontWeight: 600,
        }}
      >
        Документация
      </Typography>
      <List component="nav">
        {sections.map((section) => (
          <ListItemButton
            key={section.id}
            selected={activeSection === section.id}
            onClick={() => scrollToSection(section.id)}
            sx={{
              borderRadius: 1,
              mb: 0.5,
              '&.Mui-selected': {
                backgroundColor: 'rgba(0, 239, 223, 0.1)',
                borderLeft: '3px solid #00efdf',
                '&:hover': {
                  backgroundColor: 'rgba(0, 239, 223, 0.15)',
                },
              },
              '&:hover': {
                backgroundColor: 'rgba(0, 239, 223, 0.05)',
              },
            }}
          >
            <ListItemText
              primary={section.title}
              primaryTypographyProps={{
                sx: {
                  color: activeSection === section.id ? '#00efdf' : '#555',
                  fontWeight: activeSection === section.id ? 600 : 400,
                },
              }}
            />
          </ListItemButton>
        ))}
      </List>
    </Paper>
  );

  return (
    <MainLayout>
      <Box sx={{ backgroundColor: '#fafafa', minHeight: '100vh', py: 4 }}>
        <Container maxWidth="xl">
          {isMobile && (
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mb: 2, color: '#555' }}
            >
              <MenuIcon />
            </IconButton>
          )}

          <Grid container spacing={4}>
            {/* Sidebar */}
            {!isMobile ? (
              <Grid item md={3}>
                <Box
                  sx={{
                    position: 'sticky',
                    top: 20,
                    maxHeight: 'calc(100vh - 40px)',
                    overflowY: 'auto',
                  }}
                >
                  {sidebarContent}
                </Box>
              </Grid>
            ) : (
              <Drawer
                variant="temporary"
                open={mobileOpen}
                onClose={handleDrawerToggle}
                ModalProps={{
                  keepMounted: true,
                }}
                sx={{
                  '& .MuiDrawer-paper': {
                    boxSizing: 'border-box',
                    width: 280,
                  },
                }}
              >
                {sidebarContent}
              </Drawer>
            )}

            {/* Main Content */}
            <Grid item xs={12} md={9}>
              <Paper sx={{ p: 4 }}>
                {/* Быстрый старт */}
                <Box id="quick-start" sx={{ mb: 6 }}>
                  <Typography
                    variant="h4"
                    sx={{ mb: 3, color: '#555', fontWeight: 600 }}
                  >
                    Быстрый старт
                  </Typography>

                  <Typography variant="body1" sx={{ mb: 3, color: '#555' }}>
                    Добро пожаловать в документацию AIAG API! Этот раздел поможет вам быстро начать работу с нашим API для взаимодействия с современными языковыми моделями.
                  </Typography>

                  <Typography
                    variant="h5"
                    sx={{ mt: 4, mb: 2, color: '#555', fontWeight: 600 }}
                  >
                    Установка
                  </Typography>

                  <Typography variant="body1" sx={{ mb: 2, color: '#555' }}>
                    Для начала работы вам потребуется API ключ. Получите его в личном кабинете после регистрации.
                  </Typography>

                  <Typography
                    variant="h5"
                    sx={{ mt: 4, mb: 2, color: '#555', fontWeight: 600 }}
                  >
                    Первый запрос
                  </Typography>

                  <Typography variant="body1" sx={{ mb: 2, color: '#555' }}>
                    Пример запроса с использованием cURL:
                  </Typography>

                  <CodeBlock>
{`curl https://api.aiag.ru/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -d '{
    "model": "gpt-4",
    "messages": [
      {
        "role": "user",
        "content": "Привет! Как дела?"
      }
    ]
  }'`}
                  </CodeBlock>

                  <Typography variant="body1" sx={{ mb: 2, color: '#555' }}>
                    Пример запроса с использованием Python:
                  </Typography>

                  <CodeBlock>
{`import requests

url = "https://api.aiag.ru/v1/chat/completions"
headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer YOUR_API_KEY"
}
data = {
    "model": "gpt-4",
    "messages": [
        {
            "role": "user",
            "content": "Привет! Как дела?"
        }
    ]
}

response = requests.post(url, json=data, headers=headers)
print(response.json())`}
                  </CodeBlock>
                </Box>

                {/* API Reference */}
                <Box id="api-reference" sx={{ mb: 6 }}>
                  <Typography
                    variant="h4"
                    sx={{ mb: 3, color: '#555', fontWeight: 600 }}
                  >
                    API Reference
                  </Typography>

                  <Typography variant="body1" sx={{ mb: 3, color: '#555' }}>
                    AIAG API предоставляет REST API для взаимодействия с языковыми моделями. Базовый URL: <code style={{ backgroundColor: '#f5f5f5', padding: '2px 6px', borderRadius: '3px' }}>https://api.aiag.ru/v1</code>
                  </Typography>

                  <Typography
                    variant="h6"
                    sx={{ mt: 3, mb: 2, color: '#00efdf', fontWeight: 600 }}
                  >
                    POST /chat/completions
                  </Typography>

                  <Typography variant="body1" sx={{ mb: 2, color: '#555' }}>
                    Создает ответ на основе переданных сообщений.
                  </Typography>

                  <Typography
                    variant="subtitle1"
                    sx={{ mt: 2, mb: 1, color: '#555', fontWeight: 600 }}
                  >
                    Параметры:
                  </Typography>

                  <Box component="ul" sx={{ color: '#555', pl: 3 }}>
                    <li><strong>model</strong> (string, обязательно): ID модели для использования</li>
                    <li><strong>messages</strong> (array, обязательно): Массив сообщений диалога</li>
                    <li><strong>temperature</strong> (number, опционально): Значение от 0 до 2, по умолчанию 1</li>
                    <li><strong>max_tokens</strong> (number, опционально): Максимальное количество токенов в ответе</li>
                    <li><strong>stream</strong> (boolean, опционально): Потоковая передача ответа</li>
                  </Box>
                </Box>

                {/* Аутентификация */}
                <Box id="authentication" sx={{ mb: 6 }}>
                  <Typography
                    variant="h4"
                    sx={{ mb: 3, color: '#555', fontWeight: 600 }}
                  >
                    Аутентификация
                  </Typography>

                  <Typography variant="body1" sx={{ mb: 3, color: '#555' }}>
                    AIAG API использует API ключи для аутентификации. Включите ваш API ключ в заголовок Authorization всех запросов:
                  </Typography>

                  <CodeBlock>
{`Authorization: Bearer YOUR_API_KEY`}
                  </CodeBlock>

                  <Typography variant="body1" sx={{ mb: 2, color: '#555' }}>
                    Ваш API ключ можно найти в личном кабинете в разделе "API ключи". Храните ключ в безопасности и не передавайте его третьим лицам.
                  </Typography>

                  <Paper
                    sx={{
                      p: 2,
                      backgroundColor: 'rgba(0, 239, 223, 0.1)',
                      border: '1px solid #00efdf',
                      borderRadius: 1,
                    }}
                  >
                    <Typography variant="body2" sx={{ color: '#555' }}>
                      <strong>Важно:</strong> Все API запросы должны выполняться через HTTPS. Запросы через HTTP будут отклонены.
                    </Typography>
                  </Paper>
                </Box>

                {/* Модели */}
                <Box id="models" sx={{ mb: 6 }}>
                  <Typography
                    variant="h4"
                    sx={{ mb: 3, color: '#555', fontWeight: 600 }}
                  >
                    Модели
                  </Typography>

                  <Typography variant="body1" sx={{ mb: 3, color: '#555' }}>
                    AIAG предоставляет доступ к различным языковым моделям. Каждая модель оптимизирована для определенных задач.
                  </Typography>

                  <Box sx={{ mb: 3 }}>
                    <Typography
                      variant="h6"
                      sx={{ mb: 1, color: '#00efdf', fontWeight: 600 }}
                    >
                      GPT-4
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#555', mb: 1 }}>
                      Самая мощная модель для сложных задач, требующих глубокого понимания контекста.
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#777' }}>
                      ID модели: <code style={{ backgroundColor: '#f5f5f5', padding: '2px 6px', borderRadius: '3px' }}>gpt-4</code>
                    </Typography>
                  </Box>

                  <Box sx={{ mb: 3 }}>
                    <Typography
                      variant="h6"
                      sx={{ mb: 1, color: '#00efdf', fontWeight: 600 }}
                    >
                      GPT-3.5 Turbo
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#555', mb: 1 }}>
                      Быстрая и эффективная модель для большинства повседневных задач.
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#777' }}>
                      ID модели: <code style={{ backgroundColor: '#f5f5f5', padding: '2px 6px', borderRadius: '3px' }}>gpt-3.5-turbo</code>
                    </Typography>
                  </Box>

                  <Box sx={{ mb: 3 }}>
                    <Typography
                      variant="h6"
                      sx={{ mb: 1, color: '#00efdf', fontWeight: 600 }}
                    >
                      Claude 3
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#555', mb: 1 }}>
                      Передовая модель от Anthropic с фокусом на безопасность и точность.
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#777' }}>
                      ID модели: <code style={{ backgroundColor: '#f5f5f5', padding: '2px 6px', borderRadius: '3px' }}>claude-3-opus</code>
                    </Typography>
                  </Box>
                </Box>

                {/* Примеры */}
                <Box id="examples" sx={{ mb: 6 }}>
                  <Typography
                    variant="h4"
                    sx={{ mb: 3, color: '#555', fontWeight: 600 }}
                  >
                    Примеры
                  </Typography>

                  <Typography
                    variant="h6"
                    sx={{ mb: 2, color: '#555', fontWeight: 600 }}
                  >
                    Потоковая передача
                  </Typography>

                  <Typography variant="body1" sx={{ mb: 2, color: '#555' }}>
                    Пример использования потоковой передачи ответа:
                  </Typography>

                  <CodeBlock>
{`import requests

url = "https://api.aiag.ru/v1/chat/completions"
headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer YOUR_API_KEY"
}
data = {
    "model": "gpt-4",
    "messages": [{"role": "user", "content": "Расскажи историю"}],
    "stream": True
}

response = requests.post(url, json=data, headers=headers, stream=True)
for line in response.iter_lines():
    if line:
        print(line.decode('utf-8'))`}
                  </CodeBlock>

                  <Typography
                    variant="h6"
                    sx={{ mt: 4, mb: 2, color: '#555', fontWeight: 600 }}
                  >
                    Настройка температуры
                  </Typography>

                  <Typography variant="body1" sx={{ mb: 2, color: '#555' }}>
                    Управление креативностью ответов через параметр temperature:
                  </Typography>

                  <CodeBlock>
{`data = {
    "model": "gpt-4",
    "messages": [{"role": "user", "content": "Напиши стихотворение"}],
    "temperature": 0.8,  # Более креативные ответы
    "max_tokens": 500
}

response = requests.post(url, json=data, headers=headers)
print(response.json()['choices'][0]['message']['content'])`}
                  </CodeBlock>
                </Box>

                {/* SDK */}
                <Box id="sdk" sx={{ mb: 6 }}>
                  <Typography
                    variant="h4"
                    sx={{ mb: 3, color: '#555', fontWeight: 600 }}
                  >
                    SDK
                  </Typography>

                  <Typography variant="body1" sx={{ mb: 3, color: '#555' }}>
                    Мы предоставляем официальные SDK для популярных языков программирования, чтобы упростить интеграцию.
                  </Typography>

                  <Typography
                    variant="h6"
                    sx={{ mb: 2, color: '#00efdf', fontWeight: 600 }}
                  >
                    Python SDK
                  </Typography>

                  <Typography variant="body1" sx={{ mb: 2, color: '#555' }}>
                    Установка:
                  </Typography>

                  <CodeBlock>
{`pip install aiag`}
                  </CodeBlock>

                  <Typography variant="body1" sx={{ mb: 2, color: '#555' }}>
                    Использование:
                  </Typography>

                  <CodeBlock>
{`from aiag import AIAG

client = AIAG(api_key="YOUR_API_KEY")

response = client.chat.completions.create(
    model="gpt-4",
    messages=[
        {"role": "user", "content": "Привет!"}
    ]
)

print(response.choices[0].message.content)`}
                  </CodeBlock>

                  <Typography
                    variant="h6"
                    sx={{ mt: 4, mb: 2, color: '#00efdf', fontWeight: 600 }}
                  >
                    JavaScript/TypeScript SDK
                  </Typography>

                  <Typography variant="body1" sx={{ mb: 2, color: '#555' }}>
                    Установка:
                  </Typography>

                  <CodeBlock>
{`npm install @aiag/sdk`}
                  </CodeBlock>

                  <Typography variant="body1" sx={{ mb: 2, color: '#555' }}>
                    Использование:
                  </Typography>

                  <CodeBlock>
{`import { AIAG } from '@aiag/sdk';

const client = new AIAG({
  apiKey: 'YOUR_API_KEY'
});

const response = await client.chat.completions.create({
  model: 'gpt-4',
  messages: [
    { role: 'user', content: 'Привет!' }
  ]
});

console.log(response.choices[0].message.content);`}
                  </CodeBlock>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </Box>
    </MainLayout>
  );
}
