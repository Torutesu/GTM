import { test, expect } from '@playwright/test';

const UI_BASE = 'http://localhost:3000';

test.describe('GON UI E2E', () => {
  test('Homepage loads and shows landing page', async ({ page }) => {
    await page.goto(UI_BASE);
    await expect(page.getByText('GON').first()).toBeVisible();
    await expect(page.getByText('Start Free').first()).toBeVisible();
  });

  test('Register page renders', async ({ page }) => {
    await page.goto(`${UI_BASE}/register`);
    await expect(page.getByText('Create Account')).toBeVisible();
    await expect(page.locator('input#email')).toBeVisible();
  });

  test('Login page renders', async ({ page }) => {
    await page.goto(`${UI_BASE}/login`);
    await expect(page.getByText('Welcome Back')).toBeVisible();
    await expect(page.locator('input#email')).toBeVisible();
  });

  test('Pricing page renders', async ({ page }) => {
    await page.goto(`${UI_BASE}/pricing`);
    await expect(page.getByText('Free').first()).toBeVisible();
    await expect(page.getByText('Pro').first()).toBeVisible();
  });

  test('Register -> Onboarding -> Dashboard flow', async ({ page }) => {
    const email = `e2e-${Date.now()}@test.com`;

    // Register
    await page.goto(`${UI_BASE}/register`);
    await page.waitForLoadState('networkidle');
    await page.fill('input#email', email);
    await page.fill('input#password', 'TestPass1!');
    await page.fill('input#name', 'E2E User');
    await page.locator('input[type="checkbox"]').check();
    await page.getByRole('button', { name: /Create/i }).click();
    await page.waitForURL('**/onboarding**', { timeout: 15000 });

    // Step 0: Brand name
    await page.waitForTimeout(1000);
    await page.getByPlaceholder('e.g. Acme Inc.').fill('E2E Brand');
    await page.getByRole('button', { name: 'Continue' }).click();

    // Step 1: Select industry
    await page.waitForTimeout(500);
    await page.getByText('SaaS / Tech').click();
    await page.getByRole('button', { name: 'Continue' }).click();

    // Step 2: Tone (Professional is default, just Continue)
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Continue' }).click();

    // Step 3: Go to Dashboard
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Go to Dashboard' }).click();
    await page.waitForURL('**/dashboard**', { timeout: 15000 });
    await expect(page.getByText('Dashboard').first()).toBeVisible({ timeout: 5000 });
  });

  test('Protected pages redirect to login', async ({ page }) => {
    await page.goto(`${UI_BASE}/dashboard`);
    await page.waitForURL('/login', { timeout: 10000 });
  });
});
