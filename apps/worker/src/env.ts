import { readFileSync } from 'node:fs';

/**
 * Load .env from the shared VPS path (or a custom path) into process.env.
 * Used by /srv/aiag/shared/.env in production. Missing file is non-fatal —
 * env vars may already be exported by pm2/systemd.
 */
export function loadSharedEnv(path = process.env.SHARED_ENV_PATH ?? '/srv/aiag/shared/.env'): void {
  try {
    const txt = readFileSync(path, 'utf8');
    for (const line of txt.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const m = trimmed.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
      if (!m) continue;
      const [, key, rawVal] = m;
      if (process.env[key] !== undefined) continue; // do not override
      // strip surrounding quotes
      const val = rawVal.replace(/^["']|["']$/g, '');
      process.env[key] = val;
    }
  } catch {
    // ignore — likely dev environment without the shared file
  }
}
