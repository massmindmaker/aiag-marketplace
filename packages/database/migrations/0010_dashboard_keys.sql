-- =============================================================================
-- Plan 10: Dashboard self-service extensions
--
-- Adds:
--  - gateway_api_keys: name (already there), cost_limit_monthly_rub,
--    model_whitelist, ru_residency_only, disabled_at
--  - organizations: auto_topup_enabled, auto_topup_threshold, auto_topup_amount
--  - marketplace_requests: supply-side direct model submissions
--
-- Idempotent.
-- =============================================================================

-- ----------------------------------------------------------------------------
-- gateway_api_keys extensions
-- ----------------------------------------------------------------------------
ALTER TABLE gateway_api_keys
  ADD COLUMN IF NOT EXISTS cost_limit_monthly_rub NUMERIC(10,2) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS model_whitelist JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS ru_residency_only BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS disabled_at TIMESTAMPTZ DEFAULT NULL;

-- ----------------------------------------------------------------------------
-- organizations: auto-topup settings
-- ----------------------------------------------------------------------------
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS auto_topup_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS auto_topup_threshold NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS auto_topup_amount NUMERIC(10,2);

-- ----------------------------------------------------------------------------
-- model_submissions: supply-side direct model submissions
-- (separate from existing `marketplace_requests` which is gig-style)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS model_submissions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL,
  -- Step 1: basic
  name            VARCHAR(200) NOT NULL,
  slug            VARCHAR(128) NOT NULL,
  modality        VARCHAR(20) NOT NULL,   -- chat / image / video / audio / embedding
  description     TEXT NOT NULL,
  -- Step 2: integration
  outbound_kind   VARCHAR(32) NOT NULL,   -- 'cloud-api' | 'hosted-on-aiag'
  upstream_url    TEXT,
  pricing         JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- Step 3: compliance
  ru_residency    BOOLEAN NOT NULL DEFAULT FALSE,
  pii_risk        VARCHAR(16) NOT NULL DEFAULT 'low',  -- low / medium / high
  gdpr_applicable BOOLEAN NOT NULL DEFAULT FALSE,
  -- moderation
  status          VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending / approved / rejected
  admin_note      TEXT,
  reviewed_at     TIMESTAMPTZ,
  reviewed_by     UUID,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS model_submissions_user_idx
  ON model_submissions (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS model_submissions_status_idx
  ON model_submissions (status, created_at DESC);
