/**
 * Yandex Cloud IAM Token Manager.
 *
 * Exchanges a service-account JWT for short-lived IAM token (~12h TTL).
 * Cached in-memory; if Redis provided, cache is shared across pm2 cluster
 * workers so one request refreshes for all (prevents auth-call stampede).
 *
 * Token endpoint:
 *   POST https://iam.api.cloud.yandex.net/iam/v1/tokens
 *   body: { jwt: "<signed JWT>" }
 *   response: { iamToken: "...", expiresAt: "2026-..." }
 *
 * JWT spec (Yandex):
 *   header: { typ: 'JWT', alg: 'PS256', kid: '<authorized_key.id>' }
 *   payload: { aud, iss, iat, exp }  iss = service_account_id, aud = token url
 *
 * For tests we inject a mock signer — production uses `jsonwebtoken` with PS256.
 */
import { createLogger, type Logger } from '../base/logger';

export interface YandexServiceAccountKey {
  id: string;
  service_account_id: string;
  private_key: string; // PEM
}

export interface RedisLike {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, mode?: string, duration?: number): Promise<unknown>;
  setex?(key: string, seconds: number, value: string): Promise<unknown>;
}

export interface YandexIamConfig {
  serviceAccountKey: YandexServiceAccountKey;
  tokenUrl?: string;
  /** JWT signer. Defaults to node jsonwebtoken-based PS256. Injectable for tests. */
  signJwt?: (key: YandexServiceAccountKey) => Promise<string>;
  fetch?: typeof fetch;
  redis?: RedisLike;
  /** Refresh token when remaining TTL < this many seconds (default 600 = 10min) */
  refresh_window_s?: number;
}

interface CachedToken {
  token: string;
  expires_at_ms: number;
}

export class YandexIamTokenManager {
  private cache: CachedToken | null = null;
  private in_flight: Promise<string> | null = null;
  private log: Logger;

  constructor(private cfg: YandexIamConfig) {
    this.log = createLogger('YandexIAM');
  }

  async getToken(): Promise<string> {
    const now = Date.now();
    const windowMs = (this.cfg.refresh_window_s ?? 600) * 1000;
    if (this.cache && this.cache.expires_at_ms - now > windowMs) {
      return this.cache.token;
    }
    // check redis shared cache
    if (this.cfg.redis) {
      const raw = await this.cfg.redis.get(this.redisKey());
      if (raw) {
        try {
          const parsed = JSON.parse(raw) as CachedToken;
          if (parsed.expires_at_ms - now > windowMs) {
            this.cache = parsed;
            return parsed.token;
          }
        } catch {
          // ignore
        }
      }
    }
    if (this.in_flight) return this.in_flight;
    this.in_flight = this.refresh().finally(() => {
      this.in_flight = null;
    });
    return this.in_flight;
  }

  private redisKey(): string {
    return `yandex:iam:${this.cfg.serviceAccountKey.service_account_id}`;
  }

  private async refresh(): Promise<string> {
    const jwt = await (this.cfg.signJwt ?? defaultSigner)(this.cfg.serviceAccountKey);
    const url = this.cfg.tokenUrl ?? 'https://iam.api.cloud.yandex.net/iam/v1/tokens';
    const f = this.cfg.fetch ?? fetch;
    const res = await f(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ jwt }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`Yandex IAM token refresh failed ${res.status}: ${body.slice(0, 200)}`);
    }
    const data = (await res.json()) as { iamToken: string; expiresAt: string };
    const expires_at_ms = Date.parse(data.expiresAt);
    const cached: CachedToken = { token: data.iamToken, expires_at_ms };
    this.cache = cached;
    if (this.cfg.redis) {
      const ttl = Math.max(60, Math.floor((expires_at_ms - Date.now()) / 1000) - 60);
      if (this.cfg.redis.setex) {
        await this.cfg.redis.setex(this.redisKey(), ttl, JSON.stringify(cached));
      } else {
        await this.cfg.redis.set(this.redisKey(), JSON.stringify(cached), 'EX', ttl);
      }
    }
    this.log.info({ service_account_id: this.cfg.serviceAccountKey.service_account_id }, 'iam token refreshed');
    return cached.token;
  }

  /** Test helper — force-expire cached token */
  clearCache(): void {
    this.cache = null;
  }
}

async function defaultSigner(key: YandexServiceAccountKey): Promise<string> {
  // Indirection prevents Vite/bundlers from statically resolving the module,
  // so consumers without jsonwebtoken installed (tests, non-Yandex deploys) still build.
  const moduleName = 'jsonwebtoken';
  let jwt: { sign: (payload: object, key: string, opts: object) => string };
  try {
    jwt = (await import(/* @vite-ignore */ moduleName)) as unknown as typeof jwt;
  } catch {
    throw new Error(
      'jsonwebtoken not installed — provide a `signJwt` function to YandexIamTokenManager or install jsonwebtoken',
    );
  }
  const now = Math.floor(Date.now() / 1000);
  return jwt.sign(
    {
      aud: 'https://iam.api.cloud.yandex.net/iam/v1/tokens',
      iss: key.service_account_id,
      iat: now,
      exp: now + 3600,
    },
    key.private_key,
    { algorithm: 'PS256', keyid: key.id },
  );
}
