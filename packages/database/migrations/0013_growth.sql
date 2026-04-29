-- Phase 13: Growth Foundation — referrals, promo codes, cohort retention
-- Idempotent migration safe to re-run (CREATE TABLE IF NOT EXISTS, ON CONFLICT DO NOTHING)

-- ===========================================================================
-- 1. Referral codes — one row per user, generated at first login
-- ===========================================================================
CREATE TABLE IF NOT EXISTS referral_codes (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  code VARCHAR(24) UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_referral_codes_code ON referral_codes(code);

-- ===========================================================================
-- 2. Referral redemptions — event log: who invited whom, bonus state
-- ===========================================================================
CREATE TABLE IF NOT EXISTS referral_redemptions (
  id BIGSERIAL PRIMARY KEY,
  referrer_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  referred_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  redeemed_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  bonus_referrer_rub NUMERIC(10,2) NOT NULL DEFAULT 100,
  bonus_referred_rub NUMERIC(10,2) NOT NULL DEFAULT 100,
  qualifying_event VARCHAR(50) NOT NULL DEFAULT 'first_topup',
  paid_out BOOLEAN NOT NULL DEFAULT false,
  fraud_flagged BOOLEAN NOT NULL DEFAULT false,
  fraud_reason TEXT,
  paid_out_at TIMESTAMPTZ,
  -- A user can only be referred once
  CONSTRAINT referral_redemptions_referred_unique UNIQUE (referred_user_id),
  -- Cannot self-refer
  CONSTRAINT referral_redemptions_no_self CHECK (referrer_user_id <> referred_user_id)
);
CREATE INDEX IF NOT EXISTS idx_referral_redemptions_referrer
  ON referral_redemptions(referrer_user_id, redeemed_at DESC);
CREATE INDEX IF NOT EXISTS idx_referral_redemptions_paid
  ON referral_redemptions(paid_out, fraud_flagged);

-- ===========================================================================
-- 3. Promo codes — admin-created discount/credit codes
-- ===========================================================================
CREATE TABLE IF NOT EXISTS promo_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  -- 'percent_off' | 'fixed_off' | 'free_credit'
  kind VARCHAR(20) NOT NULL,
  value NUMERIC(10,2) NOT NULL,
  min_amount_rub NUMERIC(10,2),
  max_uses INTEGER,
  uses_count INTEGER NOT NULL DEFAULT 0,
  per_user_limit INTEGER NOT NULL DEFAULT 1,
  valid_from TIMESTAMPTZ,
  valid_until TIMESTAMPTZ,
  -- 'topup' | 'subscription' | 'first_topup_only'
  applies_to VARCHAR(20) NOT NULL DEFAULT 'topup',
  active BOOLEAN NOT NULL DEFAULT true,
  created_by_email VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT promo_codes_kind_check CHECK (kind IN ('percent_off','fixed_off','free_credit')),
  CONSTRAINT promo_codes_applies_check CHECK (applies_to IN ('topup','subscription','first_topup_only'))
);
CREATE INDEX IF NOT EXISTS idx_promo_codes_active ON promo_codes(active, valid_until);
CREATE INDEX IF NOT EXISTS idx_promo_codes_code ON promo_codes(code);

-- ===========================================================================
-- 4. Promo redemptions — event log of code usage
-- ===========================================================================
CREATE TABLE IF NOT EXISTS promo_redemptions (
  id BIGSERIAL PRIMARY KEY,
  promo_id UUID NOT NULL REFERENCES promo_codes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  payment_id UUID,
  discount_applied_rub NUMERIC(10,2) NOT NULL,
  redeemed_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_promo_redemptions_user
  ON promo_redemptions(user_id, redeemed_at DESC);
CREATE INDEX IF NOT EXISTS idx_promo_redemptions_promo
  ON promo_redemptions(promo_id, redeemed_at DESC);

-- ===========================================================================
-- 5. Cohort snapshots — daily pre-aggregated retention matrix
-- ===========================================================================
CREATE TABLE IF NOT EXISTS cohort_snapshots (
  cohort_week DATE NOT NULL,
  measurement_day INTEGER NOT NULL,
  registered_count INTEGER NOT NULL DEFAULT 0,
  active_count INTEGER NOT NULL DEFAULT 0,
  paying_count INTEGER NOT NULL DEFAULT 0,
  total_revenue_rub NUMERIC(12,2) NOT NULL DEFAULT 0,
  computed_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  PRIMARY KEY (cohort_week, measurement_day)
);
CREATE INDEX IF NOT EXISTS idx_cohort_snapshots_week
  ON cohort_snapshots(cohort_week DESC, measurement_day);

-- ===========================================================================
-- 6. users.referrer_user_id — link a user to who invited them (set at signup)
-- ===========================================================================
ALTER TABLE users ADD COLUMN IF NOT EXISTS referrer_user_id UUID REFERENCES users(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_users_referrer ON users(referrer_user_id) WHERE referrer_user_id IS NOT NULL;

-- ===========================================================================
-- 7. Seed growth-related admin settings (do NOT overwrite)
-- ===========================================================================
INSERT INTO admin_settings (key, value, description) VALUES
  ('referral_enabled', 'true'::jsonb, 'Referral system master switch'),
  ('referral_bonus_referrer_rub', '100'::jsonb, 'Bonus credited to referrer (RUB)'),
  ('referral_bonus_referred_rub', '100'::jsonb, 'Bonus credited to referred user (RUB)'),
  ('referral_qualifying_event', '"first_topup"'::jsonb, 'first_topup | first_topup_min_500 | first_request'),
  ('referral_min_topup_rub', '100'::jsonb, 'Min top-up to qualify for referral bonus'),
  ('referral_max_bonus_per_referrer_per_month_rub', '5000'::jsonb, 'Anti-abuse cap')
ON CONFLICT (key) DO NOTHING;
