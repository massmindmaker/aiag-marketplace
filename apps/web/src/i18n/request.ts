import { getRequestConfig } from 'next-intl/server';
import { defaultLocale, isLocale } from './config';

/**
 * next-intl request config.
 * Plan 03 MVP: pages stay at root (no `[locale]/` prefix). Locale is read
 * from NEXT_LOCALE cookie or Accept-Language; falls back to `ru`.
 * Full `[locale]` route-group rewrite deferred to Plan 08 (real translations).
 */
export default getRequestConfig(async ({ requestLocale }) => {
  const req = await requestLocale;
  const locale = req && isLocale(req) ? req : defaultLocale;
  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
