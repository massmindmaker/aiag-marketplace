-- =============================================================================
-- Plan 04: Gateway Core Schema
-- Canonical schema per spec §4.3 / plan-04-gateway Task 1.
--
-- Adds:
--  - organizations.subscription_credits / payg_credits / subscription_credits_expires_at
--  - gateway_api_keys (canonical, separate from Plan-01 api_keys which is user-scoped)
--  - upstreams, models, model_upstreams (canonical routing catalog)
--  - credit_buckets (explicit bucket tracking)
--  - usage_events
--  - requests (RANGE-partitioned by created_at, monthly)
--  - responses
--  - transactions (full per-spec columns: delta/metadata, partial UNIQUE for idempotency)
--  - pii_detections
--  - prediction_jobs
--  - batches
--  - aiag_settle_charge(_org_id, _request_id, _total_rub)  stored function
--  - aiag_ensure_request_partition(_month_offset)         stored function
--
-- Notes:
--  - Tables created with IF NOT EXISTS to be safely re-runnable.
--  - Plan-01 legacy tables (`ai_models`, `api_keys`, `api_usage_logs`, etc.)
--    remain untouched; marketplace front-end keeps using them.
--  - The gateway (packages/api-gateway) uses the canonical tables below.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. organizations — add credit bucket columns (spec §4.3)
-- -----------------------------------------------------------------------------
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS subscription_credits NUMERIC(20,6) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS payg_credits NUMERIC(20,6) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS subscription_credits_expires_at TIMESTAMPTZ;

-- -----------------------------------------------------------------------------
-- 2. upstreams — physical providers (OpenRouter, Yandex, Fal, etc.)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS upstreams (
  id              VARCHAR(64) PRIMARY KEY,
  provider        VARCHAR(64) NOT NULL,
  ru_residency    BOOLEAN NOT NULL DEFAULT FALSE,
  enabled         BOOLEAN NOT NULL DEFAULT TRUE,
  latency_p50_ms  INTEGER NOT NULL DEFAULT 500,
  uptime          NUMERIC(5,4) NOT NULL DEFAULT 0.99,
  base_url        TEXT,
  metadata        JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 3. models — canonical model registry (e.g. 'yandex/yandexgpt-pro')
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS models (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        VARCHAR(128) NOT NULL UNIQUE,
  type        VARCHAR(20) NOT NULL,  -- chat/completion/embedding/image/audio
  enabled     BOOLEAN NOT NULL DEFAULT TRUE,
  display_name TEXT,
  description TEXT,
  metadata    JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS models_enabled_type_idx ON models (enabled, type);

-- -----------------------------------------------------------------------------
-- 4. model_upstreams — routing table (model × upstream pricing + markup)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS model_upstreams (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id            UUID NOT NULL REFERENCES models(id) ON DELETE CASCADE,
  upstream_id         VARCHAR(64) NOT NULL REFERENCES upstreams(id) ON DELETE CASCADE,
  upstream_model_id   VARCHAR(256) NOT NULL,
  price_per_1k_input  NUMERIC(18,10) NOT NULL DEFAULT 0,
  price_per_1k_output NUMERIC(18,10) NOT NULL DEFAULT 0,
  price_per_image     NUMERIC(18,10),
  price_per_audio_sec NUMERIC(18,10),
  markup              NUMERIC(5,4) NOT NULL DEFAULT 1.25,
  enabled             BOOLEAN NOT NULL DEFAULT TRUE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (model_id, upstream_id)
);

CREATE INDEX IF NOT EXISTS model_upstreams_model_idx ON model_upstreams(model_id);
CREATE INDEX IF NOT EXISTS model_upstreams_upstream_idx ON model_upstreams(upstream_id);

-- -----------------------------------------------------------------------------
-- 5. gateway_api_keys — canonical org-scoped API keys for the gateway
--     (distinct from Plan-01 `api_keys` which is user-scoped marketplace keys)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS gateway_api_keys (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id         UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name           VARCHAR(100) NOT NULL,
  key_hash       VARCHAR(64) NOT NULL UNIQUE,   -- sha-256 hex
  key_prefix     VARCHAR(24) NOT NULL,
  policies       JSONB NOT NULL DEFAULT '{}'::jsonb,
  rpm_limit      INTEGER NOT NULL DEFAULT 60,
  daily_usd_cap  NUMERIC(12,2),
  batch_rpm_limit INTEGER NOT NULL DEFAULT 10,
  last_used_at   TIMESTAMPTZ,
  revoked_at     TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS gateway_api_keys_org_idx ON gateway_api_keys(org_id);
CREATE INDEX IF NOT EXISTS gateway_api_keys_prefix_idx ON gateway_api_keys(key_prefix);

-- -----------------------------------------------------------------------------
-- 6. credit_buckets — explicit tracking (optional, aggregate reads use organizations.*)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS credit_buckets (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  kind        VARCHAR(20) NOT NULL,       -- 'subscription' | 'payg'
  amount_rub  NUMERIC(20,6) NOT NULL DEFAULT 0,
  expires_at  TIMESTAMPTZ,
  source      VARCHAR(40),
  metadata    JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS credit_buckets_org_idx ON credit_buckets(org_id, kind);

-- -----------------------------------------------------------------------------
-- 7. usage_events — raw usage stream (rolled up to requests asynchronously)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS usage_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      UUID NOT NULL,
  api_key_id  UUID,
  request_id  VARCHAR(64),
  kind        VARCHAR(30) NOT NULL,
  payload     JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS usage_events_org_created_idx ON usage_events(org_id, created_at);

-- -----------------------------------------------------------------------------
-- 8. requests — partitioned table (RANGE by created_at, monthly)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS requests (
  id                    UUID NOT NULL DEFAULT gen_random_uuid(),
  request_id            VARCHAR(64) NOT NULL,
  org_id                UUID NOT NULL,
  api_key_id            UUID,
  type                  VARCHAR(20) NOT NULL,
  model_slug            VARCHAR(128) NOT NULL,
  upstream_id           VARCHAR(64) NOT NULL,
  mode_requested        VARCHAR(16),
  mode_applied          VARCHAR(16),
  input_tokens          INTEGER NOT NULL DEFAULT 0,
  output_tokens         INTEGER NOT NULL DEFAULT 0,
  cached_input_tokens   INTEGER NOT NULL DEFAULT 0,
  image_count           INTEGER NOT NULL DEFAULT 0,
  audio_seconds         NUMERIC(10,2) NOT NULL DEFAULT 0,
  upstream_cost_usd     NUMERIC(18,8) NOT NULL DEFAULT 0,
  usd_to_rub            NUMERIC(10,4),
  markup                NUMERIC(6,4),
  batch_discount        NUMERIC(6,4) NOT NULL DEFAULT 1,
  caching_factor        NUMERIC(6,4) NOT NULL DEFAULT 1,
  total_cost_rub        NUMERIC(18,6) NOT NULL DEFAULT 0,
  sub_portion_rub       NUMERIC(18,6) NOT NULL DEFAULT 0,
  payg_portion_rub      NUMERIC(18,6) NOT NULL DEFAULT 0,
  status_code           INTEGER,
  latency_ms            INTEGER,
  byok                  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

-- Initial partitions (current month + 3 ahead, using 2026-04..2026-07)
CREATE TABLE IF NOT EXISTS requests_2026_04 PARTITION OF requests
  FOR VALUES FROM ('2026-04-01') TO ('2026-05-01');
CREATE TABLE IF NOT EXISTS requests_2026_05 PARTITION OF requests
  FOR VALUES FROM ('2026-05-01') TO ('2026-06-01');
CREATE TABLE IF NOT EXISTS requests_2026_06 PARTITION OF requests
  FOR VALUES FROM ('2026-06-01') TO ('2026-07-01');
CREATE TABLE IF NOT EXISTS requests_2026_07 PARTITION OF requests
  FOR VALUES FROM ('2026-07-01') TO ('2026-08-01');

CREATE INDEX IF NOT EXISTS requests_org_created_idx ON requests (org_id, created_at);
CREATE INDEX IF NOT EXISTS requests_api_key_created_idx ON requests (api_key_id, created_at);

-- -----------------------------------------------------------------------------
-- 9. responses — verbatim upstream response bodies (optional retention)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS responses (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id   VARCHAR(64) NOT NULL,
  org_id       UUID NOT NULL,
  body         JSONB,
  headers      JSONB,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS responses_request_idx ON responses(request_id);

-- -----------------------------------------------------------------------------
-- 10. transactions — full column set per spec §4.3 (C1/C2/R4)
-- -----------------------------------------------------------------------------
-- NOTE: Plan-01 `transactions` table may exist already via payments schema;
-- use a distinct canonical name `gateway_transactions` to avoid clash.
CREATE TABLE IF NOT EXISTS gateway_transactions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  request_id  VARCHAR(64),
  type        VARCHAR(20) NOT NULL,     -- api_usage | topup | refill | expire | refund
  source      VARCHAR(20) NOT NULL,     -- subscription | payg | gateway | webhook | worker
  delta       NUMERIC(20,6) NOT NULL,
  metadata    JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS gateway_transactions_org_created_idx
  ON gateway_transactions (org_id, created_at DESC);

-- Partial UNIQUE index per spec §4.3 — idempotency for api_usage rows
CREATE UNIQUE INDEX IF NOT EXISTS gateway_transactions_api_usage_uniq
  ON gateway_transactions (request_id, source)
  WHERE type = 'api_usage';

-- -----------------------------------------------------------------------------
-- 11. pii_detections
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pii_detections (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      UUID NOT NULL,
  request_id  VARCHAR(64),
  kind        VARCHAR(20) NOT NULL,     -- email/phone/fio/inn
  sample_hash VARCHAR(64),
  action      VARCHAR(20) NOT NULL,     -- pass/block/warn
  model_slug  VARCHAR(128),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS pii_detections_org_idx ON pii_detections(org_id, created_at);

-- -----------------------------------------------------------------------------
-- 12. prediction_jobs
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS prediction_jobs (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id           VARCHAR(64) NOT NULL UNIQUE,
  org_id            UUID NOT NULL,
  api_key_id        UUID,
  model_slug        VARCHAR(128) NOT NULL,
  upstream_id       VARCHAR(64) NOT NULL,
  upstream_task_id  VARCHAR(128),
  status            VARCHAR(20) NOT NULL DEFAULT 'queued',
  input             JSONB NOT NULL,
  output            JSONB,
  error_message     TEXT,
  cost_rub          NUMERIC(18,6),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at      TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS prediction_jobs_org_status_idx ON prediction_jobs(org_id, status);

-- -----------------------------------------------------------------------------
-- 13. batches
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS batches (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id         VARCHAR(64) NOT NULL UNIQUE,
  org_id           UUID NOT NULL,
  api_key_id       UUID,
  type             VARCHAR(20) NOT NULL,
  status           VARCHAR(20) NOT NULL DEFAULT 'validating',
  input_file_url   TEXT NOT NULL,
  output_file_url  TEXT,
  error_file_url   TEXT,
  total_count      INTEGER NOT NULL DEFAULT 0,
  completed_count  INTEGER NOT NULL DEFAULT 0,
  failed_count     INTEGER NOT NULL DEFAULT 0,
  cost_rub         NUMERIC(18,6) NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at       TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS batches_org_status_idx ON batches(org_id, status);
