/**
 * UpstreamRegistry — gateway-facing lookup from `upstream.name` to concrete adapter.
 *
 * Gateway routing (Plan 04) resolves a model → picks a provider → calls
 * `registry.get(provider)` → invokes the right modality method. Adapters are
 * registered once at boot (see `apps/api-gateway/src/bootstrap.ts` in Plan 04).
 *
 * Names are canonical (Plan 05 N1/N6): `openrouter`, `together`, `yandexgpt`,
 * `kie`, `fal`, `huggingface`, `replicate-passthrough`, `mock`.
 */
import type { UpstreamAdapter } from './base/UpstreamAdapter';
import { OpenRouterAdapter, type OpenRouterConfig } from './adapters/openrouter';
import { FalAdapter, type FalConfig } from './adapters/fal';
import { KieAdapter, type KieConfig } from './adapters/kie';
import { HuggingFaceAdapter, type HuggingFaceConfig } from './adapters/huggingface';
import { TogetherAdapter, type TogetherConfig } from './adapters/together';
import { YandexGPTAdapter, type YandexGPTConfig } from './adapters/yandexgpt';
import { ReplicateAdapter, type ReplicateConfig } from './adapters/replicate';
import { MockAdapter, type MockAdapterConfig } from './adapters/mock';

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

/** Union of all adapter-specific configs (factory input). */
export type UpstreamAdapterConfig =
  | ({ name: 'openrouter' } & OpenRouterConfig)
  | ({ name: 'fal' } & FalConfig)
  | ({ name: 'kie' } & KieConfig)
  | ({ name: 'huggingface' } & HuggingFaceConfig)
  | ({ name: 'together' } & TogetherConfig)
  | ({ name: 'yandexgpt' } & YandexGPTConfig)
  | ({ name: 'replicate-passthrough' } & ReplicateConfig)
  | ({ name: 'mock' } & MockAdapterConfig);

/**
 * Factory: create a concrete adapter instance by canonical name.
 * Useful for bootstrapping from JSON config (env / DB) without
 * importing every adapter class in the gateway bootstrap file.
 */
export function createUpstreamAdapter(cfg: UpstreamAdapterConfig): UpstreamAdapter {
  switch (cfg.name) {
    case 'openrouter':
      return new OpenRouterAdapter(cfg);
    case 'fal':
      return new FalAdapter(cfg);
    case 'kie':
      return new KieAdapter(cfg);
    case 'huggingface':
      return new HuggingFaceAdapter(cfg);
    case 'together':
      return new TogetherAdapter(cfg);
    case 'yandexgpt':
      return new YandexGPTAdapter(cfg);
    case 'replicate-passthrough':
      return new ReplicateAdapter(cfg);
    case 'mock':
      return new MockAdapter(cfg);
    default:
      throw new Error(`createUpstreamAdapter: unknown adapter name "${(cfg as any).name}"`);
  }
}

/**
 * Convenience builder: registers all working adapters in a single registry.
 * Callers can optionally pass configs; missing adapters are skipped so you
 * can create a partial registry (e.g. dev = mock + openrouter, prod = all).
 */
export function createDefaultRegistry(
  configs: Partial<Record<UpstreamAdapterConfig['name'], Record<string, unknown>>>,
): UpstreamRegistry {
  const reg = new UpstreamRegistry();
  for (const [name, cfg] of Object.entries(configs)) {
    const adapter = createUpstreamAdapter({ name, ...(cfg ?? {}) } as UpstreamAdapterConfig);
    reg.register(adapter);
  }
  return reg;
}
