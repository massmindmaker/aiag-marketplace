import { XMLParser } from 'fast-xml-parser';
import { config } from '../config';
import { makeRedis } from './redis';
import { logger } from './logger';
import { errors } from './errors';

const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' });

// FIX H6.3: retry schedule — 3 attempts per URL with backoff 0s, 1s, 3s.
const RETRIES = [
  { delayMs: 0, timeoutMs: 10_000 },
  { delayMs: 1_000, timeoutMs: 15_000 },
  { delayMs: 3_000, timeoutMs: 15_000 },
];

async function fetchXmlOnce(url: string, timeoutMs: number): Promise<string> {
  const res = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
  if (!res.ok) throw new Error(`CBR HTTP ${res.status}`);
  return res.text();
}

/**
 * Parses CBR XML and returns raw USD/RUB (nominal-adjusted).
 * FIX H6.4: sanity check 30..500.
 */
export function parseUsdRub(xml: string): number {
  const doc: unknown = parser.parse(xml);
  // deliberate loose typing — XML may produce arrays or singletons
  const valutesRaw = (doc as any)?.ValCurs?.Valute;
  const valutes: unknown[] = Array.isArray(valutesRaw)
    ? valutesRaw
    : valutesRaw
      ? [valutesRaw]
      : [];
  const usd: any = valutes.find((v: any) => v?.['@_ID'] === 'R01235');
  if (!usd) throw new Error('CBR: R01235 (USD) not found');
  const nominal = Number(usd.Nominal) || 1;
  const rawValue = parseFloat(String(usd.Value).replace(',', '.'));
  const rate = rawValue / nominal;
  if (!Number.isFinite(rate) || rate < 30 || rate > 500) {
    throw new Error(`CBR rate out of sane range: ${rate}`);
  }
  return rate;
}

/**
 * Daily-cached CBR USD/RUB rate with 2% configurable spread + fallback to
 * `last_known` value (7d retention) when fetch fails.
 */
export async function fetchUsdRubRate(): Promise<number> {
  const redis = makeRedis('cache');
  const cacheKey = 'cbr:usd_rub:today';
  const cached = await redis.get(cacheKey);
  if (cached) return parseFloat(cached);

  const urls = [config.CBR_URL, config.CBR_FALLBACK_URL].filter(
    (u): u is string => typeof u === 'string' && u.length > 0
  );
  let lastErr: unknown;

  for (const url of urls) {
    for (const { delayMs, timeoutMs } of RETRIES) {
      if (delayMs) await new Promise((r) => setTimeout(r, delayMs));
      try {
        const xml = await fetchXmlOnce(url, timeoutMs);
        const base = parseUsdRub(xml);
        const rate = base * (1 + config.CBR_RATE_SPREAD_PCT / 100);
        await redis.setex(cacheKey, 24 * 3600, rate.toFixed(4));
        await redis.setex('cbr:usd_rub:last_known', 7 * 24 * 3600, rate.toFixed(4));
        return rate;
      } catch (e) {
        lastErr = e;
        logger.warn({ url, err: String(e) }, 'cbr_fetch_attempt_failed');
      }
    }
  }

  const last = await redis.get('cbr:usd_rub:last_known');
  if (last) {
    logger.warn({ lastErr: String(lastErr) }, 'CBR unavailable, using last_known');
    return parseFloat(last);
  }
  throw errors.unavailable('CBR rate unavailable and no fallback');
}
