-- =============================================================================
-- 0006b: Extended Kie.ai catalog (multi-modal upstream gateway)
--
-- Kie.ai (https://docs.kie.ai/) is a multi-model upstream that wraps a wide
-- range of third-party providers (Midjourney, Sora, Kling, Suno, Veo, Flux,
-- Hailuo, Hunyuan, Wan, Seedance, Topaz, Real-ESRGAN, etc.) behind a single
-- API. We register a `kie` upstream and expose ~22 models routed through it.
--
-- Idempotent: ON CONFLICT DO NOTHING throughout. Safe to re-run.
--
-- Schema notes (vs Plan-04 0004_gateway_core.sql):
--  - models has columns: slug, type, display_name, description, metadata (jsonb)
--    `tags`, `hosted_region`, and per-second pricing live inside metadata.
--  - model_upstreams price columns: price_per_1k_input/output, price_per_image,
--    price_per_audio_sec. For video we store per-clip price in price_per_image
--    and per-second rate in metadata. All RUB amounts are pre-markup upstream
--    cost; markup column applies the Kie.ai gateway markup (1.12 default).
--  - USD → RUB at ~100 RUB/USD for seeded baselines.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Upstream registration (Kie.ai)
-- -----------------------------------------------------------------------------
INSERT INTO upstreams (id, provider, ru_residency, enabled, latency_p50_ms, uptime, base_url, metadata) VALUES
  ('kie', 'kie', false, true, 600, 0.97, 'https://api.kie.ai',
   jsonb_build_object('docs','https://docs.kie.ai/','region','global','default_markup',1.12))
ON CONFLICT (id) DO NOTHING;

-- -----------------------------------------------------------------------------
-- 2. Models (image / video / audio / upscale)
-- -----------------------------------------------------------------------------
INSERT INTO models (slug, type, enabled, display_name, description, metadata) VALUES
  -- ===================== IMAGE =====================
  ('midjourney-v7-kie', 'image', true, 'Midjourney v7 (Kie)',
   'Художественная генерация изображений Midjourney v7 через Kie.ai. Лучший выбор для стилизованных артов и концептов.',
   jsonb_build_object('tags',ARRAY['image','art','stylized'],'hosted_region','global','provider_family','midjourney')),
  ('midjourney-v6-1-kie', 'image', true, 'Midjourney v6.1 (Kie)',
   'Предыдущее поколение Midjourney через Kie.ai — стабильнее и дешевле v7.',
   jsonb_build_object('tags',ARRAY['image','art'],'hosted_region','global','provider_family','midjourney')),
  ('flux-pro-1-1-kie', 'image', true, 'Flux Pro 1.1 (Kie)',
   'Фотореалистичная генерация Flux Pro 1.1 от Black Forest Labs через Kie.ai.',
   jsonb_build_object('tags',ARRAY['image','realistic','photo'],'hosted_region','global','provider_family','flux')),
  ('flux-schnell-kie', 'image', true, 'Flux Schnell (Kie)',
   'Быстрая дешёвая генерация Flux Schnell — 4 шага, хорошее качество за копейки.',
   jsonb_build_object('tags',ARRAY['image','fast','cheap'],'hosted_region','global','provider_family','flux')),
  ('flux-dev-kie', 'image', true, 'Flux Dev (Kie)',
   'Открытая версия Flux Dev через Kie.ai — баланс качества и цены.',
   jsonb_build_object('tags',ARRAY['image','open'],'hosted_region','global','provider_family','flux')),
  ('sd-3-5-kie', 'image', true, 'Stable Diffusion 3.5 (Kie)',
   'Stable Diffusion 3.5 от Stability AI через Kie.ai — универсальная генерация.',
   jsonb_build_object('tags',ARRAY['image','open'],'hosted_region','global','provider_family','stability')),
  ('recraft-v3-kie', 'image', true, 'Recraft v3 (Kie)',
   'Recraft v3 — векторные иллюстрации и иконки через Kie.ai.',
   jsonb_build_object('tags',ARRAY['image','vector','design'],'hosted_region','global','provider_family','recraft')),
  ('ideogram-v2-kie', 'image', true, 'Ideogram v2 (Kie)',
   'Ideogram v2 — генерация изображений с точным рендерингом текста на картинке.',
   jsonb_build_object('tags',ARRAY['image','text-in-image'],'hosted_region','global','provider_family','ideogram')),
  ('nano-banana-pro-kie', 'image', true, 'Nano Banana Pro (Kie)',
   'Google Imagen 4 wrapper (nano-banana-pro) через Kie.ai. Топовое качество фотореализма.',
   jsonb_build_object('tags',ARRAY['image','realistic','google'],'hosted_region','global','provider_family','google-imagen')),
  ('nano-banana-2-kie', 'image', true, 'Nano Banana 2 (Kie)',
   'Облегчённая nano-banana 2 — Google Imagen wrapper, быстрее и дешевле Pro.',
   jsonb_build_object('tags',ARRAY['image','google'],'hosted_region','global','provider_family','google-imagen')),
  ('dalle-3-kie', 'image', true, 'DALL-E 3 (Kie)',
   'OpenAI DALL-E 3 через Kie.ai — креативная генерация с пониманием сложных промптов.',
   jsonb_build_object('tags',ARRAY['image','openai'],'hosted_region','global','provider_family','openai')),

  -- ===================== VIDEO =====================
  ('kling-3-0-kie', 'video', true, 'Kling 3.0 (Kie)',
   'Kling 3.0 — text/image-to-video от Kuaishou через Kie.ai. Топ-видео-генерация в 2026.',
   jsonb_build_object('tags',ARRAY['video','realistic','t2v','i2v'],'hosted_region','global','provider_family','kling','default_duration_sec',5)),
  ('kling-1-6-kie', 'video', true, 'Kling 1.6 (Kie)',
   'Kling 1.6 — стабильная и более дешёвая версия Kling через Kie.ai.',
   jsonb_build_object('tags',ARRAY['video','t2v','i2v'],'hosted_region','global','provider_family','kling','default_duration_sec',5)),
  ('sora-2-kie', 'video', true, 'Sora 2 (Kie)',
   'OpenAI Sora 2 — топовая text-to-video модель через Kie.ai.',
   jsonb_build_object('tags',ARRAY['video','t2v','openai'],'hosted_region','global','provider_family','sora','default_duration_sec',5)),
  ('hailuo-02-kie', 'video', true, 'Hailuo 02 (Kie)',
   'Minimax Hailuo 02 — быстрое реалистичное видео через Kie.ai.',
   jsonb_build_object('tags',ARRAY['video','t2v','minimax'],'hosted_region','global','provider_family','hailuo','default_duration_sec',6)),
  ('veo-3-kie', 'video', true, 'Veo 3 (Kie)',
   'Google Veo 3 — фотореалистичное видео со звуком через Kie.ai.',
   jsonb_build_object('tags',ARRAY['video','google','t2v','with-audio'],'hosted_region','global','provider_family','veo','default_duration_sec',8)),
  ('veo-2-kie', 'video', true, 'Veo 2 (Kie)',
   'Google Veo 2 — предыдущее поколение, дешевле и быстрее.',
   jsonb_build_object('tags',ARRAY['video','google','t2v'],'hosted_region','global','provider_family','veo','default_duration_sec',8)),
  ('hunyuan-video-kie', 'video', true, 'Hunyuan Video (Kie)',
   'Tencent Hunyuan Video — open-source альтернатива через Kie.ai.',
   jsonb_build_object('tags',ARRAY['video','open','tencent'],'hosted_region','global','provider_family','hunyuan','default_duration_sec',5)),
  ('seedance-pro-kie', 'video', true, 'Seedance Pro (Kie)',
   'Seedance Pro v1 — танец/движение видео через Kie.ai.',
   jsonb_build_object('tags',ARRAY['video','motion'],'hosted_region','global','provider_family','seedance','default_duration_sec',5)),
  ('wan-2-5-kie', 'video', true, 'Wan 2.5 (Kie)',
   'Alibaba Wan 2.5 — text/image-to-video через Kie.ai.',
   jsonb_build_object('tags',ARRAY['video','alibaba'],'hosted_region','global','provider_family','wan','default_duration_sec',5)),
  ('ltx-video-kie', 'video', true, 'LTX Video (Kie)',
   'LTX Video — быстрая дешёвая модель real-time-style видео через Kie.ai.',
   jsonb_build_object('tags',ARRAY['video','fast'],'hosted_region','global','provider_family','ltx','default_duration_sec',5)),

  -- ===================== AUDIO =====================
  ('suno-v4-kie', 'audio', true, 'Suno v4 (Kie)',
   'Suno v4 — генерация музыки с вокалом по текстовому промпту через Kie.ai.',
   jsonb_build_object('tags',ARRAY['audio','music','suno'],'hosted_region','global','provider_family','suno','unit','track')),
  ('suno-v3-5-kie', 'audio', true, 'Suno v3.5 (Kie)',
   'Suno v3.5 — стабильная версия для генерации музыки, дешевле v4.',
   jsonb_build_object('tags',ARRAY['audio','music','suno'],'hosted_region','global','provider_family','suno','unit','track')),
  ('elevenlabs-tts-kie', 'audio', true, 'ElevenLabs TTS (Kie)',
   'ElevenLabs Text-to-Speech через Kie.ai-обёртку. Реалистичные голоса, многоязычность.',
   jsonb_build_object('tags',ARRAY['audio','tts','voice'],'hosted_region','global','provider_family','elevenlabs','unit','second')),
  ('riffusion-kie', 'audio', true, 'Riffusion (Kie)',
   'Riffusion — генерация музыкальных клипов через спектрограммы.',
   jsonb_build_object('tags',ARRAY['audio','music','open'],'hosted_region','global','provider_family','riffusion','unit','track')),

  -- ===================== UPSCALE / EDIT =====================
  ('topaz-photo-ai-kie', 'image', true, 'Topaz Photo AI (Kie)',
   'Topaz Photo AI — апскейл и улучшение фото (denoise/sharpen) через Kie.ai.',
   jsonb_build_object('tags',ARRAY['image','upscale','enhance'],'hosted_region','global','provider_family','topaz','operation','upscale')),
  ('real-esrgan-kie', 'image', true, 'Real-ESRGAN (Kie)',
   'Real-ESRGAN — открытый апскейлер изображений 2x/4x через Kie.ai.',
   jsonb_build_object('tags',ARRAY['image','upscale','open'],'hosted_region','global','provider_family','esrgan','operation','upscale')),
  ('codeformer-kie', 'image', true, 'CodeFormer Face Restoration (Kie)',
   'CodeFormer — восстановление лиц на фото через Kie.ai.',
   jsonb_build_object('tags',ARRAY['image','restore','face'],'hosted_region','global','provider_family','codeformer','operation','restore')),
  ('rembg-kie', 'image', true, 'RemBG Background Removal (Kie)',
   'RemBG — удаление фона с изображений через Kie.ai.',
   jsonb_build_object('tags',ARRAY['image','bg-removal'],'hosted_region','global','provider_family','rembg','operation','bg-removal'))
ON CONFLICT (slug) DO NOTHING;

-- -----------------------------------------------------------------------------
-- 3. Routing (model_upstreams)
--   All routed via 'kie' upstream with markup 1.12. Prices in RUB, pre-markup
--   upstream cost (USD * 100). For video, price_per_image = per-clip price
--   (assuming default_duration_sec from metadata); per-second rate is in
--   metadata for downstream pricing UIs.
-- -----------------------------------------------------------------------------
INSERT INTO model_upstreams (model_id, upstream_id, upstream_model_id, price_per_1k_input, price_per_1k_output, price_per_image, price_per_audio_sec, markup)
SELECT m.id, s.upstream_id, s.upstream_model_id, 0::numeric, 0::numeric, s.per_image, s.per_audio_sec, s.markup
FROM (VALUES
  -- IMAGE (per-image RUB; $0.04-$0.08 → 4-8 RUB)
  ('midjourney-v7-kie',     'kie', 'midjourney/v7',       8.00::numeric, NULL::numeric, 1.12::numeric),
  ('midjourney-v6-1-kie',   'kie', 'midjourney/v6.1',     6.00::numeric, NULL::numeric, 1.12::numeric),
  ('flux-pro-1-1-kie',      'kie', 'flux/pro-1.1',        5.00::numeric, NULL::numeric, 1.12::numeric),
  ('flux-schnell-kie',      'kie', 'flux/schnell',        0.30::numeric, NULL::numeric, 1.12::numeric),
  ('flux-dev-kie',          'kie', 'flux/dev',            2.50::numeric, NULL::numeric, 1.12::numeric),
  ('sd-3-5-kie',            'kie', 'stability/sd-3.5',    3.50::numeric, NULL::numeric, 1.12::numeric),
  ('recraft-v3-kie',        'kie', 'recraft/v3',          4.00::numeric, NULL::numeric, 1.12::numeric),
  ('ideogram-v2-kie',       'kie', 'ideogram/v2',         5.00::numeric, NULL::numeric, 1.12::numeric),
  ('nano-banana-pro-kie',   'kie', 'google/nano-banana-pro', 6.00::numeric, NULL::numeric, 1.12::numeric),
  ('nano-banana-2-kie',     'kie', 'google/nano-banana-2',   3.00::numeric, NULL::numeric, 1.12::numeric),
  ('dalle-3-kie',           'kie', 'openai/dall-e-3',     4.00::numeric, NULL::numeric, 1.12::numeric),
  -- VIDEO (per-clip RUB at default duration; based on $0.05-$0.20/sec)
  -- Kling 3.0  $0.20/sec * 5s = $1.00 = 100 RUB
  ('kling-3-0-kie',         'kie', 'kling/v3.0',          100.00::numeric, NULL::numeric, 1.12::numeric),
  ('kling-1-6-kie',         'kie', 'kling/v1.6',           45.00::numeric, NULL::numeric, 1.12::numeric),
  -- Sora 2  $0.30/sec * 5s
  ('sora-2-kie',            'kie', 'openai/sora-2',       150.00::numeric, NULL::numeric, 1.12::numeric),
  ('hailuo-02-kie',         'kie', 'minimax/hailuo-02',    35.00::numeric, NULL::numeric, 1.12::numeric),
  ('veo-3-kie',             'kie', 'google/veo-3',        160.00::numeric, NULL::numeric, 1.12::numeric),
  ('veo-2-kie',             'kie', 'google/veo-2',         80.00::numeric, NULL::numeric, 1.12::numeric),
  ('hunyuan-video-kie',     'kie', 'tencent/hunyuan-video',25.00::numeric, NULL::numeric, 1.12::numeric),
  ('seedance-pro-kie',      'kie', 'seedance/pro-v1',      40.00::numeric, NULL::numeric, 1.12::numeric),
  ('wan-2-5-kie',           'kie', 'alibaba/wan-2.5',      30.00::numeric, NULL::numeric, 1.12::numeric),
  ('ltx-video-kie',         'kie', 'ltx/video',            15.00::numeric, NULL::numeric, 1.12::numeric),
  -- AUDIO
  -- Suno: per-track flat price (price_per_image used as "per generation")
  ('suno-v4-kie',           'kie', 'suno/v4',              25.00::numeric, NULL::numeric, 1.12::numeric),
  ('suno-v3-5-kie',         'kie', 'suno/v3.5',            15.00::numeric, NULL::numeric, 1.12::numeric),
  -- ElevenLabs TTS: per-second
  ('elevenlabs-tts-kie',    'kie', 'elevenlabs/tts',          NULL::numeric, 0.30::numeric, 1.12::numeric),
  ('riffusion-kie',         'kie', 'riffusion/v1',         8.00::numeric, NULL::numeric, 1.12::numeric),
  -- UPSCALE / EDIT (per-image)
  ('topaz-photo-ai-kie',    'kie', 'topaz/photo-ai',       4.00::numeric, NULL::numeric, 1.12::numeric),
  ('real-esrgan-kie',       'kie', 'realesrgan/x4',        0.50::numeric, NULL::numeric, 1.12::numeric),
  ('codeformer-kie',        'kie', 'codeformer/v1',        0.80::numeric, NULL::numeric, 1.12::numeric),
  ('rembg-kie',             'kie', 'rembg/u2net',          0.40::numeric, NULL::numeric, 1.12::numeric)
) AS s(model_slug, upstream_id, upstream_model_id, per_image, per_audio_sec, markup)
JOIN models m ON m.slug = s.model_slug
ON CONFLICT (model_id, upstream_id) DO NOTHING;
