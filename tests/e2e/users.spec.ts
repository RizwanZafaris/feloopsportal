import { test, expect } from '@playwright/test';

test.describe('Users Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.click('button:has-text("Dev Bypass")');
    await page.waitForURL(/\/dashboard/);
  });

  test('navigates to users list', async ({ page }) => {
    await page.click('text=Users');
    await page.waitForURL(/\/users/);
    await expect(page.locator('h1:has-text("Users")')).toBeVisible();
    await expect(page.locator('text=Manage and view all platform users')).toBeVisible();
  });

  test('users page has search and filters', async ({ page }) => {
    await page.goto('/users');
    await expect(page.locator('input[placeholder*="Search"]')).toBeVisible();
    await expect(page.locator('text=All Corridors')).toBeVisible();
    await expect(page.locator('text=All Tiers')).toBeVisible();
  });

  test('users table has correct headers', async ({ page }) => {
    await page.goto('/users');
    await expect(page.locator('th:has-text("Email")')).toBeVisible();
    await expect(page.locator('th:has-text("Name")')).toBeVisible();
    await expect(page.locator('th:has-text("Corridor")')).toBeVisible();
    await expect(page.locator('th:has-text("Tier")')).toBeVisible();
    await expect(page.locator('th:has-text("Created")')).toBeVisible();
  });

  test('user detail page loads', async ({ page }) => {
    await page.goto('/users');
    // Wait for table to load, then click first View button
    await page.waitForSelector('button:has-text("View")', { timeout: 5000 });
    await page.click('button:has-text("View")');
    await page.waitForURL(/\/users\/.+/);
    await expect(page.locator('text=Account Info')).toBeVisible();
    await expect(page.locator('text=Force Logout')).toBeVisible();
  });
});
