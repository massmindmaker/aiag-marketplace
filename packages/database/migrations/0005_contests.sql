-- Plan 07 Supply: Contests + Submissions + Revshare
-- Applied manually on VPS: cat 0005_contests.sql | ssh aiag-vps 'sudo -u postgres psql -d aiag'

-- ============================================================
-- 1. Extend contest_status enum with additional lifecycle states
-- ============================================================
DO $$ BEGIN
  ALTER TYPE contest_status ADD VALUE IF NOT EXISTS 'pending_review';
EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN
  ALTER TYPE contest_status ADD VALUE IF NOT EXISTS 'approved';
EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN
  ALTER TYPE contest_status ADD VALUE IF NOT EXISTS 'rejected';
EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN
  ALTER TYPE contest_status ADD VALUE IF NOT EXISTS 'announced';
EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN
  ALTER TYPE contest_status ADD VALUE IF NOT EXISTS 'open';
EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN
  ALTER TYPE contest_status ADD VALUE IF NOT EXISTS 'evaluating';
EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN
  ALTER TYPE contest_status ADD VALUE IF NOT EXISTS 'finished';
EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN
  ALTER TYPE contest_status ADD VALUE IF NOT EXISTS 'model_deployment';
EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN
  ALTER TYPE contest_status ADD VALUE IF NOT EXISTS 'archived';
EXCEPTION WHEN others THEN NULL; END $$;

-- ============================================================
-- 2. Extend contests table with Plan 07 fields
-- ============================================================
ALTER TABLE contests
  ADD COLUMN IF NOT EXISTS sponsor_id UUID REFERENCES organizations(id),
  ADD COLUMN IF NOT EXISTS reveal_private_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS eval_metric TEXT,
  ADD COLUMN IF NOT EXISTS evaluator_type TEXT CHECK (evaluator_type IN ('generic','plugin')),
  ADD COLUMN IF NOT EXISTS evaluator_script_s3_key TEXT,
  ADD COLUMN IF NOT EXISTS evaluator_script_approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS exclusive_months INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS commission_pct INT DEFAULT 20,
  ADD COLUMN IF NOT EXISTS dataset_public_s3_key TEXT,
  ADD COLUMN IF NOT EXISTS dataset_private_s3_key TEXT,
  ADD COLUMN IF NOT EXISTS problem_md TEXT,
  ADD COLUMN IF NOT EXISTS success_metric_description TEXT,
  ADD COLUMN IF NOT EXISTS submission_schema_json JSONB,
  ADD COLUMN IF NOT EXISTS submission_limit_daily INT DEFAULT 20,
  ADD COLUMN IF NOT EXISTS submission_limit_concurrent INT DEFAULT 5,
  ADD COLUMN IF NOT EXISTS overfitting_threshold_pct NUMERIC(5,2) DEFAULT 15.00,
  ADD COLUMN IF NOT EXISTS current_winner_position INT DEFAULT 1,
  ADD COLUMN IF NOT EXISTS winner_offered_at TIMESTAMPTZ;

-- ============================================================
-- 3. Extend contest_submissions with Plan 07 fields
-- ============================================================
ALTER TABLE contest_submissions
  ADD COLUMN IF NOT EXISTS rank_public INT,
  ADD COLUMN IF NOT EXISTS rank_private INT,
  ADD COLUMN IF NOT EXISTS disqualified BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS overfitting_detected BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS eval_duration_s NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS eval_error TEXT,
  ADD COLUMN IF NOT EXISTS eval_key_version INT,
  ADD COLUMN IF NOT EXISTS schema_valid BOOLEAN;

-- ============================================================
-- 4. Extend ai_models with supply/revshare fields
-- ============================================================
ALTER TABLE ai_models
  ADD COLUMN IF NOT EXISTS author_id UUID REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS contest_id UUID REFERENCES contests(id),
  ADD COLUMN IF NOT EXISTS upstream_provider TEXT,
  ADD COLUMN IF NOT EXISTS upstream_model_id TEXT,
  ADD COLUMN IF NOT EXISTS auth_token_encrypted TEXT,
  ADD COLUMN IF NOT EXISTS auth_token_key_version INT,
  ADD COLUMN IF NOT EXISTS auth_header_name TEXT DEFAULT 'Authorization',
  ADD COLUMN IF NOT EXISTS endpoint_url TEXT,
  ADD COLUMN IF NOT EXISTS samples JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS hosted_by TEXT DEFAULT 'platform' CHECK (hosted_by IN ('platform','author')),
  ADD COLUMN IF NOT EXISTS revshare_tier INT DEFAULT 70,
  ADD COLUMN IF NOT EXISTS exclusive_until TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS pricing_hint_per_request_rub NUMERIC(10,4),
  ADD COLUMN IF NOT EXISTS last_health_check_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_health_status TEXT;

CREATE INDEX IF NOT EXISTS ai_models_author_idx ON ai_models(author_id);
CREATE INDEX IF NOT EXISTS ai_models_contest_idx ON ai_models(contest_id);

-- ============================================================
-- 5. Extend users with payout fields
-- ============================================================
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS payout_method TEXT,
  ADD COLUMN IF NOT EXISTS bank_details_encrypted TEXT,
  ADD COLUMN IF NOT EXISTS bank_details_key_version INT,
  ADD COLUMN IF NOT EXISTS profile_public BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS email_notifications_enabled BOOLEAN DEFAULT true;

-- ============================================================
-- 6. evaluator_scripts — user-uploaded scripts, admin-approved
-- ============================================================
CREATE TABLE IF NOT EXISTS evaluator_scripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contest_id UUID NOT NULL REFERENCES contests(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES users(id),
  s3_key TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'python3.11',
  sha256 TEXT NOT NULL,
  size_bytes BIGINT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  -- SECURITY-TODO Phase 2: ClamAV scan result + auto code-scan via bandit/semgrep
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS evaluator_scripts_contest_idx ON evaluator_scripts(contest_id);
CREATE INDEX IF NOT EXISTS evaluator_scripts_status_idx ON evaluator_scripts(status);

-- ============================================================
-- 7. evaluations — per-submission eval run log
-- ============================================================
CREATE TABLE IF NOT EXISTS evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES contest_submissions(id) ON DELETE CASCADE,
  contest_id UUID NOT NULL REFERENCES contests(id),
  evaluator_type TEXT NOT NULL CHECK (evaluator_type IN ('generic','plugin')),
  evaluator_script_id UUID REFERENCES evaluator_scripts(id),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ,
  duration_s NUMERIC(10,2),
  exit_code INT,
  timed_out BOOLEAN DEFAULT false,
  stdout_truncated TEXT,
  stderr_truncated TEXT,
  metrics JSONB,
  public_score NUMERIC(20,10),
  private_score NUMERIC(20,10),
  status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running','success','failed','timeout','invalid'))
);
CREATE INDEX IF NOT EXISTS evaluations_submission_idx ON evaluations(submission_id);
CREATE INDEX IF NOT EXISTS evaluations_contest_idx ON evaluations(contest_id);

-- ============================================================
-- 8. author_earnings — monthly revshare settlement
-- ============================================================
CREATE TABLE IF NOT EXISTS author_earnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES users(id),
  model_id UUID NOT NULL REFERENCES ai_models(id),
  period_month DATE NOT NULL,
  gross_revenue_rub NUMERIC(14,4) NOT NULL DEFAULT 0,
  upstream_cost_rub NUMERIC(14,4) NOT NULL DEFAULT 0,
  margin_rub NUMERIC(14,4) NOT NULL DEFAULT 0,
  tier_pct INT NOT NULL,
  author_share_rub NUMERIC(14,4) NOT NULL DEFAULT 0,
  author_tax_status TEXT,
  status TEXT NOT NULL DEFAULT 'accruing' CHECK (status IN ('accruing','locked','paid')),
  computed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (author_id, model_id, period_month)
);
CREATE INDEX IF NOT EXISTS author_earnings_author_month_idx ON author_earnings(author_id, period_month DESC);
CREATE INDEX IF NOT EXISTS author_earnings_status_idx ON author_earnings(status);

-- ============================================================
-- 9. payouts — author withdrawal requests
-- ============================================================
CREATE TABLE IF NOT EXISTS payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES users(id),
  amount_rub NUMERIC(14,4) NOT NULL,
  tax_withheld_rub NUMERIC(14,4) NOT NULL DEFAULT 0,
  net_paid_rub NUMERIC(14,4) NOT NULL DEFAULT 0,
  method TEXT NOT NULL CHECK (method IN ('card_ru','ip_account','ooo_account','smz_check')),
  bank_details_encrypted TEXT,
  bank_details_key_version INT,
  chek_number TEXT,
  receipt_pdf_s3_key TEXT,
  transaction_reference TEXT,
  status TEXT NOT NULL DEFAULT 'requested' CHECK (status IN ('requested','processing','paid','failed','reversed')),
  admin_note TEXT,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS payouts_author_idx ON payouts(author_id);
CREATE INDEX IF NOT EXISTS payouts_status_idx ON payouts(status);

-- ============================================================
-- 10. author_tier_history — sticky tier log
-- ============================================================
CREATE TABLE IF NOT EXISTS author_tier_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES users(id),
  tier INT NOT NULL CHECK (tier IN (70,75,80,85)),
  effective_from TIMESTAMPTZ NOT NULL DEFAULT now(),
  effective_to TIMESTAMPTZ,
  reason TEXT
);
CREATE INDEX IF NOT EXISTS author_tier_history_author_idx ON author_tier_history(author_id, effective_from DESC);

-- ============================================================
-- 11. author_tax_statuses — snapshot per period
-- ============================================================
CREATE TABLE IF NOT EXISTS author_tax_statuses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES users(id),
  status TEXT NOT NULL CHECK (status IN ('physical_person','self_employed','ie','ltd')),
  effective_from TIMESTAMPTZ NOT NULL DEFAULT now(),
  effective_to TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS author_tax_statuses_author_idx ON author_tax_statuses(author_id, effective_from DESC);

-- ============================================================
-- 12. encryption_keys — versioned KEK registry
-- ============================================================
CREATE TABLE IF NOT EXISTS encryption_keys (
  version INT PRIMARY KEY,
  key_id TEXT NOT NULL UNIQUE,
  purpose TEXT NOT NULL CHECK (purpose IN ('auth_token','bank_details')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','retired')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  rotated_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS encryption_keys_purpose_active_idx ON encryption_keys(purpose, status, version DESC);

-- ============================================================
-- 13. audit_log — 10y retention (152-ФЗ)
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID,
  actor_type TEXT NOT NULL CHECK (actor_type IN ('user','admin','worker','system')),
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  metadata JSONB,
  ip INET,
  ua TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS audit_log_actor_idx ON audit_log(actor_id);
CREATE INDEX IF NOT EXISTS audit_log_resource_idx ON audit_log(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS audit_log_created_idx ON audit_log(created_at DESC);

-- ============================================================
-- 14. contest_dataset_downloads — rate limit per user
-- ============================================================
CREATE TABLE IF NOT EXISTS contest_dataset_downloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  contest_id UUID NOT NULL REFERENCES contests(id) ON DELETE CASCADE,
  count INT NOT NULL DEFAULT 0,
  bandwidth_bytes_total BIGINT NOT NULL DEFAULT 0,
  last_downloaded_at TIMESTAMPTZ,
  UNIQUE (user_id, contest_id)
);

-- ============================================================
-- 15. b2b_invoices — B2B host flow billing
-- ============================================================
CREATE TABLE IF NOT EXISTS b2b_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contest_id UUID REFERENCES contests(id),
  sponsor_id UUID REFERENCES organizations(id),
  contract_id TEXT,
  client_inn TEXT,
  amount_rub NUMERIC(14,2) NOT NULL,
  vat_amount_rub NUMERIC(14,2) DEFAULT 0,
  purpose TEXT,
  pdf_s3_key TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','issued','paid','overdue','void')),
  issued_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS b2b_invoices_contest_idx ON b2b_invoices(contest_id);
CREATE INDEX IF NOT EXISTS b2b_invoices_status_idx ON b2b_invoices(status);

-- ============================================================
-- DONE — Plan 07 Supply schema applied
-- SECURITY-TODO Phase 2: ClamAV native install (apt install clamav clamav-daemon),
--   nsjail/firejail wrapping for eval-runner, private-test-set RLS.
-- ============================================================
