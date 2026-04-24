'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  Zap,
  Users,
  Code,
  Copy,
  Check,
  Play,
  Star,
  Clock,
  Code2,
} from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import { TransferWarningBadge } from '@/components/TransferWarningBadge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@/components/ui/Tabs';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/Tooltip';
import { cn } from '@/lib/utils';

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

const modelTypeConfig: Record<
  string,
  { icon: string; label: string; color: string }
> = {
  llm: { icon: '💬', label: 'LLM', color: 'bg-primary/20 text-primary' },
  image: { icon: '🎨', label: 'Изображения', color: 'bg-pink-500/20 text-pink-400' },
  audio: { icon: '🎵', label: 'Аудио', color: 'bg-purple-500/20 text-purple-400' },
  video: { icon: '🎬', label: 'Видео', color: 'bg-orange-500/20 text-orange-400' },
  embedding: { icon: '🔢', label: 'Эмбеддинги', color: 'bg-emerald-500/20 text-emerald-400' },
  code: { icon: '💻', label: 'Код', color: 'bg-blue-500/20 text-blue-400' },
  'speech-to-text': { icon: '🎤', label: 'STT', color: 'bg-pink-500/20 text-pink-400' },
  'text-to-speech': { icon: '🔊', label: 'TTS', color: 'bg-fuchsia-500/20 text-fuchsia-400' },
  multimodal: { icon: '🌐', label: 'Мультимодальные', color: 'bg-yellow-500/20 text-yellow-400' },
};

// Mock models data
const mockModels = [
  {
    id: '1',
    name: 'GPT-4 Turbo',
    slug: 'gpt-4-turbo',
    type: 'llm',
    shortDescription: 'Самая мощная языковая модель от OpenAI',
    description: `GPT-4 Turbo — это передовая языковая модель с улучшенными возможностями рассуждения, понимания контекста и генерации текста.

## Возможности
- Расширенный контекст до 128K токенов
- Улучшенное следование инструкциям
- Более актуальные знания
- Поддержка vision

## Применение
- Чат-боты и виртуальные ассистенты
- Анализ и суммаризация документов
- Генерация контента`,
    avgRating: 4.9,
    totalRequests: 1500000,
    totalSubscribers: 12500,
    pricingType: 'paid',
    tags: ['текст', 'генерация', 'чат', 'анализ', 'vision'],
    organization: { name: 'OpenAI', slug: 'openai' },
    pricing: { input: 0.01, output: 0.03, unit: '1K токенов' },
    endpoints: [
      { method: 'POST', path: '/v1/chat/completions', description: 'Генерация ответа' },
    ],
  },
  {
    id: '2',
    name: 'DALL-E 3',
    slug: 'dalle-3',
    type: 'image',
    shortDescription: 'Революционная модель генерации изображений',
    description: `DALL-E 3 — модель генерации изображений с невероятной детализацией и точностью следования промпту.

## Возможности
- Высокое разрешение до 1024x1024
- Точное следование промптам`,
    avgRating: 4.8,
    totalRequests: 890000,
    totalSubscribers: 8900,
    pricingType: 'paid',
    tags: ['изображения', 'генерация', 'искусство', 'дизайн'],
    organization: { name: 'OpenAI', slug: 'openai' },
    pricing: { input: 0.04, output: 0.04, unit: 'изображение' },
    endpoints: [
      { method: 'POST', path: '/v1/images/generations', description: 'Генерация изображения' },
    ],
  },
  {
    id: '3',
    name: 'Whisper Large',
    slug: 'whisper-large',
    type: 'speech-to-text',
    shortDescription: 'Высокоточная модель распознавания речи',
    description: 'Whisper Large — модель распознавания речи.',
    avgRating: 4.7,
    totalRequests: 650000,
    totalSubscribers: 7200,
    pricingType: 'free',
    tags: ['аудио', 'транскрипция', 'речь'],
    organization: { name: 'OpenAI', slug: 'openai' },
    pricing: { input: 0, output: 0, unit: 'минута' },
    endpoints: [
      { method: 'POST', path: '/v1/audio/transcriptions', description: 'Транскрипция аудио' },
    ],
  },
  {
    id: '4',
    name: 'Claude 3.5 Sonnet',
    slug: 'claude-35-sonnet',
    type: 'llm',
    shortDescription: 'Продвинутая языковая модель от Anthropic',
    description: 'Claude 3.5 Sonnet — продвинутая языковая модель.',
    avgRating: 4.9,
    totalRequests: 1200000,
    totalSubscribers: 11000,
    pricingType: 'paid',
    tags: ['текст', 'ассистент', 'анализ', 'код'],
    organization: { name: 'Anthropic', slug: 'anthropic' },
    pricing: { input: 0.003, output: 0.015, unit: '1K токенов' },
    endpoints: [
      { method: 'POST', path: '/v1/messages', description: 'Отправка сообщения' },
    ],
  },
  {
    id: '5',
    name: 'Stable Diffusion XL',
    slug: 'sdxl',
    type: 'image',
    shortDescription: 'Мощная open-source модель для генерации изображений',
    description: 'Stable Diffusion XL.',
    avgRating: 4.6,
    totalRequests: 2100000,
    totalSubscribers: 15800,
    pricingType: 'free',
    tags: ['изображения', 'open-source'],
    organization: { name: 'Stability AI', slug: 'stability' },
    pricing: { input: 0, output: 0, unit: 'изображение' },
    endpoints: [
      { method: 'POST', path: '/v1/generate', description: 'Генерация изображения' },
    ],
  },
];

const formatNumber = (num: number): string => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
};

function CodeExample({
  endpoint,
}: {
  endpoint: { method: string; path: string; description: string };
}) {
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
    <div className="relative rounded-lg border border-border bg-secondary p-4">
      <div className="flex items-center justify-between mb-2">
        <Badge
          className={cn(
            'font-semibold',
            endpoint.method === 'POST'
              ? 'bg-green-600 text-white'
              : 'bg-blue-600 text-white'
          )}
        >
          {endpoint.method}
        </Badge>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={handleCopy}
                className="text-muted-foreground hover:text-foreground p-1 rounded"
                aria-label="Копировать"
              >
                {copied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent>
              {copied ? 'Скопировано!' : 'Копировать'}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <pre className="font-mono text-xs text-foreground/80 overflow-auto whitespace-pre-wrap break-all">
        {curlExample}
      </pre>
    </div>
  );
}

export default function ModelDetailPage() {
  const params = useParams();
  const org = params?.org as string;
  const modelSlug = params?.model as string;

  const model = useMemo(() => {
    return mockModels.find((m) => {
      const modelOrg = m.organization?.slug;
      return modelOrg === org && m.slug === modelSlug;
    });
  }, [org, modelSlug]);

  if (!model) {
    return (
      <MainLayout>
        <div className="mx-auto max-w-6xl px-4 py-16">
          <Alert variant="destructive" className="mb-8">
            <AlertDescription>Модель не найдена</AlertDescription>
          </Alert>
          <Button asChild variant="outline" leftIcon={<ArrowLeft className="h-4 w-4" />}>
            <Link href="/marketplace">Вернуться в маркетплейс</Link>
          </Button>
        </div>
      </MainLayout>
    );
  }

  const typeConfig = modelTypeConfig[model.type] || modelTypeConfig.llm;
  const ownerName = model.organization?.name || 'Unknown';
  const orgSlug = model.organization?.slug || '';
  const isTransborderRoute = FOREIGN_ORGS.has(orgSlug);

  return (
    <MainLayout>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="border-b border-border bg-card">
          <div className="mx-auto max-w-6xl px-4 py-8">
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="mb-6 -ms-3"
              leftIcon={<ArrowLeft className="h-4 w-4" />}
            >
              <Link href="/marketplace">Назад в маркетплейс</Link>
            </Button>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
              <div className="md:col-span-2">
                <div className="flex gap-4 items-start">
                  <div className="w-20 h-20 rounded-lg bg-secondary flex items-center justify-center text-4xl shrink-0">
                    {typeConfig.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center flex-wrap gap-2 mb-2">
                      <h1 className="text-3xl font-bold text-foreground">
                        {model.name}
                      </h1>
                      <Badge className={typeConfig.color}>{typeConfig.label}</Badge>
                      {isTransborderRoute && <TransferWarningBadge />}
                    </div>
                    <p className="text-muted-foreground mb-2">by {ownerName}</p>
                    <p className="text-foreground/80">{model.shortDescription}</p>
                  </div>
                </div>
              </div>

              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">
                    {model.pricingType === 'free' ? 'Бесплатно' : 'Тарификация'}
                  </h3>
                  {model.pricing && model.pricingType === 'paid' && (
                    <div className="space-y-2 mb-4 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Input:</span>
                        <span className="font-semibold">
                          ${model.pricing.input} / {model.pricing.unit}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Output:</span>
                        <span className="font-semibold">
                          ${model.pricing.output} / {model.pricing.unit}
                        </span>
                      </div>
                    </div>
                  )}
                  <Button
                    className="w-full mb-2"
                    leftIcon={<Play className="h-4 w-4" />}
                  >
                    Попробовать
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    leftIcon={<Code2 className="h-4 w-4" />}
                  >
                    Получить API ключ
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Stats */}
            <div className="mt-8 flex flex-wrap gap-8 items-center text-sm">
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-500" />
                <span className="text-lg font-semibold">{model.avgRating}</span>
                <span className="text-muted-foreground">рейтинг</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                <span className="text-lg font-semibold">
                  {formatNumber(model.totalRequests)}
                </span>
                <span className="text-muted-foreground">запросов</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-400" />
                <span className="text-lg font-semibold">
                  {formatNumber(model.totalSubscribers)}
                </span>
                <span className="text-muted-foreground">подписчиков</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mx-auto max-w-6xl px-4 py-8">
          <Tabs defaultValue="overview">
            <TabsList>
              <TabsTrigger value="overview">Описание</TabsTrigger>
              <TabsTrigger value="api">
                <Code className="h-4 w-4 me-2" />
                API
              </TabsTrigger>
              <TabsTrigger value="pricing">
                <Clock className="h-4 w-4 me-2" />
                Цены
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <Card>
                <CardContent className="p-6">
                  <div className="whitespace-pre-line leading-relaxed text-foreground/85">
                    {model.description}
                  </div>
                  <hr className="my-6 border-border" />
                  <h3 className="text-lg font-semibold mb-3">Теги</h3>
                  <div className="flex flex-wrap gap-2">
                    {model.tags?.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="api">
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-6">Endpoints</h3>
                  <div className="space-y-6">
                    {model.endpoints?.map((endpoint, index) => (
                      <div key={index}>
                        <div className="flex items-center gap-3 mb-2">
                          <Badge
                            className={cn(
                              'font-semibold',
                              endpoint.method === 'POST'
                                ? 'bg-green-600 text-white'
                                : 'bg-blue-600 text-white'
                            )}
                          >
                            {endpoint.method}
                          </Badge>
                          <code className="text-sm font-mono text-foreground">
                            {endpoint.path}
                          </code>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          {endpoint.description}
                        </p>
                        <CodeExample endpoint={endpoint} />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="pricing">
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-6">Тарификация</h3>
                  {model.pricingType === 'free' ? (
                    <Alert variant="success">
                      <AlertDescription>
                        Эта модель доступна бесплатно!
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card>
                        <CardContent className="p-6 text-center">
                          <div className="text-3xl font-bold text-primary mb-1">
                            ${model.pricing?.input}
                          </div>
                          <p className="text-muted-foreground">
                            за {model.pricing?.unit} (input)
                          </p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-6 text-center">
                          <div className="text-3xl font-bold text-primary mb-1">
                            ${model.pricing?.output}
                          </div>
                          <p className="text-muted-foreground">
                            за {model.pricing?.unit} (output)
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </MainLayout>
  );
}
