/**
 * Plan 08 Task 4 — Content moderation middleware (local-first)
 *
 * Стратегия:
 *   1. Primary — Yandex Cloud Content Moderator (RF-resident). Покрывает obscene,
 *      extremism, adult, insult, pii. ~0.01 ₽/вызов.
 *   2. Fallback — self-hosted Llama 3.3 moderation endpoint (Llama-Guard-3).
 *   3. Optional tertiary — OpenAI Moderation API — ТОЛЬКО если у user активно
 *      transborder consent (иначе 152-ФЗ violation).
 *
 * Fail-open стратегия если оба local-провайдера down: пропускаем запрос
 * с `degraded: true` и вешаем alert MODERATION_DEGRADED.
 */

export interface ModerationResult {
  blocked: boolean;
  reason?: string;
  provider?: 'yandex' | 'llama-selfhost' | 'openai';
  degraded?: boolean;
}

export interface ModerationOpts {
  failOpen?: boolean;
  userConsents: { transborder: boolean };
  primary?: ModeratorFn;
  fallback?: ModeratorFn;
  openai?: ModeratorFn;
}

type ModeratorFn = (prompt: string) => Promise<{ flagged: boolean; categories?: string[] }>;

async function yandexModerate(prompt: string) {
  const apiKey = process.env.YANDEX_CLOUD_MODERATOR_API_KEY;
  const folderId = process.env.YANDEX_CLOUD_FOLDER_ID;
  if (!apiKey || !folderId) throw new Error('yandex-moderator: credentials missing');

  const r = await fetch('https://content-moderator.api.cloud.yandex.net/v1/classifyText', {
    method: 'POST',
    headers: {
      Authorization: `Api-Key ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      folderId,
      text: prompt,
      targetCategories: ['obscene', 'extremism', 'adult', 'insult', 'pii'],
    }),
  });
  if (!r.ok) throw new Error(`yandex-moderator ${r.status}`);
  const data = (await r.json()) as {
    predictions?: Array<{ confidence: number; label: string }>;
  };
  const flagged = (data.predictions ?? []).some((p) => p.confidence > 0.7);
  return {
    flagged,
    categories: (data.predictions ?? []).filter((p) => p.confidence > 0.7).map((p) => p.label),
  };
}

async function llamaModerate(prompt: string) {
  const endpoint = process.env.LLAMA_MODERATION_ENDPOINT;
  if (!endpoint) throw new Error('llama-moderator: endpoint missing');
  const r = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, model: 'llama-guard-3' }),
  });
  if (!r.ok) throw new Error(`llama-moderator ${r.status}`);
  const data = (await r.json()) as { unsafe: boolean; categories?: string[] };
  return { flagged: data.unsafe, categories: data.categories };
}

async function openaiModerate(prompt: string) {
  const apiKey = process.env.OPENAI_MODERATION_KEY;
  if (!apiKey) throw new Error('openai-moderation: key missing');
  const r = await fetch('https://api.openai.com/v1/moderations', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ input: prompt }),
  });
  if (!r.ok) throw new Error(`openai-moderation ${r.status}`);
  const data = (await r.json()) as {
    results: Array<{ flagged: boolean; categories: Record<string, boolean> }>;
  };
  const result = data.results[0];
  if (!result.flagged) return { flagged: false };
  const cats = Object.entries(result.categories)
    .filter(([, v]) => v)
    .map(([k]) => k);
  return { flagged: true, categories: cats };
}

export async function moderate(
  prompt: string,
  opts: ModerationOpts
): Promise<ModerationResult> {
  const primary = opts.primary ?? yandexModerate;
  const fallback = opts.fallback ?? llamaModerate;
  const tertiary = opts.openai ?? openaiModerate;

  // 1) Primary (RF-local, always)
  let localRes: { flagged: boolean; categories?: string[] };
  let provider: ModerationResult['provider'] = 'yandex';
  try {
    localRes = await primary(prompt);
  } catch {
    try {
      localRes = await fallback(prompt);
      provider = 'llama-selfhost';
    } catch {
      if (opts.failOpen) {
        return { blocked: false, degraded: true };
      }
      throw new Error('moderation: all local providers down');
    }
  }

  if (localRes.flagged) {
    return {
      blocked: true,
      reason: (localRes.categories ?? []).join(',') || 'flagged',
      provider,
    };
  }

  // 2) Optional OpenAI extra layer — ТОЛЬКО если transborder consent
  if (opts.userConsents.transborder && process.env.OPENAI_MODERATION_KEY) {
    try {
      const openaiRes = await tertiary(prompt);
      if (openaiRes.flagged) {
        return {
          blocked: true,
          reason: (openaiRes.categories ?? []).join(',') || 'flagged',
          provider: 'openai',
        };
      }
    } catch {
      // swallow — local уже прошёл, openai-слой best-effort
    }
  }

  return { blocked: false, provider };
}
