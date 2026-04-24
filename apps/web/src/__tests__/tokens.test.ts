import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('CSS design tokens (Plan 03)', () => {
  const css = readFileSync(
    join(__dirname, '..', 'app', 'globals.css'),
    'utf8'
  );

  const extendedTokens = [
    '--bg',
    '--bg-elev',
    '--ink',
    '--ink-muted',
    '--line',
    '--accent-hover',
    '--accent-ink',
    '--warning',
    '--danger',
    '--success',
  ];

  it.each(extendedTokens)('defines %s in :root (dark default)', (token) => {
    const re = new RegExp(`:root[\\s\\S]*?${token}\\s*:`, 'm');
    expect(css).toMatch(re);
  });

  it.each(extendedTokens)('defines %s in .light override', (token) => {
    const re = new RegExp(`\\.light[\\s\\S]*?${token}\\s*:`, 'm');
    expect(css).toMatch(re);
  });

  it('primary (amber) is 38 92% 50% in HSL', () => {
    expect(css).toMatch(/--primary:\s*38 92% 50%/);
  });

  it('honors prefers-reduced-motion', () => {
    expect(css).toMatch(/prefers-reduced-motion:\s*reduce/);
  });
});
