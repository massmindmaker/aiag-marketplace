'use client';

import * as React from 'react';
import { useTheme } from 'next-themes';
import { Sun, Moon, Monitor } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Theme toggle (light / dark / system) — Plan 03 Task 3.
 * Uses next-themes `useTheme` + `mounted` guard to avoid hydration mismatch.
 */
export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  if (!mounted) {
    return <div className="h-9 w-28" aria-hidden="true" />;
  }

  const Btn = ({
    keyName,
    label,
    Icon,
  }: {
    keyName: string;
    label: string;
    Icon: typeof Sun;
  }) => (
    <button
      type="button"
      aria-label={label}
      onClick={() => setTheme(keyName)}
      className={cn(
        'p-2 rounded-md transition-colors',
        theme === keyName
          ? 'bg-secondary text-foreground'
          : 'text-muted-foreground hover:text-foreground'
      )}
    >
      <Icon className="h-4 w-4" />
    </button>
  );

  return (
    <div className="inline-flex items-center gap-1 rounded-lg border border-border p-1">
      <Btn keyName="light" label="Light" Icon={Sun} />
      <Btn keyName="dark" label="Dark" Icon={Moon} />
      <Btn keyName="system" label="System" Icon={Monitor} />
    </div>
  );
}
