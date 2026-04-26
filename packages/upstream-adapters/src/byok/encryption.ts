/**
 * AES-256-GCM encryption primitives for BYOK layer.
 *
 * Threat model (Plan 05 §4.2, Task 10):
 * - Ciphertext + IV + auth tag stored per secret (jsonb in DB).
 * - Two KEKs are separated (H5): `BYOK_KEK_TENANT` (org-held BYOK keys) and
 *   `BYOK_KEK_ADMIN` (author DEKs in Replicate passthrough). Leaking one does
 *   NOT compromise the other.
 * - Envelope encryption (H7): admin key protects per-author DEKs; DEKs
 *   protect the actual Replicate tokens. Rotating KEK_ADMIN requires
 *   unwrap+rewrap of each DEK (O(n)), but does NOT touch token ciphertexts.
 * - HKDF-SHA256 subkey derivation (`deriveKek`) lets callers split one master
 *   key into per-tenant sub-KEKs without re-keying ciphertexts — each tenant
 *   gets its own domain-separated key while the master is held once.
 *
 * Notes:
 * - 12-byte random IV (GCM standard). 16-byte auth tag.
 * - Keys accepted as base64(32 bytes) or raw 32-byte Buffer.
 * - Version tag on EncryptedSecret lets us rotate algorithms later.
 */
import { createCipheriv, createDecipheriv, hkdfSync, randomBytes } from 'node:crypto';

export interface EncryptedSecret {
  ciphertext: string;
  iv: string;
  tag: string;
  version: 1;
}

export type KekInput = string | Buffer;

const ALGO = 'aes-256-gcm';
const KEY_BYTES = 32;
const IV_BYTES = 12;

function toKey(kek: KekInput): Buffer {
  if (Buffer.isBuffer(kek)) {
    if (kek.length !== KEY_BYTES) {
      throw new Error(`KEK must be ${KEY_BYTES} bytes (got ${kek.length})`);
    }
    return kek;
  }
  // Accept hex or base64
  const trimmed = kek.trim();
  let buf: Buffer;
  if (/^[0-9a-fA-F]+$/.test(trimmed) && trimmed.length === KEY_BYTES * 2) {
    buf = Buffer.from(trimmed, 'hex');
  } else {
    buf = Buffer.from(trimmed, 'base64');
  }
  if (buf.length !== KEY_BYTES) {
    throw new Error(`KEK must decode to ${KEY_BYTES} bytes (got ${buf.length})`);
  }
  return buf;
}

export function encryptAesGcm(plaintext: string, kek: KekInput): EncryptedSecret {
  const key = toKey(kek);
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGO, key, iv);
  const enc = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    ciphertext: enc.toString('base64'),
    iv: iv.toString('base64'),
    tag: tag.toString('base64'),
    version: 1,
  };
}

export function decryptAesGcm(secret: EncryptedSecret, kek: KekInput): string {
  if (secret.version !== 1) {
    throw new Error(`unsupported EncryptedSecret version ${secret.version}`);
  }
  const key = toKey(kek);
  const iv = Buffer.from(secret.iv, 'base64');
  const tag = Buffer.from(secret.tag, 'base64');
  const ct = Buffer.from(secret.ciphertext, 'base64');
  const decipher = createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(tag);
  const dec = Buffer.concat([decipher.update(ct), decipher.final()]);
  return dec.toString('utf8');
}

/**
 * HKDF-SHA256 subkey derivation. Produces a 32-byte key deterministically from
 * (masterKek, info) so the same master key can be split into domain-separated
 * sub-KEKs (e.g. `"byok:tenant:org-123"`, `"byok:admin:replicate"`).
 *
 * Salt is fixed (empty) — info carries all domain separation, which is the
 * standard HKDF pattern when you trust the master key's entropy.
 */
export function deriveKek(masterKek: KekInput, info: string): Buffer {
  const ikm = toKey(masterKek);
  const out = hkdfSync('sha256', ikm, Buffer.alloc(0), Buffer.from(info, 'utf8'), KEY_BYTES);
  return Buffer.from(out);
}

/** Generate a fresh 32-byte DEK (used for envelope encryption). */
export function generateDek(): Buffer {
  return randomBytes(KEY_BYTES);
}

/**
 * Envelope encrypt: generate a fresh DEK, encrypt plaintext with DEK, then
 * wrap the DEK under kekAdmin. Returns both blobs.
 */
export function envelopeEncrypt(
  plaintext: string,
  kekAdmin: KekInput,
): { secret: EncryptedSecret; dek_encrypted: EncryptedSecret } {
  const dek = generateDek();
  const secret = encryptAesGcm(plaintext, dek);
  const dek_encrypted = encryptAesGcm(dek.toString('base64'), kekAdmin);
  return { secret, dek_encrypted };
}

/**
 * Envelope decrypt: unwrap DEK with kekAdmin, then decrypt secret with DEK.
 */
export function envelopeDecrypt(
  secret: EncryptedSecret,
  dek_encrypted: EncryptedSecret,
  kekAdmin: KekInput,
): string {
  const dekBase64 = decryptAesGcm(dek_encrypted, kekAdmin);
  const dek = Buffer.from(dekBase64, 'base64');
  return decryptAesGcm(secret, dek);
}
