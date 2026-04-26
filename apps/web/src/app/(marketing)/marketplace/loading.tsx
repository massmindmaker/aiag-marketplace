import MainLayout from '@/components/layout/MainLayout';
import { ModelCardSkeleton } from '@/components/marketplace/ModelCard';

export default function MarketplaceLoading() {
  return (
    <MainLayout>
      <section className="container mx-auto max-w-7xl px-4 py-8 md:py-12">
        <header className="mb-6 space-y-2">
          <div className="h-9 w-64 bg-muted rounded animate-pulse" />
          <div className="h-4 w-96 bg-muted rounded animate-pulse" />
        </header>
        <div className="grid lg:grid-cols-[280px_1fr] gap-8">
          <div className="hidden lg:block space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-10 bg-muted rounded animate-pulse" />
            ))}
          </div>
          <div className="space-y-4">
            <div className="h-10 bg-muted rounded animate-pulse" />
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 9 }).map((_, i) => (
                <ModelCardSkeleton key={i} />
              ))}
            </div>
          </div>
        </div>
      </section>
    </MainLayout>
  );
}
