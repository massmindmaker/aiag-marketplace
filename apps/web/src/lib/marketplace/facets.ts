import type { CatalogModel } from './catalog';

/**
 * Pre-render facet data for the marketplace filter panel from a server-side
 * model list. Lives in `lib/` (server-safe) — was previously co-located in
 * `components/marketplace/FilterPanel.tsx`, but that file is a `'use client'`
 * component, and exporting a server helper from a client module makes
 * Next.js 14 emit a client reference. Importing it back from a server
 * component then throws "TypeError: f is not a function" at render time.
 */
export function computeFacets(models: CatalogModel[]): {
  orgs: Array<{ slug: string; name: string; count: number }>;
  tags: Array<{ tag: string; count: number }>;
} {
  const orgMap = new Map<
    string,
    { slug: string; name: string; count: number }
  >();
  const tagMap = new Map<string, number>();
  for (const m of models) {
    const o = orgMap.get(m.orgSlug);
    if (o) o.count += 1;
    else
      orgMap.set(m.orgSlug, { slug: m.orgSlug, name: m.orgName, count: 1 });
    for (const t of m.tags) tagMap.set(t, (tagMap.get(t) || 0) + 1);
  }
  return {
    orgs: Array.from(orgMap.values()).sort((a, b) => b.count - a.count),
    tags: Array.from(tagMap.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count),
  };
}
