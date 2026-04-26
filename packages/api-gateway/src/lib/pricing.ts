import { config } from '../config';

export type PricingArgs = {
  upstreamUsd: number;
  rate: number;
  /** Per-upstream markup (model_upstreams.markup). Pass upstream.markup — do
   *  NOT fallback to config.DEFAULT_MARKUP here (FIX C8). */
  markup: number;
  /** Applied in /v1/batches route (Task 14). Default 1 (no discount). */
  batchDiscount?: number;
  cachedInputTokens?: number;
  totalInputTokens?: number;
};

/**
 * Calculate cost in RUB for an upstream call.
 *
 *     cost_rub = upstream_usd × rate × markup × batchDiscount × cachingFactor
 *
 * Caching factor applies a per-token discount CACHING_DISCOUNT
 * (default 0.5) on the cached fraction of input tokens.
 */
export function calcCostRub(args: PricingArgs): number {
  const { upstreamUsd, rate, markup, batchDiscount = 1 } = args;
  let caching = 1;
  if (
    args.cachedInputTokens &&
    args.totalInputTokens &&
    args.totalInputTokens > 0
  ) {
    const cachedFrac = args.cachedInputTokens / args.totalInputTokens;
    caching = 1 - cachedFrac + cachedFrac * config.CACHING_DISCOUNT;
  }
  return upstreamUsd * rate * markup * batchDiscount * caching;
}

/** FIX C8: BYOK — fixed fee in RUB, bypasses markup. */
export function calcByokFeeRub(): number {
  return config.BYOK_FEE_RUB;
}
