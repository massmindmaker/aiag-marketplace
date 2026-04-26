import { describe, it, expect } from 'vitest';
import { UpstreamRegistry, createUpstreamAdapter, createDefaultRegistry } from '../registry';
import { FalAdapter } from '../adapters/fal';
import { KieAdapter } from '../adapters/kie';
import { HuggingFaceAdapter } from '../adapters/huggingface';
import { OpenRouterAdapter } from '../adapters/openrouter';
import { TogetherAdapter } from '../adapters/together';
import { MockAdapter } from '../adapters/mock';

describe('UpstreamRegistry', () => {
  it('registers and retrieves adapters by canonical name', () => {
    const reg = new UpstreamRegistry();
    const fal = new FalAdapter({ apiKey: 'k' });
    reg.register(fal);
    expect(reg.get('fal')).toBe(fal);
    expect(reg.has('fal')).toBe(true);
  });

  it('throws on duplicate registration', () => {
    const reg = new UpstreamRegistry();
    reg.register(new FalAdapter({ apiKey: 'k' }));
    expect(() => reg.register(new FalAdapter({ apiKey: 'k' }))).toThrow(/duplicate/);
  });

  it('throws on unknown adapter lookup', () => {
    const reg = new UpstreamRegistry();
    expect(() => reg.get('nope')).toThrow(/no adapter/);
  });

  it('lists all registered names + instances', () => {
    const reg = new UpstreamRegistry();
    reg.register(new OpenRouterAdapter({ apiKey: 'k' }));
    reg.register(new TogetherAdapter({ apiKey: 'k' }));
    reg.register(new KieAdapter({ apiKey: 'k' }));
    reg.register(new HuggingFaceAdapter({ apiKey: 'k' }));
    reg.register(new MockAdapter());
    const names = reg.names().sort();
    expect(names).toEqual(['huggingface', 'kie', 'mock', 'openrouter', 'together']);
    expect(reg.all()).toHaveLength(5);
  });

  it('supports multi-provider lookup for a single modality (failover chain)', () => {
    const reg = new UpstreamRegistry();
    reg.register(new TogetherAdapter({ apiKey: 'k' }));
    reg.register(new HuggingFaceAdapter({ apiKey: 'k' }));

    // Simulated gateway chain: try together → fall back to huggingface
    const chain = ['together', 'huggingface'].map((n) => reg.get(n));
    expect(chain[0].name).toBe('together');
    expect(chain[1].name).toBe('huggingface');
    expect(chain[0].supports_modalities).toContain('chat');
    expect(chain[1].supports_modalities).toContain('chat');
  });
});

describe('createUpstreamAdapter', () => {
  it('creates openrouter adapter', () => {
    const a = createUpstreamAdapter({ name: 'openrouter', apiKey: 'k' });
    expect(a.name).toBe('openrouter');
    expect(a.supports_modalities).toContain('chat');
  });

  it('creates fal adapter', () => {
    const a = createUpstreamAdapter({ name: 'fal', apiKey: 'k' });
    expect(a.name).toBe('fal');
    expect(a.supports_modalities).toContain('image');
  });

  it('creates mock adapter', () => {
    const a = createUpstreamAdapter({ name: 'mock' });
    expect(a.name).toBe('mock');
    expect(a.supports_modalities).toContain('chat');
  });

  it('creates together adapter', () => {
    const a = createUpstreamAdapter({ name: 'together', apiKey: 'k' });
    expect(a.name).toBe('together');
  });

  it('creates huggingface adapter', () => {
    const a = createUpstreamAdapter({ name: 'huggingface', apiKey: 'k' });
    expect(a.name).toBe('huggingface');
  });

  it('creates kie adapter', () => {
    const a = createUpstreamAdapter({ name: 'kie', apiKey: 'k' });
    expect(a.name).toBe('kie');
  });

  it('throws on unknown adapter name', () => {
    expect(() => createUpstreamAdapter({ name: 'unknown' } as any)).toThrow(/unknown adapter name/);
  });
});

describe('createDefaultRegistry', () => {
  it('registers only the adapters whose configs are provided', () => {
    const reg = createDefaultRegistry({
      mock: {},
      openrouter: { apiKey: 'k' },
    });
    expect(reg.names().sort()).toEqual(['mock', 'openrouter']);
  });

  it('creates a functional mock registry', async () => {
    const reg = createDefaultRegistry({ mock: {} });
    const adapter = reg.get('mock');
    const models = await adapter.listModels();
    expect(models.length).toBeGreaterThan(0);
  });
});
