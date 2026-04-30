import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Login via dev bypass first
    await page.goto('/login');
    await page.click('button:has-text("Dev Bypass")');
    await page.waitForURL(/\/dashboard/);
  });

  test('loads dashboard overview', async ({ page }) => {
    await expect(page.locator('h1:has-text("Dashboard")')).toBeVisible();
    await expect(page.locator('text=Overview of FELO platform health')).toBeVisible();
  });

  test('displays stat cards', async ({ page }) => {
    await expect(page.locator('text=Total Users')).toBeVisible();
    await expect(page.locator('text=Active Today')).toBeVisible();
    await expect(page.locator('text=MRR')).toBeVisible();
    await expect(page.locator('text=ARPU')).toBeVisible();
    await expect(page.locator('text=Churn Rate')).toBeVisible();
    await expect(page.locator('text=Transactions')).toBeVisible();
  });

  test('displays charts section', async ({ page }) => {
    await expect(page.locator('text=Signup Funnel (30d)')).toBeVisible();
    await expect(page.locator('text=Transactions by Source')).toBeVisible();
  });

  test('displays service health section', async ({ page }) => {
    await expect(page.locator('text=Service Health')).toBeVisible();
  });

  test('displays recent audit log', async ({ page }) => {
    await expect(page.locator('text=Recent Audit Log')).toBeVisible();
  });

  test('sidebar navigation is visible', async ({ page }) => {
    await expect(page.locator('text=Dashboard')).toBeVisible();
    await expect(page.locator('text=Users')).toBeVisible();
    await expect(page.locator('text=Subscriptions')).toBeVisible();
  });
});
