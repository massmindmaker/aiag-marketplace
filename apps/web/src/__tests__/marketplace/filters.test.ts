import { describe, it, expect } from 'vitest';
import {
  parseFiltersFromSearchParams,
  filtersToSearchParams,
  applyFilters,
  matchModel,
} from '@/lib/marketplace/filters';
import { CATALOG } from '@/lib/marketplace/catalog';

describe('filters/parseFiltersFromSearchParams', () => {
  it('returns defaults for empty params', () => {
    const f = parseFiltersFromSearchParams(new URLSearchParams());
    expect(f.types).toEqual([]);
    expect(f.orgs).toEqual([]);
    expect(f.sort).toBe('popular');
    expect(f.page).toBe(1);
    expect(f.pageSize).toBe(12);
  });

  it('parses comma-separated lists', () => {
    const sp = new URLSearchParams('types=llm,image&orgs=openai&tags=code,reasoning');
    const f = parseFiltersFromSearchParams(sp);
    expect(f.types).toEqual(['llm', 'image']);
    expect(f.orgs).toEqual(['openai']);
    expect(f.tags).toEqual(['code', 'reasoning']);
  });

  it('parses priceMax as number; invalid → undefined', () => {
    expect(parseFiltersFromSearchParams(new URLSearchParams('priceMax=1.5')).priceMax).toBe(1.5);
    expect(parseFiltersFromSearchParams(new URLSearchParams('priceMax=abc')).priceMax).toBeUndefined();
  });

  it('clamps page/pageSize', () => {
    const f = parseFiltersFromSearchParams(new URLSearchParams('page=-5&pageSize=999'));
    expect(f.page).toBe(1);
    expect(f.pageSize).toBe(50);
  });

  it('falls back to "popular" on invalid sort', () => {
    const f = parseFiltersFromSearchParams(new URLSearchParams('sort=garbage'));
    expect(f.sort).toBe('popular');
  });

  it('also accepts plain record (Next.js searchParams)', () => {
    const f = parseFiltersFromSearchParams({ types: 'llm', q: 'gpt' });
    expect(f.types).toEqual(['llm']);
    expect(f.q).toBe('gpt');
  });
});

describe('filters/filtersToSearchParams', () => {
  it('omits defaults', () => {
    const sp = filtersToSearchParams({
      types: [],
      orgs: [],
      sort: 'popular',
      page: 1,
    });
    expect(sp.toString()).toBe('');
  });

  it('round-trips values', () => {
    const sp = filtersToSearchParams({
      q: 'claude',
      types: ['llm'],
      sort: 'cheap',
      page: 3,
    });
    const parsed = parseFiltersFromSearchParams(sp);
    expect(parsed.q).toBe('claude');
    expect(parsed.types).toEqual(['llm']);
    expect(parsed.sort).toBe('cheap');
    expect(parsed.page).toBe(3);
  });
});

describe('filters/matchModel', () => {
  const gpt = CATALOG.find((m) => m.slug === 'openai/gpt-4-turbo')!;
  const yandex = CATALOG.find((m) => m.slug === 'yandex/yandexgpt-5')!;
  const dalle = CATALOG.find((m) => m.slug === 'openai/dall-e-3')!;
  const base = parseFiltersFromSearchParams(new URLSearchParams());

  it('text search matches name/description/tags', () => {
    expect(matchModel(gpt, { ...base, q: 'gpt-4' })).toBe(true);
    expect(matchModel(yandex, { ...base, q: 'gpt-4' })).toBe(false);
    expect(matchModel(yandex, { ...base, q: 'russian' })).toBe(true);
  });

  it('type filter', () => {
    expect(matchModel(gpt, { ...base, types: ['llm'] })).toBe(true);
    expect(matchModel(dalle, { ...base, types: ['llm'] })).toBe(false);
  });

  it('org filter', () => {
    expect(matchModel(gpt, { ...base, orgs: ['openai'] })).toBe(true);
    expect(matchModel(yandex, { ...base, orgs: ['openai'] })).toBe(false);
  });

  it('region filter', () => {
    expect(matchModel(yandex, { ...base, regions: ['ru'] })).toBe(true);
    expect(matchModel(gpt, { ...base, regions: ['ru'] })).toBe(false);
  });

  it('capabilities AND-match', () => {
    expect(matchModel(gpt, { ...base, capabilities: ['tools', 'vision'] })).toBe(true);
    expect(matchModel(yandex, { ...base, capabilities: ['tools'] })).toBe(false);
  });

  it('priceMax', () => {
    expect(matchModel(yandex, { ...base, priceMax: 0.3 })).toBe(true);
    expect(matchModel(gpt, { ...base, priceMax: 0.3 })).toBe(false);
  });
});

describe('filters/applyFilters', () => {
  const base = parseFiltersFromSearchParams(new URLSearchParams());

  it('paginates', () => {
    const r1 = applyFilters(CATALOG, { ...base, pageSize: 5, page: 1 });
    const r2 = applyFilters(CATALOG, { ...base, pageSize: 5, page: 2 });
    expect(r1.items).toHaveLength(5);
    expect(r1.total).toBe(CATALOG.length);
    expect(r2.items[0].slug).not.toBe(r1.items[0].slug);
  });

  it('sorts by rating', () => {
    const r = applyFilters(CATALOG, { ...base, sort: 'rating' });
    expect(r.items[0].stats.avgRating).toBeGreaterThanOrEqual(r.items[1].stats.avgRating);
  });

  it('sorts by fast (latency asc)', () => {
    const r = applyFilters(CATALOG, { ...base, sort: 'fast', pageSize: 50 });
    for (let i = 1; i < r.items.length; i++) {
      expect(r.items[i].stats.p50LatencyMs).toBeGreaterThanOrEqual(r.items[i - 1].stats.p50LatencyMs);
    }
  });

  it('clamps out-of-range page to last page', () => {
    const r = applyFilters(CATALOG, { ...base, page: 999, pageSize: 5 });
    expect(r.page).toBe(r.totalPages);
  });
});
