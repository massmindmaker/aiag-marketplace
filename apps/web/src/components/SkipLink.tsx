'use client';

import { cn } from '@/lib/utils';

/**
 * Accessibility: a "skip to main content" link that becomes visible
 * only when focused via keyboard. Should be the first focusable
 * element inside <body>. Target element must have id="main-content".
 */
export function SkipLink({ targetId = 'main-content', label }: { targetId?: string; label?: string }) {
  return (
    <a
      href={`#${targetId}`}
      className={cn(
        'sr-only focus:not-sr-only',
        'fixed left-4 top-4 z-[100]',
        'rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground',
        'shadow-lg outline-none ring-2 ring-ring ring-offset-2 ring-offset-background',
        'transition-transform'
      )}
    >
      {label ?? 'Перейти к основному содержимому'}
    </a>
  );
}
