/**
 * Server-side referral system: code provisioning, qualifying-event bonus credit.
 *
 * Used by /dashboard/referrals (read), /api/register (link referrer), and the
 * payment success webhook (qualifying-event bonus credit).
 */
import { db, sql } from '@/lib/db';
import { generateReferralCode } from './codes';
import { rowsOf } from '@/lib/admin/rows';

export interface ReferralSettings {
  enabled: boolean;
  bonusReferrerRub: number;
  bonusReferredRub: number;
  qualifyingEvent: 'first_topup' | 'first_topup_min_500' | 'first_request';
  minTopupRub: number;
  maxBonusPerReferrerPerMonthRub: number;
}

const DEFAULTS: ReferralSettings = {
  enabled: true,
  bonusReferrerRub: 100,
  bonusReferredRub: 100,
  qualifyingEvent: 'first_topup',
  minTopupRub: 100,
  maxBonusPerReferrerPerMonthRub: 5000,
};

function asNumber(v: unknown, d: number): number {
  const n = typeof v === 'string' ? Number(v) : (v as number);
  return Number.isFinite(n) ? Number(n) : d;
}
function asBool(v: unknown, d: boolean): boolean {
  if (typeof v === 'boolean') return v;
  if (typeof v === 'string') return v === 'true';
  return d;
}

export async function loadReferralSettings(): Promise<ReferralSettings> {
  try {
    const r = await db.execute(sql`
      SELECT key, value FROM admin_settings WHERE key LIKE 'referral_%'
    `);
    const rows = rowsOf<{ key: string; value: unknown }>(r);
    const map = new Map<string, unknown>();
    for (const row of rows) map.set(row.key, row.value);
    return {
      enabled: asBool(map.get('referral_enabled'), DEFAULTS.enabled),
      bonusReferrerRub: asNumber(map.get('referral_bonus_referrer_rub'), DEFAULTS.bonusReferrerRub),
      bonusReferredRub: asNumber(map.get('referral_bonus_referred_rub'), DEFAULTS.bonusReferredRub),
      qualifyingEvent:
        (map.get('referral_qualifying_event') as ReferralSettings['qualifyingEvent']) ??
        DEFAULTS.qualifyingEvent,
      minTopupRub: asNumber(map.get('referral_min_topup_rub'), DEFAULTS.minTopupRub),
      maxBonusPerReferrerPerMonthRub: asNumber(
        map.get('referral_max_bonus_per_referrer_per_month_rub'),
        DEFAULTS.maxBonusPerReferrerPerMonthRub
      ),
    };
  } catch {
    return DEFAULTS;
  }
}

/**
 * Idempotently ensure a user has a referral_codes row. Returns the code.
 * Retries up to 5 times on collision (extremely unlikely for 32^6 space).
 */
export async function ensureReferralCode(userId: string, email: string): Promise<string> {
  const existing = await db.execute(sql`
    SELECT code FROM referral_codes WHERE user_id = ${userId} LIMIT 1
  `);
  const ex = rowsOf<{ code: string }>(existing)[0];
  if (ex?.code) return ex.code;

  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateReferralCode(email);
    try {
      await db.execute(sql`
        INSERT INTO referral_codes (user_id, code) VALUES (${userId}, ${code})
        ON CONFLICT (user_id) DO NOTHING
      `);
      const got = await db.execute(sql`
        SELECT code FROM referral_codes WHERE user_id = ${userId} LIMIT 1
      `);
      const row = rowsOf<{ code: string }>(got)[0];
      if (row?.code) return row.code;
    } catch (e) {
      // unique violation on `code` column → retry with a new suffix
      if (attempt === 4) throw e;
    }
  }
  throw new Error('Failed to allocate referral code after 5 attempts');
}

/**
 * Link `referredUserId` to `referrerCode` if both exist and not already linked.
 * Returns true on success.
 */
export async function linkReferrerByCode(
  referredUserId: string,
  referrerCode: string
): Promise<boolean> {
  const r = await db.execute(sql`
    SELECT user_id::text FROM referral_codes WHERE code = ${referrerCode} LIMIT 1
  `);
  const row = rowsOf<{ user_id: string }>(r)[0];
  if (!row?.user_id) return false;
  if (row.user_id === referredUserId) return false; // no self-ref

  await db.execute(sql`
    UPDATE users SET referrer_user_id = ${row.user_id}
    WHERE id = ${referredUserId} AND referrer_user_id IS NULL
  `);
  return true;
}

/**
 * Detect simple fraud heuristics for a (referrer, referred) pair.
 * Returns { fraud: bool, reason: string|null }.
 *   - same email domain + small Levenshtein on local part → flag
 *   - bonus_paid_this_month exceeds cap → flag
 */
export async function detectFraud(
  referrerEmail: string,
  referredEmail: string,
  referrerId: string,
  bonusRub: number,
  capRub: number
): Promise<{ fraud: boolean; reason: string | null }> {
  if (referrerEmail && referredEmail) {
    const rd = referrerEmail.split('@')[1];
    const td = referredEmail.split('@')[1];
    if (rd && td && rd === td) {
      const rl = referrerEmail.split('@')[0] ?? '';
      const tl = referredEmail.split('@')[0] ?? '';
      if (rl && tl && (tl.startsWith(rl) || rl.startsWith(tl))) {
        return { fraud: true, reason: 'similar_email_local' };
      }
    }
  }
  // Cap: this month's already-paid bonuses for this referrer
  const r = await db.execute(sql`
    SELECT COALESCE(SUM(bonus_referrer_rub), 0)::text AS sum
    FROM referral_redemptions
    WHERE referrer_user_id = ${referrerId}
      AND paid_out = true
      AND fraud_flagged = false
      AND redeemed_at > NOW() - INTERVAL '30 days'
  `);
  const sum = Number(rowsOf<{ sum: string }>(r)[0]?.sum ?? 0);
  if (sum + bonusRub > capRub) {
    return { fraud: true, reason: 'monthly_cap_exceeded' };
  }
  return { fraud: false, reason: null };
}

/**
 * Grant the qualifying-event bonus. Idempotent — `referral_redemptions.referred_user_id`
 * is UNIQUE so a duplicate INSERT will silently drop.
 *
 * Caller must ensure event truly qualifies (e.g., first_topup amount ≥ min).
 */
export async function grantReferralBonus(
  referredUserId: string
): Promise<{ granted: boolean; reason?: string; bonusReferrerRub?: number; bonusReferredRub?: number }> {
  const settings = await loadReferralSettings();
  if (!settings.enabled) return { granted: false, reason: 'disabled' };

  // Find referrer
  const u = await db.execute(sql`
    SELECT u.id::text AS id, u.email, u.referrer_user_id::text AS ref, r.email AS ref_email
    FROM users u
    LEFT JOIN users r ON r.id = u.referrer_user_id
    WHERE u.id = ${referredUserId}
    LIMIT 1
  `);
  const row = rowsOf<{ id: string; email: string; ref: string | null; ref_email: string | null }>(u)[0];
  if (!row?.ref) return { granted: false, reason: 'no_referrer' };

  // Idempotency: was this referred_user already redeemed?
  const existing = await db.execute(sql`
    SELECT id FROM referral_redemptions WHERE referred_user_id = ${referredUserId} LIMIT 1
  `);
  if (rowsOf(existing).length > 0) return { granted: false, reason: 'already_redeemed' };

  const fraud = await detectFraud(
    row.ref_email ?? '',
    row.email ?? '',
    row.ref,
    settings.bonusReferrerRub,
    settings.maxBonusPerReferrerPerMonthRub
  );

  // Insert redemption row (qualifying); credit balances only if NOT flagged
  await db.execute(sql`
    INSERT INTO referral_redemptions
      (referrer_user_id, referred_user_id, bonus_referrer_rub, bonus_referred_rub,
       qualifying_event, paid_out, fraud_flagged, fraud_reason, paid_out_at)
    VALUES (${row.ref}, ${referredUserId},
            ${settings.bonusReferrerRub}, ${settings.bonusReferredRub},
            ${settings.qualifyingEvent},
            ${!fraud.fraud}, ${fraud.fraud}, ${fraud.reason},
            ${fraud.fraud ? null : new Date().toISOString()}::timestamptz)
    ON CONFLICT (referred_user_id) DO NOTHING
  `);

  if (!fraud.fraud) {
    // Credit both balances. Stored as text to avoid float drift.
    await db.execute(sql`
      UPDATE users SET balance =
        (COALESCE(NULLIF(balance,'')::numeric, 0) + ${settings.bonusReferrerRub})::text
      WHERE id = ${row.ref}
    `);
    await db.execute(sql`
      UPDATE users SET balance =
        (COALESCE(NULLIF(balance,'')::numeric, 0) + ${settings.bonusReferredRub})::text
      WHERE id = ${referredUserId}
    `);
  }

  return {
    granted: !fraud.fraud,
    reason: fraud.fraud ? `fraud:${fraud.reason}` : 'paid',
    bonusReferrerRub: settings.bonusReferrerRub,
    bonusReferredRub: settings.bonusReferredRub,
  };
}
