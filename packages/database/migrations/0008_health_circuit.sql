-- Plan 03 / worker-eval phase: per-upstream health probe history.
-- Worker writes one row per probe cycle; admin UI tails the most recent rows
-- to render uptime / latency sparklines.
--
-- Note: `upstreams.id` is `varchar(64)` (slug) per gateway schema, NOT an int.

CREATE TABLE IF NOT EXISTS upstream_health (
  id BIGSERIAL PRIMARY KEY,
  upstream_id VARCHAR(64) NOT NULL REFERENCES upstreams(id) ON DELETE CASCADE,
  checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ok BOOLEAN NOT NULL,
  latency_ms INTEGER,
  error TEXT
);

CREATE INDEX IF NOT EXISTS idx_upstream_health_recent
  ON upstream_health(upstream_id, checked_at DESC);
