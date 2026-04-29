/**
 * Promo code application logic — pure function, fully testable.
 *
 * Rules:
 *   - kind=percent_off, value=N → discount = amount * N / 100
 *   - kind=fixed_off,   value=N → discount = N (capped at amount)
 *   - kind=free_credit, value=N → adds N rubles to PAYG credits, no discount on charge
 *
 * Returns:
 *   { ok: true, chargeRub, creditRub, discountRub }
 *   { ok: false, reason: 'EXPIRED' | 'NOT_ACTIVE' | 'EXHAUSTED' | 'BELOW_MIN' | 'PER_USER_LIMIT' | 'KIND_MISMATCH' }
 */

export type PromoKind = 'percent_off' | 'fixed_off' | 'free_credit';
export type PromoAppliesTo = 'topup' | 'subscription' | 'first_topup_only';

export interface PromoCode {
  id: string;
  code: string;
  kind: PromoKind;
  value: number;
  minAmountRub: number | null;
  maxUses: number | null;
  usesCount: number;
  perUserLimit: number;
  validFrom: Date | string | null;
  validUntil: Date | string | null;
  appliesTo: PromoAppliesTo;
  active: boolean;
}

export interface ApplyContext {
  amountRub: number;
  userRedemptionsCount: number; // how many times this user has redeemed THIS promo
  userHasPriorTopups: boolean; // for first_topup_only gating
  now?: Date;
}

export type ApplyResult =
  | { ok: true; chargeRub: number; creditRub: number; discountRub: number }
  | {
      ok: false;
      reason:
        | 'EXPIRED'
        | 'NOT_ACTIVE'
        | 'EXHAUSTED'
        | 'BELOW_MIN'
        | 'PER_USER_LIMIT'
        | 'NOT_FIRST_TOPUP'
        | 'BAD_AMOUNT';
    };

function toDate(v: Date | string | null | undefined): Date | null {
  if (!v) return null;
  if (v instanceof Date) return v;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
}

export function applyPromo(promo: PromoCode, ctx: ApplyContext): ApplyResult {
  const now = ctx.now ?? new Date();

  if (!promo.active) return { ok: false, reason: 'NOT_ACTIVE' };
  if (!Number.isFinite(ctx.amountRub) || ctx.amountRub <= 0) {
    return { ok: false, reason: 'BAD_AMOUNT' };
  }

  const vf = toDate(promo.validFrom);
  const vu = toDate(promo.validUntil);
  if (vf && now < vf) return { ok: false, reason: 'NOT_ACTIVE' };
  if (vu && now > vu) return { ok: false, reason: 'EXPIRED' };

  if (promo.maxUses != null && promo.usesCount >= promo.maxUses) {
    return { ok: false, reason: 'EXHAUSTED' };
  }
  if (ctx.userRedemptionsCount >= promo.perUserLimit) {
    return { ok: false, reason: 'PER_USER_LIMIT' };
  }
  if (promo.minAmountRub != null && ctx.amountRub < Number(promo.minAmountRub)) {
    return { ok: false, reason: 'BELOW_MIN' };
  }
  if (promo.appliesTo === 'first_topup_only' && ctx.userHasPriorTopups) {
    return { ok: false, reason: 'NOT_FIRST_TOPUP' };
  }

  const amount = Number(ctx.amountRub);
  const v = Number(promo.value);
  let discount = 0;
  let credit = 0;
  switch (promo.kind) {
    case 'percent_off':
      discount = Math.min(amount, +(amount * (v / 100)).toFixed(2));
      break;
    case 'fixed_off':
      discount = Math.min(amount, +v.toFixed(2));
      break;
    case 'free_credit':
      credit = +v.toFixed(2);
      break;
  }
  const charge = +(amount - discount).toFixed(2);
  return { ok: true, chargeRub: charge, creditRub: credit, discountRub: discount };
}
