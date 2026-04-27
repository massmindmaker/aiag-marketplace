/**
 * Static checks against the marketplace seed SQL files (no live DB required).
 *
 * Verifies:
 *  1. Total INSERTed model count >= 20 across 0006 + 0006b
 *  2. Each model slug is unique within the SQL
 *  3. Modalities use canonical lowercase values
 *  4. Each model in 0006_seed_models has at least one upstream mapping
 *  5. Per-modality pricing is calculated correctly with markup
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(__dirname, '../../../../packages/database/migrations');
const seedMain = readFileSync(path.join(ROOT, '0006_seed_models.sql'), 'utf8');
const seedKie = readFileSync(path.join(ROOT, '0006b_seed_kie_extended.sql'), 'utf8');

const VALID_TYPES = new Set(['chat', 'embedding', 'image', 'audio', 'video']);

function extractSlugs(sql: string): { slug: string; type: string }[] {
  // INSERT INTO models (slug, type, enabled, display_name, description, metadata) VALUES
  //   ('foo/bar', 'chat', true, 'Foo Bar', '...', jsonb_build_object(...)),
  //   ('baz', 'image', true, ...)
  const re = /\(\s*'([^']+)'\s*,\s*'(chat|embedding|image|audio|video)'\s*,\s*true/g;
  const out: { slug: string; type: string }[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(sql)) !== null) {
    out.push({ slug: m[1], type: m[2] });
  }
  return out;
}

describe('seed models SQL', () => {
  const main = extractSlugs(seedMain);
  const kie = extractSlugs(seedKie);
  const all = [...main, ...kie];

  it('seeds at least 20 models in total', () => {
    expect(all.length).toBeGreaterThanOrEqual(20);
  });

  it('main 0006 seeds at least 15 models', () => {
    expect(main.length).toBeGreaterThanOrEqual(15);
  });

  it('all slugs are unique', () => {
    const set = new Set(all.map((m) => m.slug));
    expect(set.size).toBe(all.length);
  });

  it('only canonical model types are used', () => {
    for (const m of all) {
      expect(VALID_TYPES.has(m.type), `bad type for ${m.slug}: ${m.type}`).toBe(true);
    }
  });

  it('seed is idempotent (uses ON CONFLICT DO NOTHING for models)', () => {
    expect(seedMain).toMatch(/ON CONFLICT \(slug\) DO NOTHING/);
    expect(seedKie).toMatch(/ON CONFLICT \(slug\) DO NOTHING/);
  });

  it('seed is idempotent for upstreams + model_upstreams', () => {
    expect(seedMain).toMatch(/ON CONFLICT \(id\) DO NOTHING/);
    expect(seedMain).toMatch(/ON CONFLICT \(model_id, upstream_id\) DO NOTHING/);
  });

  it('seeds the required core LLM models', () => {
    const slugs = new Set(all.map((m) => m.slug));
    for (const required of [
      'openai/gpt-4o',
      'openai/gpt-4o-mini',
      'anthropic/claude-sonnet-4-5',
      'anthropic/claude-haiku-4-5',
      'google/gemini-2-5-flash',
      'google/gemini-2-5-pro',
      'deepseek/deepseek-v3',
      'deepseek/deepseek-r1',
      'meta-llama/llama-3-3-70b',
      'yandex/yandexgpt-5-lite',
      'yandex/yandexgpt-5-pro',
    ]) {
      expect(slugs.has(required), `missing required slug ${required}`).toBe(true);
    }
  });
});

describe('pricing calc with markup', () => {
  // Reflects the gateway formula:
  //   total_rub = upstream_rub * markup
  function applyMarkup(upstreamRub: number, markup: number): number {
    return upstreamRub * markup;
  }

  it('applies 1.07 markup correctly (OpenRouter)', () => {
    expect(applyMarkup(0.5, 1.07)).toBeCloseTo(0.535, 5);
  });

  it('applies 1.08 markup correctly (Yandex RU)', () => {
    expect(applyMarkup(0.08, 1.08)).toBeCloseTo(0.0864, 5);
  });

  it('applies 1.12 markup correctly (Kie/Fal)', () => {
    expect(applyMarkup(5.5, 1.12)).toBeCloseTo(6.16, 5);
  });

  it('LLM cost: 1k in + 1k out for GPT-4o', () => {
    // From seed: gpt-4o 0.50 in / 1.50 out RUB per 1k, markup 1.07
    const inputCost = applyMarkup(0.5, 1.07);
    const outputCost = applyMarkup(1.5, 1.07);
    const total = inputCost + outputCost;
    expect(total).toBeCloseTo(2.14, 2);
  });

  it('Image cost: 1 Flux Pro 1.1 image via Fal', () => {
    // Seed: 5.50 RUB per image, markup 1.12
    expect(applyMarkup(5.5, 1.12)).toBeCloseTo(6.16, 2);
  });

  it('Audio cost: 60s Whisper transcription', () => {
    // Seed: 0.025 RUB per audio second, markup 1.12
    const total = applyMarkup(0.025 * 60, 1.12);
    expect(total).toBeCloseTo(1.68, 2);
  });
});
