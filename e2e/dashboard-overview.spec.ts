import { test, expect } from '@playwright/test';

test('Dashboard Overview loads and displays data', async ({ page }) => {
  await page.goto('http://localhost:5174/');

  // Login with user-provided credentials
  await page.fill('input[name="email"]', 'mohakhatri07@gmail.com');
  await page.fill('input[name="password"]', 'mk@1234');
  await page.click('button[type="submit"]');

  // Wait for the main dashboard to load after successful login
  await page.waitForURL('**/dashboard', { timeout: 20000 });
  await expect(page.locator('h1:has-text("Welcome")')).toBeVisible();

  // Navigate to Dashboard Overview tab
  await page.click('button[role="tab"]:has-text("Dashboard Overview")');

  // Wait for the tab to load and check for the heading
  await expect(page.locator('h1:has-text("Leafiniti Sales Dashboard")')).toBeVisible({ timeout: 10000 });

  // Wait for cards to be visible to ensure data has started rendering
  await expect(page.locator('p:has-text("Combined Revenue")')).toBeVisible();
  await expect(page.locator('p:has-text("Combined Sales")')).toBeVisible();

  // Give an extra moment for charts to animate
  await page.waitForTimeout(2000);

  // Take a screenshot of the final result
  await page.screenshot({ path: 'e2e/screenshots/dashboard-overview-final-verification.png', fullPage: true });
});
