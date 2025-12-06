import Link from 'next/link';
import { Suspense } from 'react';
import { Search, Star, Zap, Clock } from 'lucide-react';
import { db, desc, eq, and } from '@/lib/db';
import { aiModels } from '@aiag/database/schema';
import { formatNumber } from '@/lib/utils';

// Model type icons and colors
const modelTypeConfig: Record<string, { icon: string; color: string; label: string }> = {
  llm: { icon: '💬', color: 'bg-blue-100 text-blue-800', label: 'LLM' },
  image: { icon: '🎨', color: 'bg-purple-100 text-purple-800', label: 'Image' },
  audio: { icon: '🎵', color: 'bg-green-100 text-green-800', label: 'Audio' },
  video: { icon: '🎬', color: 'bg-red-100 text-red-800', label: 'Video' },
  embedding: { icon: '🔢', color: 'bg-yellow-100 text-yellow-800', label: 'Embedding' },
  code: { icon: '💻', color: 'bg-gray-100 text-gray-800', label: 'Code' },
  'speech-to-text': { icon: '🎤', color: 'bg-indigo-100 text-indigo-800', label: 'STT' },
  'text-to-speech': { icon: '🔊', color: 'bg-pink-100 text-pink-800', label: 'TTS' },
  multimodal: { icon: '🌐', color: 'bg-orange-100 text-orange-800', label: 'Multimodal' },
};

async function getModels(type?: string, search?: string) {
  const models = await db.query.aiModels.findMany({
    where: and(
      eq(aiModels.isPublic, true),
      eq(aiModels.status, 'published'),
      type ? eq(aiModels.type, type as any) : undefined
    ),
    with: {
      owner: {
        columns: {
          id: true,
          name: true,
          username: true,
          image: true,
        },
      },
      organization: {
        columns: {
          id: true,
          name: true,
          slug: true,
          logo: true,
        },
      },
    },
    orderBy: [desc(aiModels.totalSubscribers)],
    limit: 50,
  });

  return models;
}

function ModelCard({ model }: { model: Awaited<ReturnType<typeof getModels>>[0] }) {
  const typeConfig = modelTypeConfig[model.type] || modelTypeConfig.llm;
  const ownerName = model.organization?.name || model.owner?.name || 'Unknown';
  const ownerSlug = model.organization?.slug || model.owner?.username || model.ownerId;

  return (
    <Link
      href={`/marketplace/${ownerSlug}/${model.slug}`}
      className="group rounded-lg border bg-card p-6 transition-all hover:border-primary hover:shadow-md"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          {model.logo ? (
            <img
              src={model.logo}
              alt={model.name}
              className="h-12 w-12 rounded-lg object-cover"
            />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted text-2xl">
              {typeConfig.icon}
            </div>
          )}
          <div>
            <h3 className="font-semibold group-hover:text-primary">{model.name}</h3>
            <p className="text-sm text-muted-foreground">{ownerName}</p>
          </div>
        </div>
        <span
          className={`rounded-full px-2 py-1 text-xs font-medium ${typeConfig.color}`}
        >
          {typeConfig.label}
        </span>
      </div>

      <p className="mt-4 line-clamp-2 text-sm text-muted-foreground">
        {model.shortDescription || model.description || 'No description available'}
      </p>

      <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-1">
          <Star className="h-4 w-4" />
          <span>{model.avgRating || '-'}</span>
        </div>
        <div className="flex items-center gap-1">
          <Zap className="h-4 w-4" />
          <span>{formatNumber(model.totalRequests)} requests</span>
        </div>
        <div className="flex items-center gap-1">
          <Clock className="h-4 w-4" />
          <span>{model.pricingType === 'free' ? 'Free' : 'Paid'}</span>
        </div>
      </div>

      {model.tags && model.tags.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1">
          {model.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </Link>
  );
}

function ModelCardSkeleton() {
  return (
    <div className="rounded-lg border bg-card p-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 animate-pulse rounded-lg bg-muted" />
          <div className="space-y-2">
            <div className="h-4 w-32 animate-pulse rounded bg-muted" />
            <div className="h-3 w-24 animate-pulse rounded bg-muted" />
          </div>
        </div>
        <div className="h-6 w-16 animate-pulse rounded-full bg-muted" />
      </div>
      <div className="mt-4 space-y-2">
        <div className="h-3 w-full animate-pulse rounded bg-muted" />
        <div className="h-3 w-2/3 animate-pulse rounded bg-muted" />
      </div>
    </div>
  );
}

async function ModelsList({
  type,
  search,
}: {
  type?: string;
  search?: string;
}) {
  const models = await getModels(type, search);

  if (models.length === 0) {
    return (
      <div className="col-span-full py-12 text-center">
        <p className="text-muted-foreground">No models found</p>
      </div>
    );
  }

  return (
    <>
      {models.map((model) => (
        <ModelCard key={model.id} model={model} />
      ))}
    </>
  );
}

export default async function MarketplacePage({
  searchParams,
}: {
  searchParams: { type?: string; search?: string };
}) {
  const { type, search } = searchParams;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-2xl font-bold text-primary">AIAG</span>
          </Link>
          <nav className="hidden md:flex items-center space-x-6">
            <Link href="/marketplace" className="text-sm font-medium text-primary">
              Marketplace
            </Link>
            <Link href="/docs" className="text-sm font-medium hover:text-primary">
              Documentation
            </Link>
            <Link href="/pricing" className="text-sm font-medium hover:text-primary">
              Pricing
            </Link>
          </nav>
          <div className="flex items-center space-x-4">
            <Link href="/login" className="text-sm font-medium hover:text-primary">
              Sign In
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      <div className="container py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">AI Models Marketplace</h1>
          <p className="mt-2 text-muted-foreground">
            Discover and integrate AI models for your applications
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              placeholder="Search models..."
              defaultValue={search}
              className="w-full rounded-md border bg-background py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/marketplace"
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                !type
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted hover:bg-muted/80'
              }`}
            >
              All
            </Link>
            {Object.entries(modelTypeConfig).map(([key, config]) => (
              <Link
                key={key}
                href={`/marketplace?type=${key}`}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  type === key
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-muted/80'
                }`}
              >
                {config.icon} {config.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Models Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Suspense
            fallback={
              <>
                {Array.from({ length: 6 }).map((_, i) => (
                  <ModelCardSkeleton key={i} />
                ))}
              </>
            }
          >
            <ModelsList type={type} search={search} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
