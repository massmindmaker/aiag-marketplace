import { chromium } from '@playwright/test';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

await page.goto('https://ai-aggregator.ru/login', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(1500);

// Click GitHub button — track navigation
let redirectUrl = null;
page.on('framenavigated', f => {
  if (f === page.mainFrame() && f.url().includes('github.com')) {
    redirectUrl = f.url();
  }
});

const ghBtn = page.getByText('GitHub', { exact: false }).first();
await ghBtn.click({ timeout: 5000 }).catch(e => console.log('click err:', e.message));
await page.waitForTimeout(3000);

console.log('Final URL:', page.url());
console.log('GitHub redirect captured:', redirectUrl);

// Parse client_id from GitHub URL
if (page.url().includes('github.com')) {
  const u = new URL(page.url());
  console.log('GitHub OAuth params:');
  console.log('  client_id:', u.searchParams.get('client_id'));
  console.log('  redirect_uri:', u.searchParams.get('redirect_uri'));
  console.log('  scope:', u.searchParams.get('scope'));
  console.log('  ✅ GitHub OAuth flow works!');
} else {
  console.log('⚠️  Did not redirect to github.com');
}

await browser.close();
