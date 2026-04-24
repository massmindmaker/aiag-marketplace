import { describe, it, expect } from 'vitest';
import {
  estimateCost,
  formatPriceLabel,
  formatRub,
  GATEWAY_MARKUP_PCT,
} from '@/lib/marketplace/pricing-calc';
import { CATALOG } from '@/lib/marketplace/catalog';

const gpt = CATALOG.find((m) => m.slug === 'openai/gpt-4-turbo')!;
const dalle = CATALOG.find((m) => m.slug === 'openai/dall-e-3')!;
const whisper = CATALOG.find((m) => m.slug === 'openai/whisper-large-v3')!;

describe('estimateCost', () => {
  it('applies 15% markup', () => {
    expect(GATEWAY_MARKUP_PCT).toBe(15);
    const r = estimateCost(gpt, {
      requestsPerDay: 1000,
      avgInputTokens: 1000,
      avgOutputTokens: 500,
    });
    // upstream = 1000 * (1 * 0.9 + 0.5 * 2.7) = 1000 * 2.25 = 2250
    expect(r.upstreamRub).toBeCloseTo(2250, 1);
    expect(r.perDayRub).toBeCloseTo(2587.5, 1);
    expect(r.markupRub).toBeCloseTo(337.5, 1);
  });

  it('monthly = daily × 30', () => {
    const r = estimateCost(gpt, {
      requestsPerDay: 100,
      avgInputTokens: 500,
      avgOutputTokens: 500,
    });
    expect(r.perMonthRub).toBeCloseTo(r.perDayRub * 30, 1);
  });

  it('image modality', () => {
    const r = estimateCost(dalle, { imagesPerDay: 10 });
    // 10 * 7.5 = 75 upstream, * 1.15 = 86.25
    expect(r.upstreamRub).toBe(75);
    expect(r.perDayRub).toBeCloseTo(86.25, 2);
  });

  it('audio modality', () => {
    const r = estimateCost(whisper, { minutesPerDay: 100 });
    expect(r.upstreamRub).toBe(60);
  });

  it('returns zero on empty usage', () => {
    const r = estimateCost(gpt, {});
    expect(r.perDayRub).toBe(0);
    expect(r.perMonthRub).toBe(0);
  });
});

describe('formatPriceLabel', () => {
  it('shows input/output for llm', () => {
    const s = formatPriceLabel(gpt);
    expect(s).toMatch(/1K токенов/);
  });
  it('shows per-image for image models', () => {
    expect(formatPriceLabel(dalle)).toMatch(/изображение/);
  });
});

describe('formatRub', () => {
  it('formats with Russian locale', () => {
    const s = formatRub(1500);
    expect(s).toMatch(/₽|руб/i);
  });
});
