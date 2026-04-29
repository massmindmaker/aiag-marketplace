/**
 * Referral code generator.
 *
 * Format: `<PREFIX>-<6 chars from base32 alphabet>`
 *   - PREFIX is uppercase derived from email local-part (first 3 letters, A-Z only)
 *     or 'REF' if local-part is too short/non-alpha
 *   - 6-char suffix is from a Crockford-like alphabet (no I, O, 1, 0 to avoid
 *     visual ambiguity in shared links)
 *
 * Total length: prefix (3) + '-' (1) + 6 = 10 chars (always ≤ 24, fits VARCHAR(24)).
 */

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 32 chars, no I/O/1/0

export function generateSuffix(rng: () => number = Math.random): string {
  let out = '';
  for (let i = 0; i < 6; i++) {
    out += ALPHABET[Math.floor(rng() * ALPHABET.length)];
  }
  return out;
}

export function derivePrefix(email: string | null | undefined): string {
  if (!email) return 'REF';
  const local = email.split('@')[0] ?? '';
  const letters = local.toUpperCase().replace(/[^A-Z]/g, '');
  if (letters.length >= 3) return letters.slice(0, 3);
  if (letters.length > 0) return (letters + 'REF').slice(0, 3);
  return 'REF';
}

export function generateReferralCode(
  email: string | null | undefined,
  rng: () => number = Math.random
): string {
  return `${derivePrefix(email)}-${generateSuffix(rng)}`;
}

/**
 * Validate user-provided referral code shape (defensive — actual existence
 * check goes through the DB).
 */
export function isValidReferralCodeShape(code: string): boolean {
  if (typeof code !== 'string') return false;
  if (code.length < 5 || code.length > 24) return false;
  return /^[A-Z]{1,8}-[A-Z2-9]{4,12}$/.test(code);
}

/**
 * Anonymize an email for the referrals dashboard — `b***@gmail.com`.
 */
export function anonymizeEmail(email: string): string {
  if (!email || !email.includes('@')) return '***';
  const [local, domain] = email.split('@');
  if (!local || !domain) return '***';
  const head = local[0] ?? '*';
  return `${head}***@${domain}`;
}
