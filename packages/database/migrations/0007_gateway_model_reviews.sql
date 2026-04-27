-- =============================================================================
-- 0007: Reviews для gateway-моделей (отдельно от ai_models.model_reviews).
--
-- Таблица model_reviews из Plan-01 ссылается на ai_models, в нём пусто.
-- Маркетплейс читает gateway.models, поэтому даём отдельный lightweight
-- review-storage с FK на models.slug + UNIQUE(user_id, model_slug).
-- =============================================================================

CREATE TABLE IF NOT EXISTS gateway_model_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_slug VARCHAR(128) NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title TEXT,
  content TEXT,
  is_hidden BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT gateway_model_reviews_user_model_uniq UNIQUE (user_id, model_slug)
);

CREATE INDEX IF NOT EXISTS gateway_model_reviews_slug_idx
  ON gateway_model_reviews (model_slug, is_hidden);
CREATE INDEX IF NOT EXISTS gateway_model_reviews_user_idx
  ON gateway_model_reviews (user_id);

-- Cached avg rating on models
ALTER TABLE models ADD COLUMN IF NOT EXISTS cached_avg_rating NUMERIC(3,2);
ALTER TABLE models ADD COLUMN IF NOT EXISTS cached_review_count INTEGER NOT NULL DEFAULT 0;
