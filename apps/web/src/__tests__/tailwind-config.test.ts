import { describe, it, expect } from 'vitest';
import config from '../../tailwind.config';

describe('tailwind.config.ts', () => {
  const ext = config.theme?.extend as Record<string, any>;

  it('wires Inter into fontFamily.sans via CSS variable', () => {
    expect(ext.fontFamily.sans).toContain('var(--font-inter)');
  });

  it('wires JetBrains Mono into fontFamily.mono via CSS variable', () => {
    expect(ext.fontFamily.mono).toContain('var(--font-jetbrains-mono)');
  });

  it('exposes typography scale from 2xs to 7xl', () => {
    const sizes = Object.keys(ext.fontSize);
    for (const k of ['2xs', 'xs', 'sm', 'base', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl', '6xl', '7xl']) {
      expect(sizes).toContain(k);
    }
  });

  it('adds xs (480px) breakpoint for mobile-first design', () => {
    expect(ext.screens.xs).toBe('480px');
  });

  it('keeps colour tokens hooked to CSS vars', () => {
    expect(ext.colors.background).toBe('hsl(var(--background))');
    expect(ext.colors.primary.DEFAULT).toBe('hsl(var(--primary))');
  });
});
