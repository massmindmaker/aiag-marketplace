/**
 * Plan 07 — RU tax withholding rules for author payouts.
 *
 * physical_person  — withhold 13% / 15% progressive NDFL (платформа платит в бюджет)
 * self_employed    — no withholding; автор сам выставляет чек «Мой налог» (6%), мы платим gross
 * ie / ltd         — no withholding; автор выставляет инвойс, мы платим по счёту
 *
 * 2026 progressive NDFL (упрощённая модель, MVP):
 *   ≤ 5_000_000 RUB YTD → 13%
 *   > 5_000_000 RUB YTD → 15% на сумму сверх 5M
 */

export type PayoutMethod = 'card_ru' | 'ip_account' | 'ooo_account' | 'smz_check';
export type AuthorTaxStatus = 'physical_person' | 'self_employed' | 'ie' | 'ltd';

export const NDFL_PROGRESSIVE_THRESHOLD_RUB = 5_000_000;
export const NDFL_LOW_RATE = 0.13;
export const NDFL_HIGH_RATE = 0.15;

export const MIN_PAYOUT_RUB = 1000;

export function taxStatusForMethod(method: PayoutMethod): AuthorTaxStatus {
  switch (method) {
    case 'card_ru':
      return 'physical_person';
    case 'smz_check':
      return 'self_employed';
    case 'ip_account':
      return 'ie';
    case 'ooo_account':
      return 'ltd';
  }
}

/**
 * Progressive NDFL withholding. `cumulativeYtdRub` = суммарный доход автора
 * за календарный год ДО текущей выплаты.
 *
 * Returns the amount (RUB) to withhold for a `grossAmountRub` payout.
 */
export function computeWithholdingNdfl(
  grossAmountRub: number,
  cumulativeYtdRub: number
): number {
  if (grossAmountRub <= 0) return 0;
  const startYtd = cumulativeYtdRub;
  const endYtd = cumulativeYtdRub + grossAmountRub;

  const lowPortion = Math.max(
    0,
    Math.min(endYtd, NDFL_PROGRESSIVE_THRESHOLD_RUB) - Math.min(startYtd, NDFL_PROGRESSIVE_THRESHOLD_RUB)
  );
  const highPortion = Math.max(
    0,
    endYtd - Math.max(startYtd, NDFL_PROGRESSIVE_THRESHOLD_RUB)
  );

  return (
    Math.round((lowPortion * NDFL_LOW_RATE + highPortion * NDFL_HIGH_RATE) * 100) / 100
  );
}

export interface WithholdingResult {
  grossRub: number;
  withholdingRub: number;
  netRub: number;
  taxStatus: AuthorTaxStatus;
  rule: 'ndfl_progressive' | 'self_employed_pass_through' | 'business_invoice';
}

export function computeWithholding(opts: {
  grossAmountRub: number;
  method: PayoutMethod;
  cumulativeYtdRub: number;
}): WithholdingResult {
  const taxStatus = taxStatusForMethod(opts.method);
  const { grossAmountRub, cumulativeYtdRub } = opts;

  if (taxStatus === 'physical_person') {
    const wh = computeWithholdingNdfl(grossAmountRub, cumulativeYtdRub);
    return {
      grossRub: grossAmountRub,
      withholdingRub: wh,
      netRub: Math.round((grossAmountRub - wh) * 100) / 100,
      taxStatus,
      rule: 'ndfl_progressive',
    };
  }

  // self-employed or IE/LTD — we pay gross; they handle their own tax.
  return {
    grossRub: grossAmountRub,
    withholdingRub: 0,
    netRub: grossAmountRub,
    taxStatus,
    rule:
      taxStatus === 'self_employed' ? 'self_employed_pass_through' : 'business_invoice',
  };
}
