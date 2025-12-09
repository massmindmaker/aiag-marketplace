import { test, expect } from '@playwright/test';

test.describe('Home Page', () => {
  test('should load home page successfully', async ({ page }) => {
    await page.goto('/');

    // Check page title
    await expect(page).toHaveTitle(/AIAG/);

    // Check main content is visible
    await expect(page.locator('body')).toBeVisible();
  });

  test('should have navigation elements', async ({ page }) => {
    await page.goto('/');

    // Check for navigation
    const nav = page.locator('nav, header');
    await expect(nav.first()).toBeVisible();
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // Page should still be functional on mobile
    await expect(page.locator('body')).toBeVisible();
  });

  test('should have no console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Filter out known acceptable errors
    const criticalErrors = errors.filter(
      (e) =>
        !e.includes('favicon') &&
        !e.includes('404') &&
        !e.includes('hydration')
    );

    expect(criticalErrors).toHaveLength(0);
  });
});

test.describe('Navigation', () => {
  test('should navigate to pricing page', async ({ page }) => {
    await page.goto('/');

    // Try to find and click pricing link
    const pricingLink = page.getByRole('link', { name: /pricing/i });
    if (await pricingLink.isVisible()) {
      await pricingLink.click();
      await expect(page).toHaveURL(/pricing/);
    }
  });

  test('should navigate to docs page', async ({ page }) => {
    await page.goto('/');

    const docsLink = page.getByRole('link', { name: /docs|documentation/i });
    if (await docsLink.isVisible()) {
      await docsLink.click();
      await expect(page).toHaveURL(/docs/);
    }
  });
});

test.describe('Performance', () => {
  test('should load within acceptable time', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    const loadTime = Date.now() - startTime;

    // Page should load within 5 seconds
    expect(loadTime).toBeLessThan(5000);
  });
});
