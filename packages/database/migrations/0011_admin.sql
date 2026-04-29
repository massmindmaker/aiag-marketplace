-- Plan 11: Admin panel — settings, role/status columns
-- Idempotent migration safe to re-run

-- 1. admin_settings — global config singleton store
CREATE TABLE IF NOT EXISTS admin_settings (
  key VARCHAR(100) PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by_email VARCHAR(255)
);

-- Seed default settings (do NOT overwrite existing values)
INSERT INTO admin_settings (key, value, description) VALUES
  ('fx_usd_rub', '"100.0"'::jsonb, 'USD->RUB exchange rate'),
  ('revshare_tiers', '{"tier1":70,"tier2":75,"tier3":80,"tier4":85}'::jsonb, 'Author revshare percentages by tier'),
  ('default_cost_limit_per_key_rub', '0'::jsonb, 'Default monthly cost limit per new key (0 = unlimited)'),
  ('feature_registration', 'true'::jsonb, 'Allow new user registration'),
  ('feature_byok', 'true'::jsonb, 'Allow Bring-Your-Own-Key'),
  ('feature_playground', 'true'::jsonb, 'Allow playground access'),
  ('free_tier_credits_rub', '50'::jsonb, 'Free credits on signup (RUB)'),
  ('rkn_registration_number', '""'::jsonb, 'РКН registration number'),
  ('privacy_policy_version', '"v1.0 (2026-04-22)"'::jsonb, 'Current privacy policy version'),
  ('maintenance_mode', 'false'::jsonb, 'Show maintenance banner')
ON CONFLICT (key) DO NOTHING;

-- 2. organizations.status — already may exist; add if missing
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';

-- 3. audit_log — append-only log of admin actions
CREATE TABLE IF NOT EXISTS audit_log (
  id BIGSERIAL PRIMARY KEY,
  actor_id UUID,
  actor_email VARCHAR(255),
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50),
  resource_id VARCHAR(255),
  details JSONB,
  ip_address VARCHAR(45),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
CREATE INDEX IF NOT EXISTS audit_log_actor_idx ON audit_log(actor_email);
CREATE INDEX IF NOT EXISTS audit_log_action_idx ON audit_log(action);
CREATE INDEX IF NOT EXISTS audit_log_resource_idx ON audit_log(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS audit_log_created_idx ON audit_log(created_at DESC);

-- NB: users.role already exists as enum (user/developer/admin/moderator)
-- NB: users.is_banned/ban_reason already exist
