export const locales = [
  'ru',
  'en',
  'zh-CN',
  'hi',
  'ko',
  'pt-BR',
  'es',
  'ar',
] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'ru';

/** Right-to-left locales (MVP: only Arabic is RTL). */
export const rtlLocales: Locale[] = ['ar'];

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}
