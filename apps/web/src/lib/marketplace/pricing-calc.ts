/**
 * Plan 06 — Per-modality cost estimator for the marketplace pricing calculator.
 *
 * All prices in RUB. Gateway markup is applied on top of the upstream price
 * so that the public value stays stable when upstream prices fluctuate.
 */

import type { CatalogModel } from './catalog';

export const GATEWAY_MARKUP_PCT = 15;

export interface UsageEstimate {
  /** chat/embedding: requests per day */
  requestsPerDay?: number;
  /** chat/embedding: avg input tokens per request */
  avgInputTokens?: number;
  /** chat: avg output tokens per request */
  avgOutputTokens?: number;
  /** image: images per day */
  imagesPerDay?: number;
  /** audio: minutes per day */
  minutesPerDay?: number;
  /** video: seconds per day */
  secondsPerDay?: number;
}

export interface CostBreakdown {
  perDayRub: number;
  perMonthRub: number;
  upstreamRub: number;
  markupRub: number;
  markupPct: number;
  unit: string;
}

function withMarkup(amount: number): { total: number; markup: number } {
  const markup = (amount * GATEWAY_MARKUP_PCT) / 100;
  return { total: amount + markup, markup };
}

export function estimateCost(
  model: CatalogModel,
  usage: UsageEstimate
): CostBreakdown {
  const p = model.pricing;
  let upstream = 0;
  const unit = p.unit ?? 'unit';

  if (p.inputPer1k !== undefined || p.outputPer1k !== undefined) {
    const requests = usage.requestsPerDay ?? 0;
    const inputTok = (usage.avgInputTokens ?? 0) * requests;
    const outputTok = (usage.avgOutputTokens ?? 0) * requests;
    upstream =
      (inputTok / 1000) * (p.inputPer1k ?? 0) +
      (outputTok / 1000) * (p.outputPer1k ?? 0);
  } else if (p.perImage !== undefined) {
    upstream = (usage.imagesPerDay ?? 0) * p.perImage;
  } else if (p.perMinute !== undefined) {
    upstream = (usage.minutesPerDay ?? 0) * p.perMinute;
  } else if (p.perSecond !== undefined) {
    upstream = (usage.secondsPerDay ?? 0) * p.perSecond;
  }

  const { total, markup } = withMarkup(upstream);
  return {
    perDayRub: roundRub(total),
    perMonthRub: roundRub(total * 30),
    upstreamRub: roundRub(upstream),
    markupRub: roundRub(markup),
    markupPct: GATEWAY_MARKUP_PCT,
    unit,
  };
}

function roundRub(n: number): number {
  return Math.round(n * 100) / 100;
}

export function formatRub(amount: number): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: amount < 10 ? 2 : 0,
  }).format(amount);
}

/** For model cards — compact price label. */
export function formatPriceLabel(model: CatalogModel): string {
  const p = model.pricing;
  if (p.inputPer1k !== undefined && p.outputPer1k !== undefined) {
    return `${formatRub(p.inputPer1k)} / ${formatRub(p.outputPer1k)} за ${p.unit}`;
  }
  if (p.inputPer1k !== undefined) {
    return `${formatRub(p.inputPer1k)} за ${p.unit}`;
  }
  if (p.perImage !== undefined) return `${formatRub(p.perImage)} / ${p.unit}`;
  if (p.perMinute !== undefined) return `${formatRub(p.perMinute)} / ${p.unit}`;
  if (p.perSecond !== undefined) return `${formatRub(p.perSecond)} / ${p.unit}`;
  return '—';
}
