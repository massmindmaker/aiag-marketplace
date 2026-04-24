import { describe, it, expect } from 'vitest';
import { UpstreamRegistry } from '../registry';
import { FalAdapter } from '../adapters/fal';
import { KieAdapter } from '../adapters/kie';
import { HuggingFaceAdapter } from '../adapters/huggingface';
import { OpenRouterAdapter } from '../adapters/openrouter';
import { TogetherAdapter } from '../adapters/together';

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
    const names = reg.names().sort();
    expect(names).toEqual(['huggingface', 'kie', 'openrouter', 'together']);
    expect(reg.all()).toHaveLength(4);
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
