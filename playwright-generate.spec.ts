import { test, expect } from '@playwright/test';

test.setTimeout(180000);

test('Production Dashboard E2E', async ({ page }) => {
    console.log("Navigating to Login...");
    await page.goto('http://localhost:3000/admin/login');

    console.log("Filling form...");
    await page.fill('input[type="email"]', 'anthoniaojomo22@gmail.com');
    await page.fill('input[type="password"]', 'PamAdmin2026!');

    const loginButton = page.locator('button', { hasText: 'Sign In' });
    await loginButton.click();

    console.log("Waiting for auth redirect...");
    await page.waitForURL('**/admin*', { timeout: 60000 });

    console.log("Navigating to production schedule...");
    await page.goto('http://localhost:3000/admin?panel=production');
    await page.waitForSelector('text=Production Calendar', { state: 'visible', timeout: 60000 });

    console.log("Opening Generate modal...");
    const generateButton = page.locator('button', { hasText: 'Generate 5' });
    await generateButton.waitFor({ state: 'visible' });
    await generateButton.click();

    console.log("Starting Generation...");
    const startButton = page.locator('button', { hasText: 'Start Generation' });
    await startButton.waitFor({ state: 'visible' });
    await startButton.click();

    console.log("Waiting up to 2 minutes for LLM generation to complete...");
    await expect(page.locator('text=Generated').first()).toBeVisible({ timeout: 120000 });

    console.log("SUCCESS! E2E Generation Pipeline is operational locally!");
});
