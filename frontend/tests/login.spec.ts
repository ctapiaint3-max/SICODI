import { test, expect } from '@playwright/test';

test('has title and login form', async ({ page }) => {
  // Test E2E de inicio de sesión (Frontend Next.js)
  await page.goto('http://localhost:3000/login');

  // Verify elements are visible
  await expect(page).toHaveTitle(/SICODI/);
  await expect(page.locator('input[type="email"]')).toBeVisible();
  await expect(page.locator('input[type="password"]')).toBeVisible();
  
  // Submit mockup E2E
  await page.fill('input[type="email"]', 'admin@institucion.gov');
  await page.fill('input[type="password"]', 'admin123');
  await page.click('button[type="submit"]');

  // Evalua la redirección a /
  await expect(page).toHaveURL('http://localhost:3000/');
});
