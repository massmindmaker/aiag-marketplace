'use client';

import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'primary' | 'secondary';
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
  xl: 'h-12 w-12',
};

const variantClasses = {
  default: 'text-muted-foreground',
  primary: 'text-primary',
  secondary: 'text-secondary',
};

function Spinner({
  size = 'md',
  variant = 'default',
  className,
  ...props
}: SpinnerProps) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={cn('flex items-center justify-center', className)}
      {...props}
    >
      <Loader2
        className={cn(
          'animate-spin',
          sizeClasses[size],
          variantClasses[variant]
        )}
      />
      <span className="sr-only">Loading...</span>
    </div>
  );
}

// Full page spinner
function FullPageSpinner() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50">
      <Spinner size="xl" variant="primary" />
    </div>
  );
}

// Inline spinner for buttons, etc.
function InlineSpinner({ className }: { className?: string }) {
  return <Spinner size="sm" className={cn('inline-block', className)} />;
}

export { Spinner, FullPageSpinner, InlineSpinner };
