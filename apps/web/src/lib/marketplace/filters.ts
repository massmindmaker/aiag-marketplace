/**
 * Plan 06 — URL-query → filter state + in-memory matcher over the seed catalog.
 *
 * Filter state is encoded in URLSearchParams so links are shareable and SSR-safe.
 * When Plan 04 DB is merged, `applyFilters` should be replaced with a SQL builder.
 */

import type { CatalogModel, HostingRegion, ModelType } from './catalog';

export interface MarketplaceFilters {
  q?: string;
  types: ModelType[];
  orgs: string[];
  regions: HostingRegion[];
  capabilities: Array<
    'streaming' | 'tools' | 'vision' | 'jsonSchema' | 'batch'
  >;
  tags: string[];
  derivedTags: string[];
  priceMax?: number;
  sort: 'popular' | 'rating' | 'cheap' | 'fast' | 'new';
  page: number;
  pageSize: number;
}

const DEFAULTS: MarketplaceFilters = {
  q: undefined,
  types: [],
  orgs: [],
  regions: [],
  capabilities: [],
  tags: [],
  derivedTags: [],
  priceMax: undefined,
  sort: 'popular',
  page: 1,
  pageSize: 12,
};

function parseList<T extends string>(value: string | null | undefined): T[] {
  if (!value) return [];
  return value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean) as T[];
}

export function parseFiltersFromSearchParams(
  sp: URLSearchParams | Record<string, string | string[] | undefined>
): MarketplaceFilters {
  const get = (k: string): string | null => {
    if (sp instanceof URLSearchParams) return sp.get(k);
    const v = sp[k];
    if (Array.isArray(v)) return v[0] ?? null;
    return v ?? null;
  };

  const priceMaxStr = get('priceMax');
  const pageStr = get('page');
  const pageSizeStr = get('pageSize');
  const sortRaw = (get('sort') ?? DEFAULTS.sort) as MarketplaceFilters['sort'];
  const validSorts: MarketplaceFilters['sort'][] = [
    'popular',
    'rating',
    'cheap',
    'fast',
    'new',
  ];

  return {
    q: get('q') ?? undefined,
    types: parseList<ModelType>(get('types')),
    orgs: parseList<string>(get('orgs')),
    regions: parseList<HostingRegion>(get('regions')),
    capabilities: parseList<MarketplaceFilters['capabilities'][number]>(
      get('capabilities')
    ),
    tags: parseList<string>(get('tags')),
    derivedTags: parseList<string>(get('derivedTags')),
    priceMax:
      priceMaxStr && !Number.isNaN(Number(priceMaxStr))
        ? Number(priceMaxStr)
        : undefined,
    sort: validSorts.includes(sortRaw) ? sortRaw : 'popular',
    page: pageStr ? Math.max(1, parseInt(pageStr, 10) || 1) : 1,
    pageSize: pageSizeStr
      ? Math.min(50, Math.max(1, parseInt(pageSizeStr, 10) || 12))
      : 12,
  };
}

export function filtersToSearchParams(
  filters: Partial<MarketplaceFilters>
): URLSearchParams {
  const sp = new URLSearchParams();
  if (filters.q) sp.set('q', filters.q);
  if (filters.types?.length) sp.set('types', filters.types.join(','));
  if (filters.orgs?.length) sp.set('orgs', filters.orgs.join(','));
  if (filters.regions?.length) sp.set('regions', filters.regions.join(','));
  if (filters.capabilities?.length)
    sp.set('capabilities', filters.capabilities.join(','));
  if (filters.tags?.length) sp.set('tags', filters.tags.join(','));
  if (filters.derivedTags?.length)
    sp.set('derivedTags', filters.derivedTags.join(','));
  if (filters.priceMax !== undefined) sp.set('priceMax', String(filters.priceMax));
  if (filters.sort && filters.sort !== 'popular') sp.set('sort', filters.sort);
  if (filters.page && filters.page > 1) sp.set('page', String(filters.page));
  return sp;
}

function normalizeText(s: string): string {
  return s.toLowerCase().trim();
}

function priceOf(m: CatalogModel): number {
  const p = m.pricing;
  if (p.inputPer1k !== undefined) return p.inputPer1k;
  if (p.perImage !== undefined) return p.perImage;
  if (p.perMinute !== undefined) return p.perMinute;
  if (p.perSecond !== undefined) return p.perSecond;
  return 0;
}

export function matchModel(m: CatalogModel, f: MarketplaceFilters): boolean {
  if (f.q) {
    const q = normalizeText(f.q);
    const haystack = normalizeText(
      `${m.name} ${m.orgName} ${m.shortDescription} ${m.description} ${m.tags.join(' ')}`
    );
    if (!haystack.includes(q)) return false;
  }
  if (f.types.length && !f.types.includes(m.type)) return false;
  if (f.orgs.length && !f.orgs.includes(m.orgSlug)) return false;
  if (f.regions.length && !f.regions.includes(m.hostingRegion)) return false;
  if (f.capabilities.length) {
    for (const cap of f.capabilities) {
      if (!m.capabilities[cap]) return false;
    }
  }
  if (f.tags.length && !f.tags.some((t) => m.tags.includes(t))) return false;
  if (
    f.derivedTags.length &&
    !f.derivedTags.some((t) => m.derivedTags.includes(t))
  )
    return false;
  if (f.priceMax !== undefined && priceOf(m) > f.priceMax) return false;
  return true;
}

function compareForSort(
  a: CatalogModel,
  b: CatalogModel,
  sort: MarketplaceFilters['sort']
): number {
  switch (sort) {
    case 'rating':
      return b.stats.avgRating - a.stats.avgRating;
    case 'cheap':
      return priceOf(a) - priceOf(b);
    case 'fast':
      return a.stats.p50LatencyMs - b.stats.p50LatencyMs;
    case 'new':
      return a.slug.localeCompare(b.slug);
    case 'popular':
    default:
      return b.stats.weeklyRequests - a.stats.weeklyRequests;
  }
}

export interface FilterResult {
  items: CatalogModel[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export function applyFilters(
  all: CatalogModel[],
  f: MarketplaceFilters
): FilterResult {
  const filtered = all.filter((m) => matchModel(m, f));
  filtered.sort((a, b) => compareForSort(a, b, f.sort));
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / f.pageSize));
  const page = Math.min(f.page, totalPages);
  const start = (page - 1) * f.pageSize;
  const items = filtered.slice(start, start + f.pageSize);
  return { items, total, page, pageSize: f.pageSize, totalPages };
}

export const DEFAULT_FILTERS = DEFAULTS;
