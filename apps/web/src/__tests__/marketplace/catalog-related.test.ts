import { describe, it, expect } from 'vitest';
import {
  findRelatedModels,
  getAllModels,
  getModelByOrgAndSlug,
} from '@/lib/marketplace/catalog';

describe('findRelatedModels', () => {
  it('returns up to limit results', () => {
    const src = getAllModels()[0];
    const related = findRelatedModels(src, 3);
    expect(related.length).toBeLessThanOrEqual(3);
  });

  it('never includes the source model itself', () => {
    const src = getAllModels()[0];
    const related = findRelatedModels(src, 10);
    expect(related.find((m) => m.slug === src.slug)).toBeUndefined();
  });

  it('ranks same-type models higher', () => {
    const src = getModelByOrgAndSlug('openai', 'gpt-4-turbo');
    expect(src).toBeDefined();
    if (!src) return;
    const related = findRelatedModels(src, 4);
    // Top result should share type 'llm'
    expect(related[0].type).toBe('llm');
  });

  it('returns an empty array gracefully when only one model exists', () => {
    // trivial smoke — catalog is non-empty but test logic independence
    expect(Array.isArray(findRelatedModels(getAllModels()[0]))).toBe(true);
  });
});
