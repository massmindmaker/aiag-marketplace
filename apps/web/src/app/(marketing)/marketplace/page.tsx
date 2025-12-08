'use client';

import { useState, useMemo } from 'react';
import {
  Box,
  Container,
  Typography,
  TextField,
  InputAdornment,
  Chip,
  Card,
  CardContent,
  CardActionArea,
  Grid,
  Avatar,
  Rating,
  Skeleton,
  Stack,
} from '@mui/material';
import {
  Search as SearchIcon,
  Bolt as BoltIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import MainLayout from '@/components/layout/MainLayout';
import Link from 'next/link';

// Model type configuration
const modelTypeConfig: Record<string, { icon: string; label: string }> = {
  llm: { icon: '💬', label: 'LLM' },
  image: { icon: '🎨', label: 'Изображения' },
  audio: { icon: '🎵', label: 'Аудио' },
  video: { icon: '🎬', label: 'Видео' },
  embedding: { icon: '🔢', label: 'Эмбеддинги' },
  code: { icon: '💻', label: 'Код' },
  'speech-to-text': { icon: '🎤', label: 'STT' },
  'text-to-speech': { icon: '🔊', label: 'TTS' },
  multimodal: { icon: '🌐', label: 'Мультимодальные' },
};

// Mock data for models
const mockModels = [
  {
    id: '1',
    name: 'GPT-4 Turbo',
    slug: 'gpt-4-turbo',
    type: 'llm',
    logo: null,
    shortDescription: 'Самая мощная языковая модель от OpenAI с улучшенными возможностями рассуждения и понимания контекста',
    description: 'Самая мощная языковая модель от OpenAI',
    avgRating: 4.9,
    totalRequests: 1500000,
    totalSubscribers: 12500,
    pricingType: 'paid',
    tags: ['текст', 'генерация', 'чат'],
    owner: { id: '1', name: 'OpenAI', username: 'openai', image: null },
    organization: { id: '1', name: 'OpenAI', slug: 'openai', logo: null },
    isPublic: true,
    status: 'published',
  },
  {
    id: '2',
    name: 'DALL-E 3',
    slug: 'dalle-3',
    type: 'image',
    logo: null,
    shortDescription: 'Революционная модель генерации изображений с невероятной детализацией и точностью следования промпту',
    description: 'Модель генерации изображений высокого качества',
    avgRating: 4.8,
    totalRequests: 890000,
    totalSubscribers: 8900,
    pricingType: 'paid',
    tags: ['изображения', 'генерация', 'искусство'],
    owner: { id: '1', name: 'OpenAI', username: 'openai', image: null },
    organization: { id: '1', name: 'OpenAI', slug: 'openai', logo: null },
    isPublic: true,
    status: 'published',
  },
  {
    id: '3',
    name: 'Whisper Large',
    slug: 'whisper-large',
    type: 'speech-to-text',
    logo: null,
    shortDescription: 'Высокоточная модель распознавания речи, поддерживающая множество языков и диалектов с отличным качеством',
    description: 'Модель распознавания речи',
    avgRating: 4.7,
    totalRequests: 650000,
    totalSubscribers: 7200,
    pricingType: 'free',
    tags: ['аудио', 'транскрипция', 'речь'],
    owner: { id: '1', name: 'OpenAI', username: 'openai', image: null },
    organization: { id: '1', name: 'OpenAI', slug: 'openai', logo: null },
    isPublic: true,
    status: 'published',
  },
  {
    id: '4',
    name: 'Claude 3.5 Sonnet',
    slug: 'claude-35-sonnet',
    type: 'llm',
    logo: null,
    shortDescription: 'Продвинутая языковая модель от Anthropic с фокусом на безопасность, полезность и честность в ответах',
    description: 'Продвинутая языковая модель',
    avgRating: 4.9,
    totalRequests: 1200000,
    totalSubscribers: 11000,
    pricingType: 'paid',
    tags: ['текст', 'ассистент', 'анализ'],
    owner: { id: '2', name: 'Anthropic', username: 'anthropic', image: null },
    organization: { id: '2', name: 'Anthropic', slug: 'anthropic', logo: null },
    isPublic: true,
    status: 'published',
  },
  {
    id: '5',
    name: 'Stable Diffusion XL',
    slug: 'sdxl',
    type: 'image',
    logo: null,
    shortDescription: 'Мощная open-source модель для генерации изображений с высоким разрешением и художественным качеством',
    description: 'Open-source генерация изображений',
    avgRating: 4.6,
    totalRequests: 2100000,
    totalSubscribers: 15800,
    pricingType: 'free',
    tags: ['изображения', 'open-source', 'генерация'],
    owner: { id: '3', name: 'Stability AI', username: 'stability', image: null },
    organization: { id: '3', name: 'Stability AI', slug: 'stability', logo: null },
    isPublic: true,
    status: 'published',
  },
  {
    id: '6',
    name: 'ElevenLabs TTS',
    slug: 'elevenlabs-tts',
    type: 'text-to-speech',
    logo: null,
    shortDescription: 'Реалистичный синтез речи с эмоциональной выразительностью и поддержкой множества голосов и языков',
    description: 'Реалистичный синтез речи',
    avgRating: 4.8,
    totalRequests: 540000,
    totalSubscribers: 6500,
    pricingType: 'paid',
    tags: ['аудио', 'синтез', 'голос'],
    owner: { id: '4', name: 'ElevenLabs', username: 'elevenlabs', image: null },
    organization: { id: '4', name: 'ElevenLabs', slug: 'elevenlabs', logo: null },
    isPublic: true,
    status: 'published',
  },
  {
    id: '7',
    name: 'Gemini Pro Vision',
    slug: 'gemini-pro-vision',
    type: 'multimodal',
    logo: null,
    shortDescription: 'Мультимодальная модель от Google, способная анализировать и генерировать текст на основе изображений',
    description: 'Мультимодальная модель от Google',
    avgRating: 4.7,
    totalRequests: 780000,
    totalSubscribers: 9200,
    pricingType: 'free',
    tags: ['мультимодальность', 'vision', 'текст'],
    owner: { id: '5', name: 'Google', username: 'google', image: null },
    organization: { id: '5', name: 'Google', slug: 'google', logo: null },
    isPublic: true,
    status: 'published',
  },
  {
    id: '8',
    name: 'CodeLlama 70B',
    slug: 'codellama-70b',
    type: 'code',
    logo: null,
    shortDescription: 'Специализированная модель для программирования с поддержкой множества языков и парадигм разработки',
    description: 'Модель для генерации кода',
    avgRating: 4.5,
    totalRequests: 420000,
    totalSubscribers: 5600,
    pricingType: 'free',
    tags: ['код', 'программирование', 'разработка'],
    owner: { id: '6', name: 'Meta', username: 'meta', image: null },
    organization: { id: '6', name: 'Meta', slug: 'meta', logo: null },
    isPublic: true,
    status: 'published',
  },
  {
    id: '9',
    name: 'RunwayML Gen-2',
    slug: 'runway-gen2',
    type: 'video',
    logo: null,
    shortDescription: 'Передовая модель для генерации видео из текста с возможностью создания реалистичных сцен и анимаций',
    description: 'Генерация видео из текста',
    avgRating: 4.6,
    totalRequests: 320000,
    totalSubscribers: 4200,
    pricingType: 'paid',
    tags: ['видео', 'генерация', 'AI-кино'],
    owner: { id: '7', name: 'RunwayML', username: 'runway', image: null },
    organization: { id: '7', name: 'RunwayML', slug: 'runway', logo: null },
    isPublic: true,
    status: 'published',
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

// Model Card Component
interface ModelCardProps {
  model: typeof mockModels[0];
}

function ModelCard({ model }: ModelCardProps) {
  const typeConfig = modelTypeConfig[model.type] || modelTypeConfig.llm;
  const ownerName = model.organization?.name || model.owner?.name || 'Unknown';
  const ownerSlug = model.organization?.slug || model.owner?.username || model.id;

  return (
    <Card
      elevation={2}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          transform: 'translateY(-8px)',
          boxShadow: '0 12px 24px rgba(0, 239, 223, 0.15)',
        },
      }}
    >
      <CardActionArea
        component={Link}
        href={`/marketplace/${ownerSlug}/${model.slug}`}
        sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}
      >
        <CardContent sx={{ flexGrow: 1, width: '100%' }}>
          {/* Header with logo and type badge */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flex: 1 }}>
              {model.logo ? (
                <Avatar
                  src={model.logo}
                  alt={model.name}
                  sx={{ width: 48, height: 48, borderRadius: 1.5 }}
                />
              ) : (
                <Avatar
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 1.5,
                    bgcolor: '#f5f5f5',
                    fontSize: '1.5rem',
                  }}
                >
                  {typeConfig.icon}
                </Avatar>
              )}
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 600,
                    fontSize: '1rem',
                    color: '#555',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {model.name}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: '#888',
                    fontSize: '0.875rem',
                  }}
                >
                  {ownerName}
                </Typography>
              </Box>
            </Box>
            <Chip
              label={typeConfig.label}
              size="small"
              sx={{
                bgcolor: '#00efdf',
                color: '#000',
                fontWeight: 600,
                fontSize: '0.75rem',
                height: 24,
              }}
            />
          </Box>

          {/* Description */}
          <Typography
            variant="body2"
            sx={{
              color: '#666',
              mb: 2,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              lineHeight: 1.5,
              minHeight: '3em',
            }}
          >
            {model.shortDescription || model.description || 'Описание недоступно'}
          </Typography>

          {/* Stats */}
          <Stack direction="row" spacing={2} sx={{ mb: 2, flexWrap: 'wrap', gap: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Rating
                value={model.avgRating || 0}
                precision={0.1}
                readOnly
                size="small"
                sx={{
                  '& .MuiRating-iconFilled': {
                    color: '#00efdf',
                  },
                }}
              />
              <Typography variant="body2" sx={{ color: '#666', fontSize: '0.875rem' }}>
                {model.avgRating || '-'}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <BoltIcon sx={{ fontSize: 16, color: '#888' }} />
              <Typography variant="body2" sx={{ color: '#666', fontSize: '0.875rem' }}>
                {formatNumber(model.totalRequests)} запросов
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <ScheduleIcon sx={{ fontSize: 16, color: '#888' }} />
              <Typography variant="body2" sx={{ color: '#666', fontSize: '0.875rem' }}>
                {model.pricingType === 'free' ? 'Бесплатно' : 'Платно'}
              </Typography>
            </Box>
          </Stack>

          {/* Tags */}
          {model.tags && model.tags.length > 0 && (
            <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
              {model.tags.slice(0, 3).map((tag) => (
                <Chip
                  key={tag}
                  label={tag}
                  size="small"
                  sx={{
                    bgcolor: '#f5f5f5',
                    color: '#666',
                    fontSize: '0.75rem',
                    height: 22,
                  }}
                />
              ))}
            </Stack>
          )}
        </CardContent>
      </CardActionArea>
    </Card>
  );
}

// Loading Skeleton Component
function ModelCardSkeleton() {
  return (
    <Card elevation={2}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flex: 1 }}>
            <Skeleton variant="rounded" width={48} height={48} />
            <Box sx={{ flex: 1 }}>
              <Skeleton variant="text" width="60%" height={24} />
              <Skeleton variant="text" width="40%" height={20} />
            </Box>
          </Box>
          <Skeleton variant="rounded" width={60} height={24} />
        </Box>
        <Skeleton variant="text" width="100%" height={20} />
        <Skeleton variant="text" width="80%" height={20} sx={{ mb: 2 }} />
        <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
          <Skeleton variant="text" width={80} height={20} />
          <Skeleton variant="text" width={100} height={20} />
        </Stack>
        <Stack direction="row" spacing={0.5}>
          <Skeleton variant="rounded" width={60} height={22} />
          <Skeleton variant="rounded" width={70} height={22} />
          <Skeleton variant="rounded" width={50} height={22} />
        </Stack>
      </CardContent>
    </Card>
  );
}

export default function MarketplacePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [isLoading] = useState(false);

  // Filter models based on search and type
  const filteredModels = useMemo(() => {
    return mockModels.filter((model) => {
      const matchesSearch =
        searchQuery === '' ||
        model.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        model.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        model.shortDescription?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesType = selectedType === 'all' || model.type === selectedType;

      return matchesSearch && matchesType;
    });
  }, [searchQuery, selectedType]);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  const handleTypeFilter = (type: string) => {
    setSelectedType(type);
  };

  return (
    <MainLayout>
      <Box sx={{ bgcolor: '#fafafa', minHeight: '100vh', py: 4 }}>
        <Container maxWidth="xl">
          {/* Page Header */}
          <Box sx={{ mb: 4 }}>
            <Typography
              variant="h3"
              sx={{
                fontWeight: 700,
                color: '#555',
                mb: 1,
                fontSize: { xs: '1.75rem', md: '2.5rem' },
              }}
            >
              Маркетплейс AI Моделей
            </Typography>
            <Typography variant="body1" sx={{ color: '#666' }}>
              Откройте для себя и интегрируйте AI модели для ваших приложений
            </Typography>
          </Box>

          {/* Search Bar */}
          <Box sx={{ mb: 3 }}>
            <TextField
              fullWidth
              placeholder="Поиск моделей..."
              value={searchQuery}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: '#888' }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                maxWidth: 600,
                '& .MuiOutlinedInput-root': {
                  bgcolor: 'white',
                  '&:hover fieldset': {
                    borderColor: '#00efdf',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#00efdf',
                  },
                },
              }}
            />
          </Box>

          {/* Filter Chips */}
          <Box sx={{ mb: 4, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            <Chip
              label="Все"
              onClick={() => handleTypeFilter('all')}
              sx={{
                bgcolor: selectedType === 'all' ? '#555' : 'white',
                color: selectedType === 'all' ? 'white' : '#555',
                fontWeight: 600,
                border: selectedType === 'all' ? 'none' : '1px solid #ddd',
                '&:hover': {
                  bgcolor: selectedType === 'all' ? '#555' : '#f5f5f5',
                },
              }}
            />
            {Object.entries(modelTypeConfig).map(([key, config]) => (
              <Chip
                key={key}
                label={`${config.icon} ${config.label}`}
                onClick={() => handleTypeFilter(key)}
                sx={{
                  bgcolor: selectedType === key ? '#555' : 'white',
                  color: selectedType === key ? 'white' : '#555',
                  fontWeight: 600,
                  border: selectedType === key ? 'none' : '1px solid #ddd',
                  '&:hover': {
                    bgcolor: selectedType === key ? '#555' : '#f5f5f5',
                  },
                }}
              />
            ))}
          </Box>

          {/* Models Grid */}
          <Grid container spacing={3}>
            {isLoading ? (
              <>
                {Array.from({ length: 6 }).map((_, i) => (
                  <Grid item xs={12} sm={6} lg={4} key={i}>
                    <ModelCardSkeleton />
                  </Grid>
                ))}
              </>
            ) : filteredModels.length === 0 ? (
              <Grid item xs={12}>
                <Box sx={{ py: 8, textAlign: 'center' }}>
                  <Typography variant="h6" sx={{ color: '#888' }}>
                    Модели не найдены
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#999', mt: 1 }}>
                    Попробуйте изменить критерии поиска
                  </Typography>
                </Box>
              </Grid>
            ) : (
              filteredModels.map((model) => (
                <Grid item xs={12} sm={6} lg={4} key={model.id}>
                  <ModelCard model={model} />
                </Grid>
              ))
            )}
          </Grid>
        </Container>
      </Box>
    </MainLayout>
  );
}
