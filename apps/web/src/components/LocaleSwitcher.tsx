'use client';

import * as React from 'react';
import { Globe } from 'lucide-react';
import { locales, type Locale } from '@/i18n/config';
import { cn } from '@/lib/utils';

/**
 * Minimal locale switcher (Plan 03 MVP).
 * Writes `NEXT_LOCALE` cookie + reloads; next-intl picks it up on next request.
 * Full URL-prefix routing is deferred until Plan 08 (real translations).
 */

const LOCALE_LABELS: Record<Locale, string> = {
  ru: 'Русский',
  en: 'English',
  'zh-CN': '中文',
  hi: 'हिन्दी',
  ko: '한국어',
  'pt-BR': 'Português',
  es: 'Español',
  ar: 'العربية',
};

export function LocaleSwitcher({ current = 'ru' }: { current?: Locale }) {
  const [open, setOpen] = React.useState(false);

  const select = (loc: Locale) => {
    document.cookie = `NEXT_LOCALE=${loc}; path=/; max-age=${60 * 60 * 24 * 365}`;
    window.location.reload();
  };

  return (
    <div className="relative inline-block">
      <button
        type="button"
        aria-label="Language"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
      >
        <Globe className="h-4 w-4" />
        <span className="font-medium uppercase">{current}</span>
      </button>
      {open && (
        <ul
          role="menu"
          className={cn(
            'absolute right-0 z-50 mt-1 min-w-[160px] rounded-md border border-border bg-popover p-1 shadow-md'
          )}
        >
          {locales.map((loc) => (
            <li key={loc}>
              <button
                role="menuitem"
                type="button"
                onClick={() => select(loc)}
                className={cn(
                  'w-full rounded px-3 py-1.5 text-left text-sm hover:bg-secondary transition-colors',
                  current === loc && 'bg-secondary'
                )}
              >
                {LOCALE_LABELS[loc]}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
