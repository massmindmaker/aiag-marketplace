import type { MetadataRoute } from 'next';

/**
 * Plan 08 Task 6 — robots.txt (Next.js app-router dynamic).
 * Блокируем AI-crawlers (GPTBot, ClaudeBot, CCBot) от индексации нашего
 * контента. Yandex + Google — allowed.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: ['/api/', '/admin/', '/account/'] },
      { userAgent: 'GPTBot', disallow: '/' },
      { userAgent: 'ClaudeBot', disallow: '/' },
      { userAgent: 'CCBot', disallow: '/' },
      { userAgent: 'anthropic-ai', disallow: '/' },
      { userAgent: 'Yandex', allow: '/' },
      { userAgent: 'Googlebot', allow: '/' },
    ],
    sitemap: 'https://ai-aggregator.ru/sitemap.xml',
    host: 'https://ai-aggregator.ru',
  };
}
