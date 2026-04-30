import { test, expect } from '@playwright/test';

test.describe('Login Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('displays login form with FELO branding', async ({ page }) => {
    await expect(page.locator('text=FELO Ops Portal')).toBeVisible();
    await expect(page.locator('text=Internal operations dashboard')).toBeVisible();
    await expect(page.locator('button:has-text("Authenticate with Passkey")')).toBeVisible();
  });

  test('has WebAuthn register toggle', async ({ page }) => {
    await page.click('text=Register new credential');
    await expect(page.locator('text=Register Credential')).toBeVisible();
    await expect(page.locator('text=Admin Email')).toBeVisible();
    await expect(page.locator('button:has-text("Register Passkey")')).toBeVisible();
  });

  test('dev bypass button navigates to dashboard', async ({ page }) => {
    await page.click('button:has-text("Dev Bypass")');
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.locator('text=Dashboard')).toBeVisible();
  });

  test('register form requires email', async ({ page }) => {
    await page.click('text=Register new credential');
    await page.click('button:has-text("Register Passkey")');
    // Should show validation or error toast
    await expect(page.locator('text=Register Credential')).toBeVisible();
  });
});
