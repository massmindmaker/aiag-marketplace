import { describe, it, expect } from 'vitest';
import { locales, defaultLocale, rtlLocales, isLocale } from '../i18n/config';

describe('i18n config (Plan 03 Task 4)', () => {
  it('exports 8 locales', () => {
    expect(locales).toHaveLength(8);
    expect(locales).toEqual([
      'ru',
      'en',
      'zh-CN',
      'hi',
      'ko',
      'pt-BR',
      'es',
      'ar',
    ]);
  });

  it('defaultLocale is ru', () => {
    expect(defaultLocale).toBe('ru');
  });

  it('ar is marked RTL', () => {
    expect(rtlLocales).toContain('ar');
  });

  it('isLocale narrows correctly', () => {
    expect(isLocale('ru')).toBe(true);
    expect(isLocale('xx')).toBe(false);
  });
});
