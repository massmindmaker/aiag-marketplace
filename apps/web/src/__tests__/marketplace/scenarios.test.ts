import { describe, it, expect } from 'vitest';
import {
  SCENARIOS,
  getAllScenarios,
  getScenarioBySlug,
} from '@/lib/marketplace/scenarios';
import { getModelBySlug } from '@/lib/marketplace/catalog';

describe('scenarios catalog', () => {
  it('has at least 5 scenarios', () => {
    expect(SCENARIOS.length).toBeGreaterThanOrEqual(5);
  });

  it('every scenario has a unique slug', () => {
    const slugs = new Set(SCENARIOS.map((s) => s.slug));
    expect(slugs.size).toBe(SCENARIOS.length);
  });

  it('every recommendedModelSlug exists in the catalog', () => {
    for (const s of SCENARIOS) {
      const m = getModelBySlug(s.recommendedModelSlug);
      expect(m, `missing model: ${s.recommendedModelSlug}`).toBeDefined();
    }
  });

  it('getScenarioBySlug returns undefined for unknown slug', () => {
    expect(getScenarioBySlug('nope')).toBeUndefined();
  });

  it('getAllScenarios matches SCENARIOS length', () => {
    expect(getAllScenarios().length).toBe(SCENARIOS.length);
  });
});
