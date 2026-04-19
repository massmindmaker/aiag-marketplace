'use client';

import { useState, useMemo } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Chip,
  Card,
  Grid,
  Avatar,
  Tabs,
  Tab,
  Paper,
  Divider,
  Stack,
  IconButton,
  Tooltip,
  Alert,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Bolt as BoltIcon,
  People as PeopleIcon,
  Code as CodeIcon,
  ContentCopy as CopyIcon,
  Check as CheckIcon,
  PlayArrow as PlayIcon,
  Api as ApiIcon,
  Star as StarIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import MainLayout from '@/components/layout/MainLayout';
import { TransferWarningBadge } from '@/components/TransferWarningBadge';
import Link from 'next/link';
import { useParams } from 'next/navigation';

// Foreign-hosted orgs that require transborder warning per 152-FZ
const FOREIGN_ORGS = new Set([
  'openai',
  'anthropic',
  'google',
  'stability',
  'meta',
  'runway',
  'elevenlabs',
]);

// Model type configuration
const modelTypeConfig: Record<string, { icon: string; label: string; color: string }> = {
  llm: { icon: '💬', label: 'LLM', color: '#00efdf' },
  image: { icon: '🎨', label: 'Изображения', color: '#ff6b6b' },
  audio: { icon: '🎵', label: 'Аудио', color: '#845ef7' },
  video: { icon: '🎬', label: 'Видео', color: '#ffa94d' },
  embedding: { icon: '🔢', label: 'Эмбеддинги', color: '#69db7c' },
  code: { icon: '💻', label: 'Код', color: '#4dabf7' },
  'speech-to-text': { icon: '🎤', label: 'STT', color: '#f783ac' },
  'text-to-speech': { icon: '🔊', label: 'TTS', color: '#da77f2' },
  multimodal: { icon: '🌐', label: 'Мультимодальные', color: '#ffd43b' },
};

// Mock models data (same as marketplace)
const mockModels = [
  {
    id: '1',
    name: 'GPT-4 Turbo',
    slug: 'gpt-4-turbo',
    type: 'llm',
    logo: null,
    shortDescription: 'Самая мощная языковая модель от OpenAI',
    description: `GPT-4 Turbo — это передовая языковая модель с улучшенными возможностями рассуждения, понимания контекста и генерации текста.

## Возможности
- Расширенный контекст до 128K токенов
- Улучшенное следование инструкциям
- Более актуальные знания (до апреля 2023)
- Поддержка vision (анализ изображений)
- JSON mode для структурированных ответов

## Применение
- Чат-боты и виртуальные ассистенты
- Анализ и суммаризация документов
- Генерация контента
- Перевод и локализация
- Помощь в программировании`,
    avgRating: 4.9,
    totalRequests: 1500000,
    totalSubscribers: 12500,
    pricingType: 'paid',
    tags: ['текст', 'генерация', 'чат', 'анализ', 'vision'],
    owner: { id: '1', name: 'OpenAI', username: 'openai', image: null },
    organization: { id: '1', name: 'OpenAI', slug: 'openai', logo: null },
    pricing: {
      input: 0.01,
      output: 0.03,
      unit: '1K токенов',
    },
    endpoints: [
      { method: 'POST', path: '/v1/chat/completions', description: 'Генерация ответа' },
    ],
  },
  {
    id: '2',
    name: 'DALL-E 3',
    slug: 'dalle-3',
    type: 'image',
    logo: null,
    shortDescription: 'Революционная модель генерации изображений',
    description: `DALL-E 3 — модель генерации изображений с невероятной детализацией и точностью следования промпту.

## Возможности
- Высокое разрешение до 1024x1024
- Точное следование промптам
- Стилистическая гибкость
- Безопасная генерация

## Применение
- Создание иллюстраций
- Дизайн и маркетинг
- Концепт-арт
- Визуализация идей`,
    avgRating: 4.8,
    totalRequests: 890000,
    totalSubscribers: 8900,
    pricingType: 'paid',
    tags: ['изображения', 'генерация', 'искусство', 'дизайн'],
    owner: { id: '1', name: 'OpenAI', username: 'openai', image: null },
    organization: { id: '1', name: 'OpenAI', slug: 'openai', logo: null },
    pricing: {
      input: 0.04,
      output: 0.04,
      unit: 'изображение',
    },
    endpoints: [
      { method: 'POST', path: '/v1/images/generations', description: 'Генерация изображения' },
    ],
  },
  {
    id: '3',
    name: 'Whisper Large',
    slug: 'whisper-large',
    type: 'speech-to-text',
    logo: null,
    shortDescription: 'Высокоточная модель распознавания речи',
    description: `Whisper Large — модель распознавания речи, поддерживающая множество языков и диалектов.

## Возможности
- Поддержка 99+ языков
- Автоматическое определение языка
- Транскрипция и перевод
- Временные метки

## Применение
- Транскрипция встреч
- Субтитры для видео
- Голосовые помощники
- Accessibility`,
    avgRating: 4.7,
    totalRequests: 650000,
    totalSubscribers: 7200,
    pricingType: 'free',
    tags: ['аудио', 'транскрипция', 'речь', 'языки'],
    owner: { id: '1', name: 'OpenAI', username: 'openai', image: null },
    organization: { id: '1', name: 'OpenAI', slug: 'openai', logo: null },
    pricing: {
      input: 0,
      output: 0,
      unit: 'минута',
    },
    endpoints: [
      { method: 'POST', path: '/v1/audio/transcriptions', description: 'Транскрипция аудио' },
    ],
  },
  {
    id: '4',
    name: 'Claude 3.5 Sonnet',
    slug: 'claude-35-sonnet',
    type: 'llm',
    logo: null,
    shortDescription: 'Продвинутая языковая модель от Anthropic',
    description: `Claude 3.5 Sonnet — продвинутая языковая модель с фокусом на безопасность и полезность.

## Возможности
- 200K токенов контекста
- Отличное следование инструкциям
- Безопасные и честные ответы
- Мультимодальность

## Применение
- Бизнес-ассистенты
- Анализ документов
- Написание кода
- Исследования`,
    avgRating: 4.9,
    totalRequests: 1200000,
    totalSubscribers: 11000,
    pricingType: 'paid',
    tags: ['текст', 'ассистент', 'анализ', 'код'],
    owner: { id: '2', name: 'Anthropic', username: 'anthropic', image: null },
    organization: { id: '2', name: 'Anthropic', slug: 'anthropic', logo: null },
    pricing: {
      input: 0.003,
      output: 0.015,
      unit: '1K токенов',
    },
    endpoints: [
      { method: 'POST', path: '/v1/messages', description: 'Отправка сообщения' },
    ],
  },
  {
    id: '5',
    name: 'Stable Diffusion XL',
    slug: 'sdxl',
    type: 'image',
    logo: null,
    shortDescription: 'Мощная open-source модель для генерации изображений',
    description: `Stable Diffusion XL — open-source модель для генерации изображений высокого качества.

## Возможности
- Разрешение до 1024x1024
- Открытый исходный код
- Множество стилей
- Гибкие настройки

## Применение
- Генерация арта
- Прототипирование дизайна
- Создание текстур
- Развлечения`,
    avgRating: 4.6,
    totalRequests: 2100000,
    totalSubscribers: 15800,
    pricingType: 'free',
    tags: ['изображения', 'open-source', 'генерация', 'арт'],
    owner: { id: '3', name: 'Stability AI', username: 'stability', image: null },
    organization: { id: '3', name: 'Stability AI', slug: 'stability', logo: null },
    pricing: {
      input: 0,
      output: 0,
      unit: 'изображение',
    },
    endpoints: [
      { method: 'POST', path: '/v1/generate', description: 'Генерация изображения' },
    ],
  },
  {
    id: '6',
    name: 'ElevenLabs TTS',
    slug: 'elevenlabs-tts',
    type: 'text-to-speech',
    logo: null,
    shortDescription: 'Реалистичный синтез речи',
    description: `ElevenLabs TTS — реалистичный синтез речи с эмоциональной выразительностью.

## Возможности
- Множество голосов
- Эмоциональный синтез
- Клонирование голоса
- Низкая латентность

## Применение
- Озвучка видео
- Аудиокниги
- Голосовые ассистенты
- Accessibility`,
    avgRating: 4.8,
    totalRequests: 540000,
    totalSubscribers: 6500,
    pricingType: 'paid',
    tags: ['аудио', 'синтез', 'голос', 'TTS'],
    owner: { id: '4', name: 'ElevenLabs', username: 'elevenlabs', image: null },
    organization: { id: '4', name: 'ElevenLabs', slug: 'elevenlabs', logo: null },
    pricing: {
      input: 0.0003,
      output: 0,
      unit: 'символ',
    },
    endpoints: [
      { method: 'POST', path: '/v1/text-to-speech', description: 'Синтез речи' },
    ],
  },
  {
    id: '7',
    name: 'Gemini Pro Vision',
    slug: 'gemini-pro-vision',
    type: 'multimodal',
    logo: null,
    shortDescription: 'Мультимодальная модель от Google',
    description: `Gemini Pro Vision — мультимодальная модель для анализа текста и изображений.

## Возможности
- Анализ изображений
- Понимание диаграмм
- Мультимодальные диалоги
- Генерация кода по скриншотам

## Применение
- Анализ документов с изображениями
- OCR и извлечение данных
- Визуальные Q&A
- Образование`,
    avgRating: 4.7,
    totalRequests: 780000,
    totalSubscribers: 9200,
    pricingType: 'free',
    tags: ['мультимодальность', 'vision', 'текст', 'анализ'],
    owner: { id: '5', name: 'Google', username: 'google', image: null },
    organization: { id: '5', name: 'Google', slug: 'google', logo: null },
    pricing: {
      input: 0,
      output: 0,
      unit: '1K токенов',
    },
    endpoints: [
      { method: 'POST', path: '/v1/generateContent', description: 'Генерация контента' },
    ],
  },
  {
    id: '8',
    name: 'CodeLlama 70B',
    slug: 'codellama-70b',
    type: 'code',
    logo: null,
    shortDescription: 'Специализированная модель для программирования',
    description: `CodeLlama 70B — модель для генерации и анализа кода.

## Возможности
- Поддержка 15+ языков программирования
- Автодополнение кода
- Объяснение кода
- Поиск багов

## Применение
- Помощь в разработке
- Code review
- Документирование
- Обучение программированию`,
    avgRating: 4.5,
    totalRequests: 420000,
    totalSubscribers: 5600,
    pricingType: 'free',
    tags: ['код', 'программирование', 'разработка', 'AI'],
    owner: { id: '6', name: 'Meta', username: 'meta', image: null },
    organization: { id: '6', name: 'Meta', slug: 'meta', logo: null },
    pricing: {
      input: 0,
      output: 0,
      unit: '1K токенов',
    },
    endpoints: [
      { method: 'POST', path: '/v1/completions', description: 'Генерация кода' },
    ],
  },
  {
    id: '9',
    name: 'RunwayML Gen-2',
    slug: 'runway-gen2',
    type: 'video',
    logo: null,
    shortDescription: 'Передовая модель для генерации видео',
    description: `RunwayML Gen-2 — модель для генерации видео из текста.

## Возможности
- Text-to-Video
- Image-to-Video
- Редактирование видео
- Стилизация

## Применение
- Создание контента
- Рекламные ролики
- Прототипирование
- Художественные проекты`,
    avgRating: 4.6,
    totalRequests: 320000,
    totalSubscribers: 4200,
    pricingType: 'paid',
    tags: ['видео', 'генерация', 'AI-кино', 'контент'],
    owner: { id: '7', name: 'RunwayML', username: 'runway', image: null },
    organization: { id: '7', name: 'RunwayML', slug: 'runway', logo: null },
    pricing: {
      input: 0.05,
      output: 0,
      unit: 'секунда видео',
    },
    endpoints: [
      { method: 'POST', path: '/v1/generate', description: 'Генерация видео' },
    ],
  },
];

// Format number utility
const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
};

// Tab Panel component
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel({ children, value, index }: TabPanelProps) {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

// Code example component
function CodeExample({ endpoint }: { endpoint: { method: string; path: string; description: string } }) {
  const [copied, setCopied] = useState(false);

  const curlExample = `curl -X ${endpoint.method} "https://api.aiag.ru${endpoint.path}" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "model-id",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(curlExample);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Paper sx={{ bgcolor: '#1e1e1e', p: 2, borderRadius: 2, position: 'relative' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Chip
          label={endpoint.method}
          size="small"
          sx={{
            bgcolor: endpoint.method === 'POST' ? '#4caf50' : '#2196f3',
            color: 'white',
            fontWeight: 600,
          }}
        />
        <Tooltip title={copied ? 'Скопировано!' : 'Копировать'}>
          <IconButton onClick={handleCopy} size="small" sx={{ color: '#888' }}>
            {copied ? <CheckIcon /> : <CopyIcon />}
          </IconButton>
        </Tooltip>
      </Box>
      <Typography
        component="pre"
        sx={{
          color: '#d4d4d4',
          fontFamily: 'monospace',
          fontSize: '0.85rem',
          overflow: 'auto',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-all',
          m: 0,
        }}
      >
        {curlExample}
      </Typography>
    </Paper>
  );
}

export default function ModelDetailPage() {
  const params = useParams();
  const org = params?.org as string;
  const modelSlug = params?.model as string;

  const [tabValue, setTabValue] = useState(0);

  // Find model by org and slug
  const model = useMemo(() => {
    return mockModels.find((m) => {
      const modelOrg = m.organization?.slug || m.owner?.username;
      return modelOrg === org && m.slug === modelSlug;
    });
  }, [org, modelSlug]);

  if (!model) {
    return (
      <MainLayout>
        <Container maxWidth="lg" sx={{ py: 8 }}>
          <Alert severity="error" sx={{ mb: 4 }}>
            Модель не найдена
          </Alert>
          <Button
            component={Link}
            href="/marketplace"
            startIcon={<ArrowBackIcon />}
            variant="outlined"
          >
            Вернуться в маркетплейс
          </Button>
        </Container>
      </MainLayout>
    );
  }

  const typeConfig = modelTypeConfig[model.type] || modelTypeConfig.llm;
  const ownerName = model.organization?.name || model.owner?.name || 'Unknown';
  const orgSlug = model.organization?.slug || model.owner?.username || '';
  const isTransborderRoute = FOREIGN_ORGS.has(orgSlug);

  return (
    <MainLayout>
      <Box sx={{ bgcolor: '#fafafa', minHeight: '100vh' }}>
        {/* Header */}
        <Box sx={{ bgcolor: 'white', borderBottom: '1px solid #eee', py: 4 }}>
          <Container maxWidth="lg">
            {/* Back button */}
            <Button
              component={Link}
              href="/marketplace"
              startIcon={<ArrowBackIcon />}
              sx={{ mb: 3, color: '#666' }}
            >
              Назад в маркетплейс
            </Button>

            {/* Model header */}
            <Grid container spacing={4} alignItems="flex-start">
              <Grid item xs={12} md={8}>
                <Box sx={{ display: 'flex', gap: 3, alignItems: 'flex-start' }}>
                  <Avatar
                    sx={{
                      width: 80,
                      height: 80,
                      borderRadius: 2,
                      bgcolor: '#f5f5f5',
                      fontSize: '2.5rem',
                    }}
                  >
                    {typeConfig.icon}
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                      <Typography variant="h4" sx={{ fontWeight: 700, color: '#333' }}>
                        {model.name}
                      </Typography>
                      <Chip
                        label={typeConfig.label}
                        sx={{
                          bgcolor: typeConfig.color,
                          color: model.type === 'multimodal' ? '#333' : 'white',
                          fontWeight: 600,
                        }}
                      />
                      {isTransborderRoute && <TransferWarningBadge />}
                    </Box>
                    <Typography variant="body1" sx={{ color: '#666', mb: 2 }}>
                      by {ownerName}
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#555' }}>
                      {model.shortDescription}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card sx={{ p: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                    {model.pricingType === 'free' ? 'Бесплатно' : 'Тарификация'}
                  </Typography>
                  {model.pricing && model.pricingType === 'paid' && (
                    <Box sx={{ mb: 3 }}>
                      <Stack spacing={1}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" color="text.secondary">
                            Input:
                          </Typography>
                          <Typography variant="body2" fontWeight={600}>
                            ${model.pricing.input} / {model.pricing.unit}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" color="text.secondary">
                            Output:
                          </Typography>
                          <Typography variant="body2" fontWeight={600}>
                            ${model.pricing.output} / {model.pricing.unit}
                          </Typography>
                        </Box>
                      </Stack>
                    </Box>
                  )}
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<PlayIcon />}
                    sx={{
                      bgcolor: '#00efdf',
                      color: '#000',
                      fontWeight: 600,
                      '&:hover': { bgcolor: '#00d4c5' },
                      mb: 2,
                    }}
                  >
                    Попробовать
                  </Button>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<ApiIcon />}
                    sx={{ borderColor: '#ddd', color: '#555' }}
                  >
                    Получить API ключ
                  </Button>
                </Card>
              </Grid>
            </Grid>

            {/* Stats */}
            <Stack
              direction="row"
              spacing={4}
              divider={<Divider orientation="vertical" flexItem />}
              sx={{ mt: 4 }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <StarIcon sx={{ color: '#ffc107' }} />
                <Typography variant="h6" fontWeight={600}>
                  {model.avgRating}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  рейтинг
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <BoltIcon sx={{ color: '#00efdf' }} />
                <Typography variant="h6" fontWeight={600}>
                  {formatNumber(model.totalRequests)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  запросов
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PeopleIcon sx={{ color: '#2196f3' }} />
                <Typography variant="h6" fontWeight={600}>
                  {formatNumber(model.totalSubscribers)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  подписчиков
                </Typography>
              </Box>
            </Stack>
          </Container>
        </Box>

        {/* Content */}
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Tabs
            value={tabValue}
            onChange={(_, newValue) => setTabValue(newValue)}
            sx={{
              borderBottom: 1,
              borderColor: 'divider',
              '& .MuiTab-root': { textTransform: 'none', fontWeight: 600 },
              '& .Mui-selected': { color: '#00efdf' },
              '& .MuiTabs-indicator': { bgcolor: '#00efdf' },
            }}
          >
            <Tab label="Описание" />
            <Tab label="API" icon={<CodeIcon sx={{ fontSize: 18 }} />} iconPosition="start" />
            <Tab label="Цены" icon={<ScheduleIcon sx={{ fontSize: 18 }} />} iconPosition="start" />
          </Tabs>

          <TabPanel value={tabValue} index={0}>
            <Paper sx={{ p: 4, borderRadius: 2 }}>
              <Typography
                variant="body1"
                sx={{
                  whiteSpace: 'pre-line',
                  lineHeight: 1.8,
                  color: '#444',
                  '& h2': { mt: 3, mb: 2, fontWeight: 600 },
                }}
              >
                {model.description}
              </Typography>
              <Divider sx={{ my: 4 }} />
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Теги
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {model.tags?.map((tag) => (
                  <Chip
                    key={tag}
                    label={tag}
                    sx={{ bgcolor: '#f0f0f0', color: '#555' }}
                  />
                ))}
              </Stack>
            </Paper>
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <Paper sx={{ p: 4, borderRadius: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                Endpoints
              </Typography>
              <Stack spacing={3}>
                {model.endpoints?.map((endpoint, index) => (
                  <Box key={index}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      <Chip
                        label={endpoint.method}
                        size="small"
                        sx={{
                          bgcolor: endpoint.method === 'POST' ? '#4caf50' : '#2196f3',
                          color: 'white',
                          fontWeight: 600,
                        }}
                      />
                      <Typography variant="body1" sx={{ fontFamily: 'monospace', color: '#333' }}>
                        {endpoint.path}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {endpoint.description}
                    </Typography>
                    <CodeExample endpoint={endpoint} />
                  </Box>
                ))}
              </Stack>
            </Paper>
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            <Paper sx={{ p: 4, borderRadius: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                Тарификация
              </Typography>
              {model.pricingType === 'free' ? (
                <Alert severity="success" sx={{ mb: 3 }}>
                  Эта модель доступна бесплатно!
                </Alert>
              ) : (
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Card variant="outlined" sx={{ p: 3, textAlign: 'center' }}>
                      <Typography variant="h4" sx={{ fontWeight: 700, color: '#00efdf', mb: 1 }}>
                        ${model.pricing?.input}
                      </Typography>
                      <Typography variant="body1" color="text.secondary">
                        за {model.pricing?.unit} (input)
                      </Typography>
                    </Card>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Card variant="outlined" sx={{ p: 3, textAlign: 'center' }}>
                      <Typography variant="h4" sx={{ fontWeight: 700, color: '#00efdf', mb: 1 }}>
                        ${model.pricing?.output}
                      </Typography>
                      <Typography variant="body1" color="text.secondary">
                        за {model.pricing?.unit} (output)
                      </Typography>
                    </Card>
                  </Grid>
                </Grid>
              )}
            </Paper>
          </TabPanel>
        </Container>
      </Box>
    </MainLayout>
  );
}
