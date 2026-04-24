/**
 * UpstreamRegistry — gateway-facing lookup from `upstream.name` to concrete adapter.
 *
 * Gateway routing (Plan 04) resolves a model → picks a provider → calls
 * `registry.get(provider)` → invokes the right modality method. Adapters are
 * registered once at boot (see `apps/api-gateway/src/bootstrap.ts` in Plan 04).
 *
 * Names are canonical (Plan 05 N1/N6): `openrouter`, `together`, `yandexgpt`,
 * `kie`, `fal`, `huggingface`, `replicate-passthrough`.
 */
import type { UpstreamAdapter } from './base/UpstreamAdapter';

export class UpstreamRegistry {
  private map = new Map<string, UpstreamAdapter>();

  register(adapter: UpstreamAdapter): void {
    if (this.map.has(adapter.name)) {
      throw new Error(`UpstreamRegistry: duplicate adapter name "${adapter.name}"`);
    }
    this.map.set(adapter.name, adapter);
  }

  get(name: string): UpstreamAdapter {
    const a = this.map.get(name);
    if (!a) throw new Error(`UpstreamRegistry: no adapter registered for "${name}"`);
    return a;
  }

  has(name: string): boolean {
    return this.map.has(name);
  }

  names(): string[] {
    return Array.from(this.map.keys());
  }

  all(): UpstreamAdapter[] {
    return Array.from(this.map.values());
  }
}
