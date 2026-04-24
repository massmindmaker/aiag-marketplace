-- Dev/test fixtures — guarded by ON CONFLICT DO NOTHING.
-- Do NOT run in production (gate via NODE_ENV in db:seed script).

INSERT INTO upstreams (id, provider, ru_residency, enabled, latency_p50_ms, uptime) VALUES
  ('yandex',        'yandex',     true,  true, 200, 0.99),
  ('openai-via-or', 'openrouter', false, true, 300, 0.98),
  ('together',      'together',   false, true, 400, 0.97)
ON CONFLICT (id) DO NOTHING;

INSERT INTO models (slug, type, enabled) VALUES
  ('yandex/yandexgpt-pro',   'chat', true),
  ('openai/gpt-4',           'chat', true),
  ('together/llama-3.1-70b', 'chat', true)
ON CONFLICT (slug) DO NOTHING;

-- markup values per spec §4.3: Yandex 1.08, OpenRouter 1.07, Together 1.15
INSERT INTO model_upstreams (model_id, upstream_id, upstream_model_id, price_per_1k_input, price_per_1k_output, markup)
SELECT m.id, s.upstream_id, s.upstream_model_id, s.price_in, s.price_out, s.markup
FROM (VALUES
  ('yandex/yandexgpt-pro',  'yandex',        'yandexgpt/latest',         0.0008::numeric, 0.0024::numeric, 1.08::numeric),
  ('openai/gpt-4',          'openai-via-or', 'openai/gpt-4',             0.0300::numeric, 0.0600::numeric, 1.07::numeric),
  ('together/llama-3.1-70b','together',      'meta-llama/Llama-3.1-70B', 0.0009::numeric, 0.0009::numeric, 1.15::numeric)
) AS s(model_slug, upstream_id, upstream_model_id, price_in, price_out, markup)
JOIN models m ON m.slug = s.model_slug
ON CONFLICT (model_id, upstream_id) DO NOTHING;
