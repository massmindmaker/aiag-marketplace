import { createHash, randomBytes } from 'node:crypto';

/**
 * Plan 10 self-service API key generation.
 *
 * Format: `sk_aiag_<env>_<22+ char base64url>`. Stored as SHA-256 hex in
 * `gateway_api_keys.key_hash`; `key_prefix` = first 20 chars.
 */
export function generateApiKey(env: 'live' | 'test' = 'live'): {
  key: string;
  hash: string;
  prefix: string;
} {
  const raw = randomBytes(24).toString('base64url');
  const key = `sk_aiag_${env}_${raw}`;
  return {
    key,
    hash: hashKey(key),
    prefix: key.slice(0, 20),
  };
}

export function hashKey(key: string): string {
  return createHash('sha256').update(key).digest('hex');
}
