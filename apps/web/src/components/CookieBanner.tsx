'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

/**
 * Plan 08 Task 4b (H2) — Cookie banner с opt-in категориями + DNT respect.
 *
 * Поведение:
 *   - Если в localStorage уже есть запись `cookie_consents_v1` — не показываем.
 *   - Если navigator.doNotTrack === '1' — сохраняем essential-only automatically,
 *     баннер НЕ показываем.
 *   - Иначе — показываем диалог с 4 категориями.
 */

type Categories = {
  essential: boolean;
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
};

const STORAGE_KEY = 'cookie_consents_v1';

async function saveConsents(cats: Categories, dntHeader: boolean) {
  try {
    await fetch('/api/cookie-consents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...cats, dntHeader }),
    });
  } catch {
    // best-effort: баннер всё равно закрываем
  }
}

export function CookieBanner() {
  const [open, setOpen] = useState(false);
  const [cats, setCats] = useState<Categories>({
    essential: true,
    functional: false,
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (localStorage.getItem(STORAGE_KEY)) return;

    const dnt = navigator.doNotTrack === '1' || (window as any).doNotTrack === '1';
    if (dnt) {
      const essentialOnly: Categories = {
        essential: true,
        functional: false,
        analytics: false,
        marketing: false,
      };
      void saveConsents(essentialOnly, true);
      localStorage.setItem(STORAGE_KEY, 'dnt-auto');
      return;
    }
    setOpen(true);
  }, []);

  const close = (preset: 'essential-only' | 'all' | 'selected') => {
    const toSave: Categories =
      preset === 'all'
        ? { essential: true, functional: true, analytics: true, marketing: true }
        : preset === 'essential-only'
        ? { essential: true, functional: false, analytics: false, marketing: false }
        : cats;
    void saveConsents(toSave, false);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    setOpen(false);
  };

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="cookie-banner-title"
      className="fixed inset-x-0 bottom-0 z-50 border-t bg-background p-4 shadow-lg md:inset-x-auto md:bottom-4 md:right-4 md:max-w-md md:rounded-lg md:border"
    >
      <h2 id="cookie-banner-title" className="text-lg font-semibold">
        Мы используем cookies
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Выберите категории. Essential-cookies обязательны для работы сайта; остальные — opt-in.
        Подробнее в{' '}
        <Link href="/cookies" className="underline">
          политике cookies
        </Link>
        .
      </p>

      <div className="mt-4 space-y-2 text-sm">
        {(
          [
            { key: 'essential', label: 'Essential (обязательно)', disabled: true },
            { key: 'functional', label: 'Functional', disabled: false },
            { key: 'analytics', label: 'Analytics', disabled: false },
            { key: 'marketing', label: 'Marketing', disabled: false },
          ] as const
        ).map(({ key, label, disabled }) => (
          <label key={key} className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={cats[key]}
              disabled={disabled}
              onChange={(e) => setCats((c) => ({ ...c, [key]: e.target.checked }))}
            />
            <span>{label}</span>
          </label>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => close('essential-only')}
          className="rounded-md border px-3 py-1.5 text-sm"
        >
          Только essential
        </button>
        <button
          type="button"
          onClick={() => close('selected')}
          className="rounded-md border px-3 py-1.5 text-sm"
        >
          Сохранить выбор
        </button>
        <button
          type="button"
          onClick={() => close('all')}
          className="rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground"
        >
          Принять всё
        </button>
      </div>
    </div>
  );
}
