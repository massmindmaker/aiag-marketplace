import MainLayout from '@/components/layout/MainLayout';

export default function ModelLoading() {
  return (
    <MainLayout>
      <section className="container mx-auto max-w-7xl px-4 py-6 md:py-10">
        <div className="h-4 w-48 bg-muted rounded animate-pulse mb-4" />
        <div className="flex items-start gap-4 mb-6">
          <div className="h-12 w-12 bg-muted rounded animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-8 w-64 bg-muted rounded animate-pulse" />
            <div className="h-4 w-48 bg-muted rounded animate-pulse" />
            <div className="h-4 w-full max-w-md bg-muted rounded animate-pulse" />
          </div>
        </div>
        <div className="grid lg:grid-cols-[1fr_320px] gap-8">
          <div className="space-y-4">
            <div className="h-10 bg-muted rounded animate-pulse" />
            <div className="h-64 bg-muted rounded animate-pulse" />
          </div>
          <aside className="space-y-4">
            <div className="h-48 bg-muted rounded animate-pulse" />
            <div className="h-32 bg-muted rounded animate-pulse" />
          </aside>
        </div>
      </section>
    </MainLayout>
  );
}
