-- =============================================================================
-- aiag_settle_charge(_org_id, _request_id, _total_rub)
--
-- Atomic dual-bucket settlement per spec §4.3 (Post Round-2 review fixes
-- C1/C2/R2/R3/R4):
--  - SELECT FOR UPDATE on organizations row serializes per-org concurrent calls.
--  - Idempotency check INSIDE lock (before UPDATE) eliminates TOCTOU (FIX C2).
--  - Two conditional INSERTs (source='subscription' + source='payg') per spec (C1).
--  - Partial UNIQUE (request_id, source) WHERE type='api_usage' ensures
--    idempotency at the row level (see migration 0004_gateway_core.sql).
--
-- Returns: (sub_portion, payg_portion, new_sub, new_payg, idempotent)
-- Raises:
--   P0001 INVALID_AMOUNT            if _total_rub <= 0
--   P0002 ORG_NOT_FOUND             if organization missing
--   P0003 INSUFFICIENT_FUNDS        if payg insufficient for remainder
--   P0004 CONCURRENT_MODIFICATION   if UPDATE WHERE-guards fail (should not normally)
-- =============================================================================

CREATE OR REPLACE FUNCTION aiag_settle_charge(
  _org_id       UUID,
  _request_id   VARCHAR,
  _total_rub    NUMERIC
) RETURNS TABLE(
  sub_portion  NUMERIC,
  payg_portion NUMERIC,
  new_sub      NUMERIC,
  new_payg     NUMERIC,
  idempotent   BOOLEAN
)
LANGUAGE plpgsql AS $$
DECLARE
  _sub_avail     NUMERIC;
  _payg_avail    NUMERIC;
  _sub_expires   TIMESTAMPTZ;
  _sub_portion   NUMERIC := 0;
  _payg_portion  NUMERIC := 0;
  _existing_sub  NUMERIC;
  _existing_payg NUMERIC;
BEGIN
  IF _total_rub <= 0 THEN
    RAISE EXCEPTION 'INVALID_AMOUNT' USING ERRCODE = 'P0001';
  END IF;

  -- Lock org row (serializes per-org concurrency)
  SELECT subscription_credits, payg_credits, subscription_credits_expires_at
    INTO _sub_avail, _payg_avail, _sub_expires
  FROM organizations
  WHERE id = _org_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'ORG_NOT_FOUND' USING ERRCODE = 'P0002';
  END IF;

  -- Idempotency check INSIDE lock (FIX C2). Reuses gateway_transactions table
  -- (api_usage rows). If rows exist — return existing values, no UPDATE.
  SELECT
    COALESCE(SUM(CASE WHEN source = 'subscription' THEN ABS(delta) END), 0),
    COALESCE(SUM(CASE WHEN source = 'payg'         THEN ABS(delta) END), 0)
    INTO _existing_sub, _existing_payg
  FROM gateway_transactions
  WHERE request_id = _request_id
    AND type = 'api_usage'
    AND source IN ('subscription', 'payg');

  IF _existing_sub > 0 OR _existing_payg > 0 THEN
    sub_portion  := _existing_sub;
    payg_portion := _existing_payg;
    new_sub      := _sub_avail;
    new_payg     := _payg_avail;
    idempotent   := TRUE;
    RETURN NEXT;
    RETURN;
  END IF;

  -- Expired sub credits treated as zero (R2)
  IF _sub_expires IS NOT NULL AND _sub_expires < NOW() THEN
    _sub_avail := 0;
  END IF;

  _sub_portion  := LEAST(_total_rub, _sub_avail);
  _payg_portion := _total_rub - _sub_portion;

  IF _payg_portion > _payg_avail THEN
    RAISE EXCEPTION 'INSUFFICIENT_FUNDS: need % payg, have %', _payg_portion, _payg_avail
      USING ERRCODE = 'P0003';
  END IF;

  UPDATE organizations
     SET subscription_credits = subscription_credits - _sub_portion,
         payg_credits         = payg_credits - _payg_portion,
         updated_at           = NOW()
   WHERE id = _org_id
     AND subscription_credits >= _sub_portion
     AND payg_credits         >= _payg_portion
  RETURNING subscription_credits, payg_credits INTO new_sub, new_payg;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'CONCURRENT_MODIFICATION' USING ERRCODE = 'P0004';
  END IF;

  -- Two conditional INSERTs per spec §4.3 (FIX C1)
  IF _sub_portion > 0 THEN
    INSERT INTO gateway_transactions (org_id, request_id, type, source, delta, metadata, created_at)
    VALUES (_org_id, _request_id, 'api_usage', 'subscription', -_sub_portion, '{}'::jsonb, NOW());
  END IF;

  IF _payg_portion > 0 THEN
    INSERT INTO gateway_transactions (org_id, request_id, type, source, delta, metadata, created_at)
    VALUES (_org_id, _request_id, 'api_usage', 'payg', -_payg_portion, '{}'::jsonb, NOW());
  END IF;

  sub_portion  := _sub_portion;
  payg_portion := _payg_portion;
  idempotent   := FALSE;
  RETURN NEXT;
END;
$$;


-- =============================================================================
-- aiag_ensure_request_partition(_month_offset)
-- Creates next-month partition for `requests` if missing. Called by worker
-- cron job (see apps/worker/src/jobs/partition-ensure.ts).
-- =============================================================================

CREATE OR REPLACE FUNCTION aiag_ensure_request_partition(_month_offset INT DEFAULT 2)
RETURNS VOID
LANGUAGE plpgsql AS $$
DECLARE
  _start  DATE;
  _end    DATE;
  _pname  TEXT;
BEGIN
  _start := date_trunc('month', NOW() + (_month_offset || ' months')::interval)::date;
  _end   := (_start + INTERVAL '1 month')::date;
  _pname := 'requests_' || to_char(_start, 'YYYY_MM');

  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = _pname) THEN
    EXECUTE format(
      'CREATE TABLE %I PARTITION OF requests FOR VALUES FROM (%L) TO (%L)',
      _pname, _start, _end
    );
    RAISE NOTICE 'Created partition %', _pname;
  END IF;
END;
$$;
