-- =============================================================================
-- 0009: Fix Kie upstream_model_id values to match Kie's actual API model strings.
--
-- The original 0006b seed assumed namespaced ids like `google/nano-banana-pro`,
-- `flux/pro-1.1`, `openai/sora-2` — but Kie's API rejects these with 422
-- "model name not supported". The correct identifiers come from
-- https://docs.kie.ai/llms.txt and per-model docs:
--   - nano-banana-2:        model="nano-banana-2"        (POST /api/v1/jobs/createTask)
--   - sora-2 text-to-video: model="sora-2-text-to-video" (POST /api/v1/jobs/createTask)
--   - veo3 / veo3_fast:     POST /api/v1/veo/generate    (different family)
--   - suno*:                POST /api/v1/generate
--
-- The gateway's kie.ts dispatches by family (veo/suno/jobs) based on the
-- model id prefix, so all that needs to change here are the ids themselves.
--
-- Idempotent: safe to re-run.
-- =============================================================================

UPDATE model_upstreams mu
   SET upstream_model_id = v.new_id
  FROM (VALUES
    ('nano-banana-2-kie',     'nano-banana-2'),
    ('nano-banana-pro-kie',   'nano-banana-pro'),
    ('flux-pro-1-1-kie',      'flux-2-pro-text-to-image'),
    ('flux-schnell-kie',      'flux-2-text-to-image'),
    ('flux-dev-kie',          'flux-kontext-pro'),
    ('midjourney-v7-kie',     'midjourney-v7'),
    ('midjourney-v6-1-kie',   'midjourney-v6-1'),
    ('sora-2-kie',            'sora-2-text-to-video'),
    ('veo-3-kie',             'veo3'),
    ('veo-2-kie',             'veo3_fast'),
    ('kling-3-0-kie',         'kling-3.0'),
    ('kling-1-6-kie',         'kling-2.6-text-to-video'),
    ('suno-v4-kie',           'suno-v4'),
    ('suno-v3-5-kie',         'suno-v3.5'),
    ('hailuo-02-kie',         'hailuo-02'),
    ('seedance-pro-kie',      'bytedance-seedance-pro'),
    ('hunyuan-video-kie',     'hunyuan-video'),
    ('wan-2-5-kie',           'wan-2.5'),
    ('ltx-video-kie',         'ltx-video'),
    ('sd-3-5-kie',            'stable-diffusion-3.5'),
    ('ideogram-v2-kie',       'ideogram-v2'),
    ('recraft-v3-kie',        'recraft-v3'),
    ('dalle-3-kie',           'dall-e-3'),
    ('elevenlabs-tts-kie',    'elevenlabs-tts'),
    ('riffusion-kie',         'riffusion'),
    ('codeformer-kie',        'codeformer'),
    ('real-esrgan-kie',       'real-esrgan'),
    ('rembg-kie',             'rembg'),
    ('topaz-photo-ai-kie',    'topaz-photo-ai')
  ) AS v(slug, new_id)
  JOIN models m ON m.slug = v.slug
 WHERE mu.model_id = m.id
   AND mu.upstream_id = 'kie';
