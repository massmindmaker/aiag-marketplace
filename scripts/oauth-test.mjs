import { chromium } from '@playwright/test';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const errors = [];
page.on('pageerror', e => errors.push(e.message.slice(0,200)));

await page.goto('https://ai-aggregator.ru/login', { waitUntil: 'domcontentloaded', timeout: 20000 });
await page.waitForTimeout(2000);

// Find GitHub button by text
const buttons = await page.evaluate(() => {
  return [...document.querySelectorAll('button, a')].map(b => ({
    text: (b.textContent || '').trim().slice(0, 30),
    href: b.getAttribute('href'),
    type: b.tagName,
  })).filter(b => /github|google|яндекс|вк|вконтакте/i.test(b.text));
});
console.log('Found OAuth buttons:', JSON.stringify(buttons, null, 2));

// Click GitHub
const ghLink = page.locator('button:has-text("GitHub"), a:has-text("GitHub")').first();
if (await ghLink.count() > 0) {
  // Don't actually navigate to github (we'd need real credentials), just check the URL it would go to
  const formAction = await page.evaluate(() => {
    const forms = [...document.querySelectorAll('form')];
    return forms.map(f => ({ action: f.action, method: f.method }));
  });
  console.log('Forms on page:', JSON.stringify(formAction, null, 2));
}

// Try sign-in via NextAuth API directly
const res = await page.request.post('https://ai-aggregator.ru/api/auth/signin/github', {
  data: { csrfToken: '' },
  failOnStatusCode: false,
});
console.log('signin/github status:', res.status());

// Errors
console.log('Errors:', errors);

await browser.close();
