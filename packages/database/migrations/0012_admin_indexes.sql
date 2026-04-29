-- Plan 12: Admin critical views indexes
-- Idempotent — safe to re-run

-- Requests inspector — speed up date+status filtering
CREATE INDEX IF NOT EXISTS idx_requests_created_status
  ON requests(created_at DESC, status_code);

CREATE INDEX IF NOT EXISTS idx_requests_request_id
  ON requests(request_id);

CREATE INDEX IF NOT EXISTS idx_requests_model_slug_created
  ON requests(model_slug, created_at DESC);

-- Prediction jobs monitor — speed up status+date filtering
CREATE INDEX IF NOT EXISTS idx_prediction_jobs_status_created
  ON prediction_jobs(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_prediction_jobs_upstream_status
  ON prediction_jobs(upstream_id, status);

-- Gateway transactions — daily revenue aggregation
CREATE INDEX IF NOT EXISTS idx_gateway_transactions_type_created
  ON gateway_transactions(type, created_at DESC);

-- Model upstreams — listing matrix joins
CREATE INDEX IF NOT EXISTS idx_model_upstreams_enabled
  ON model_upstreams(enabled, model_id);
