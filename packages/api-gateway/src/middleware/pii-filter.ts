/**
 * Plan 04 PII filter (Spec §8).
 *
 * - Extracts text from request body across chat/completions/embeddings shapes.
 * - Detects email / phone / ИНН / ФИО via regex.
 * - If target upstream is non-RU and key policy `allow_pii_transborder !== true`:
 *    blocking-kind hits (email/phone/inn) → 403 Block
 *    non-blocking (fio) → pass with log action='warn'
 * - Persists hashes (not raw samples) to `pii_detections` table.
 *
 * Resolver hook: `setResolveModel(fn)` lets tests/harness inject model info
 * without hitting Postgres.
 */
import type { MiddlewareHandler } from 'hono';
import { extractText, detectPii, sha256 } from '../lib/pii';
import { sql } from '../lib/db';
import { errors } from '../lib/errors';
import { logger } from '../lib/logger';
import type { AuthenticatedApiKey } from './auth-plan04';
import type { ResolvedModel } from '../routing/resolver';

type ResolveModelFn = (slug: string) => Promise<ResolvedModel>;

let resolveModelFn: ResolveModelFn | null = null;

export function setPiiResolveModel(fn: ResolveModelFn | null): void {
  resolveModelFn = fn;
}

export const piiFilter: MiddlewareHandler = async (c, next) => {
  const method = c.req.method.toUpperCase();
  if (method !== 'POST' && method !== 'PUT') return next();

  // Content-type must be JSON (other types not scanned).
  const ct = c.req.header('content-type') ?? '';
  if (!ct.toLowerCase().includes('application/json')) return next();

  let body: Record<string, unknown> | null = null;
  try {
    body = (await c.req.json()) as Record<string, unknown>;
  } catch {
    return next();
  }
  c.set('rawBody' as never, body as never);
  if (!body) return next();

  const text = extractText(body);
  const hits = detectPii(text);
  if (hits.length === 0) return next();

  const key = c.get('apiKey' as never) as AuthenticatedApiKey | undefined;
  const modelSlug = typeof body.model === 'string' ? body.model : '';

  // Determine transborder: use resolver if available; default isTransborder=true
  // when slug prefix hints non-RU (e.g. 'openai/', 'anthropic/') to fail-safe.
  let isTransborder = /^(openai|anthropic|together|mistral|google|cohere)\//.test(
    modelSlug
  );
  if (resolveModelFn && modelSlug) {
    try {
      const model = await resolveModelFn(modelSlug);
      const first = model.candidates[0];
      isTransborder = !(first?.ru_residency ?? false);
    } catch (e) {
      logger.warn({ err: String(e), modelSlug }, 'pii_resolve_model_failed');
    }
  }

  const policies = (key?.policies ?? {}) as Record<string, unknown>;
  const allow = policies.allow_pii_transborder === true;
  const blockingHits = hits.filter((h) => h.blocking);
  const shouldBlock = isTransborder && !allow && blockingHits.length > 0;

  const orgId = key?.org_id ?? null;
  const requestId = c.get('requestId' as never) as string | undefined;

  for (const h of hits) {
    const action = shouldBlock && h.blocking ? 'block' : h.blocking ? 'pass' : 'warn';
    if (orgId) {
      sql`
        INSERT INTO pii_detections (org_id, request_id, kind, sample_hash, action, model_slug)
        VALUES (${orgId}::uuid, ${requestId ?? null}, ${h.kind},
                ${sha256(h.sample)}, ${action}, ${modelSlug || null})
      `.catch((e) => logger.warn({ err: String(e) }, 'pii_insert_fail'));
    }
  }

  if (shouldBlock) {
    throw errors.forbidden('PII detected; transborder blocked by policy');
  }
  await next();
};
