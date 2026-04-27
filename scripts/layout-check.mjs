import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const OUT = process.env.OUT || 'C:/Users/боб/brain/Projects/AIAG/Sessions/2026-04-27-layout-check';
mkdirSync(OUT, { recursive: true });

const URL = 'https://ai-aggregator.ru/';
const VIEWS = [
  { w: 1440, h: 900, label: 'desktop' },
  { w: 768, h: 1024, label: 'tablet' },
  { w: 375, h: 812, label: 'mobile' },
];

const browser = await chromium.launch({ headless: true });

for (const { w, h, label } of VIEWS) {
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(`[console] ${m.text().slice(0, 200)}`); });
  page.on('pageerror', e => errors.push(`[pageerror] ${e.message.slice(0, 200)}`));
  page.on('requestfailed', r => errors.push(`[reqfail] ${r.url().slice(0, 80)} ${r.failure()?.errorText}`));

  try {
    await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 25000 });
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(1500); // let animations settle

    // Detect horizontal overflow
    const overflow = await page.evaluate(() => {
      const issues = [];
      const docW = document.documentElement.clientWidth;
      const all = document.querySelectorAll('body *');
      all.forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.right > docW + 1) {
          const tag = el.tagName.toLowerCase();
          const cls = (el.className && typeof el.className === 'string' ? el.className.slice(0, 60) : '');
          const text = (el.textContent || '').trim().slice(0, 50);
          issues.push({ tag, cls, text, right: Math.round(r.right), docW });
        }
      });
      // De-dup similar
      const seen = new Set();
      return issues.filter(i => {
        const k = `${i.tag}.${i.cls}`;
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      }).slice(0, 15);
    });

    // Color/contrast check — sample some text colors
    const samples = await page.evaluate(() => {
      const els = ['h1', 'h2', 'h3', 'p', 'a', 'button'];
      return els.map(t => {
        const el = document.querySelector(t);
        if (!el) return null;
        const cs = getComputedStyle(el);
        return { tag: t, color: cs.color, bg: cs.backgroundColor, fontSize: cs.fontSize, text: el.textContent?.trim().slice(0, 40) };
      }).filter(Boolean);
    });

    const file = join(OUT, `home_${label}_${w}x${h}.png`);
    await page.screenshot({ path: file, fullPage: true });

    console.log(JSON.stringify({ label, viewport: `${w}x${h}`, errors: errors.slice(0, 5), overflowIssues: overflow, samples, screenshot: file }, null, 2));
  } catch (e) {
    console.log(JSON.stringify({ label, error: e.message.slice(0, 200), errors }));
  }

  await page.close();
}

await browser.close();
console.log('OUT=' + OUT);
