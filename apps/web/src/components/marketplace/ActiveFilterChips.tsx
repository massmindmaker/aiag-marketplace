'use client';

import * as React from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { X } from 'lucide-react';
import {
  parseFiltersFromSearchParams,
  filtersToSearchParams,
  type MarketplaceFilters,
} from '@/lib/marketplace/filters';
import { MODEL_TYPE_LABEL_RU } from '@/lib/marketplace/catalog';

type Chip = {
  key: string;
  label: string;
  remove: () => Partial<MarketplaceFilters>;
};

export function ActiveFilterChips({
  orgNameBySlug,
}: {
  orgNameBySlug: Record<string, string>;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const filters = React.useMemo(
    () => parseFiltersFromSearchParams(new URLSearchParams(searchParams?.toString())),
    [searchParams]
  );

  const chips: Chip[] = [];
  if (filters.q)
    chips.push({
      key: 'q',
      label: `Поиск: ${filters.q}`,
      remove: () => ({ q: undefined }),
    });
  for (const t of filters.types)
    chips.push({
      key: `type-${t}`,
      label: MODEL_TYPE_LABEL_RU[t] ?? t,
      remove: () => ({ types: filters.types.filter((x) => x !== t) }),
    });
  for (const o of filters.orgs)
    chips.push({
      key: `org-${o}`,
      label: orgNameBySlug[o] ?? o,
      remove: () => ({ orgs: filters.orgs.filter((x) => x !== o) }),
    });
  for (const r of filters.regions)
    chips.push({
      key: `region-${r}`,
      label:
        r === 'ru'
          ? 'Хостинг РФ'
          : r === 'eu'
            ? 'Европа'
            : r === 'us'
              ? 'США'
              : 'Global',
      remove: () => ({ regions: filters.regions.filter((x) => x !== r) }),
    });
  for (const c of filters.capabilities)
    chips.push({
      key: `cap-${c}`,
      label: c,
      remove: () => ({
        capabilities: filters.capabilities.filter((x) => x !== c),
      }),
    });
  for (const tg of filters.tags)
    chips.push({
      key: `tag-${tg}`,
      label: `#${tg}`,
      remove: () => ({ tags: filters.tags.filter((x) => x !== tg) }),
    });

  if (chips.length === 0) return null;

  const apply = (patch: Partial<MarketplaceFilters>) => {
    const next = { ...filters, ...patch, page: 1 };
    const qs = filtersToSearchParams(next).toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {chips.map((c) => (
        <button
          key={c.key}
          type="button"
          onClick={() => apply(c.remove())}
          className="inline-flex items-center gap-1 rounded-full bg-secondary text-secondary-foreground px-3 py-1 text-xs hover:bg-secondary/80 transition-colors"
          aria-label={`Убрать фильтр ${c.label}`}
        >
          <span>{c.label}</span>
          <X className="h-3 w-3" aria-hidden />
        </button>
      ))}
      <button
        type="button"
        onClick={() => router.push(pathname)}
        className="text-xs text-muted-foreground hover:text-foreground underline"
      >
        Сбросить все
      </button>
    </div>
  );
}
