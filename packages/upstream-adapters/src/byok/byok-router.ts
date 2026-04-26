/**
 * BYOK router — resolves the API key to use for a given upstream invocation.
 *
 * Priority order (Plan 05 Task 10):
 *   1. Per-request override (`X-Upstream-Key` header → `headerOverride`)
 *   2. Org's stored encrypted key (DB lookup → AES-256-GCM decrypt with KEK_TENANT)
 *   3. `null` — caller falls back to the platform's admin key (normal markup path)
 *
 * Billing implication: when this returns a non-null key, the gateway charges
 * a flat `BYOK_FEE_RUB` (default 0.5 ₽) instead of markup-based pricing.
 */
import { decryptAesGcm, encryptAesGcm, type EncryptedSecret, type KekInput } from './encryption';

export type OrgByokKeys = Record<string, EncryptedSecret>;

export interface ByokRouterConfig {
  kek: KekInput;
  /** Fetches encrypted byok_keys blob for an org. */
  getOrgKeys: (orgId: string) => Promise<OrgByokKeys | null>;
  /** Persists the updated byok_keys blob for an org. */
  setOrgKeys?: (orgId: string, keys: OrgByokKeys) => Promise<void>;
  /** Override BYOK fee (₽). Defaults to env BYOK_FEE_RUB or 0.5. */
  feeRub?: number;
}

export class ByokRouter {
  constructor(private cfg: ByokRouterConfig) {}

  async resolveKey(
    orgId: string,
    upstreamName: string,
    headerOverride?: string | null,
  ): Promise<string | null> {
    if (headerOverride) return headerOverride;
    const keys = await this.cfg.getOrgKeys(orgId);
    const enc = keys?.[upstreamName];
    if (!enc) return null;
    return decryptAesGcm(enc, this.cfg.kek);
  }

  /**
   * Returns true iff the key passed to the adapter is user-supplied (BYOK),
   * regardless of whether it came from per-request header or stored vault.
   */
  async isByok(
    orgId: string,
    upstreamName: string,
    headerOverride?: string | null,
  ): Promise<boolean> {
    return (await this.resolveKey(orgId, upstreamName, headerOverride)) !== null;
  }

  computeGatewayFeeRub(): number {
    if (typeof this.cfg.feeRub === 'number') return this.cfg.feeRub;
    return Number(process.env.BYOK_FEE_RUB ?? 0.5);
  }

  async saveKey(orgId: string, upstreamName: string, plaintext: string): Promise<void> {
    if (!this.cfg.setOrgKeys) {
      throw new Error('ByokRouter.saveKey requires setOrgKeys in config');
    }
    const encrypted = encryptAesGcm(plaintext, this.cfg.kek);
    const existing = (await this.cfg.getOrgKeys(orgId)) ?? {};
    existing[upstreamName] = encrypted;
    await this.cfg.setOrgKeys(orgId, existing);
  }

  async deleteKey(orgId: string, upstreamName: string): Promise<void> {
    if (!this.cfg.setOrgKeys) {
      throw new Error('ByokRouter.deleteKey requires setOrgKeys in config');
    }
    const existing = (await this.cfg.getOrgKeys(orgId)) ?? {};
    delete existing[upstreamName];
    await this.cfg.setOrgKeys(orgId, existing);
  }

  async revokeAll(orgId: string): Promise<void> {
    if (!this.cfg.setOrgKeys) {
      throw new Error('ByokRouter.revokeAll requires setOrgKeys in config');
    }
    await this.cfg.setOrgKeys(orgId, {});
  }

  /**
   * Returns a masked preview (last 4 chars) for UI — never returns plaintext.
   */
  async listMasked(orgId: string): Promise<Array<{ upstream: string; masked: string }>> {
    const keys = (await this.cfg.getOrgKeys(orgId)) ?? {};
    const out: Array<{ upstream: string; masked: string }> = [];
    for (const [upstream, enc] of Object.entries(keys)) {
      try {
        const plain = decryptAesGcm(enc, this.cfg.kek);
        const last4 = plain.length >= 4 ? plain.slice(-4) : '****';
        out.push({ upstream, masked: `***${last4}` });
      } catch {
        out.push({ upstream, masked: '***(unreadable)' });
      }
    }
    return out;
  }
}
