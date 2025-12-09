'use client';

import { cn } from '@/lib/utils';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'circular' | 'text';
}

function Skeleton({ className, variant = 'default', ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse bg-muted',
        variant === 'default' && 'rounded-md',
        variant === 'circular' && 'rounded-full',
        variant === 'text' && 'rounded h-4',
        className
      )}
      {...props}
    />
  );
}

// Pre-built skeleton components for common use cases
function SkeletonCard() {
  return (
    <div className="rounded-lg border p-4 space-y-4">
      <Skeleton className="h-48 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <div className="flex gap-2">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-20" />
      </div>
    </div>
  );
}

function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      <div className="flex gap-4 p-4 border-b">
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-4 w-1/4" />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 p-4">
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-4 w-1/4" />
        </div>
      ))}
    </div>
  );
}

function SkeletonAvatar({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-16 w-16',
  };

  return <Skeleton variant="circular" className={sizes[size]} />;
}

export { Skeleton, SkeletonCard, SkeletonTable, SkeletonAvatar };
