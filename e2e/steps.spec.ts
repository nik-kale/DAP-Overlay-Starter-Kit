/**
 * E2E tests for overlay functionality
 */

import { test, expect } from '@playwright/test';

test.describe('DAP Overlay SDK', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display the demo page', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('DAP Overlay SDK - React Demo');
  });

  test('should show tooltip when AUTH_401 error is selected', async ({ page }) => {
    // Select AUTH_401 error
    await page.selectOption('#error-select', 'AUTH_401');

    // Wait for tooltip to appear
    await page.waitForSelector('.dap-overlay-react--tooltip', { timeout: 5000 });

    // Verify tooltip content
    const tooltip = page.locator('.dap-overlay-react--tooltip');
    await expect(tooltip).toBeVisible();
    await expect(tooltip).toContainText('Authentication Issue');
  });

  test('should show banner when NETWORK_TIMEOUT error is selected', async ({ page }) => {
    // Select NETWORK_TIMEOUT error
    await page.selectOption('#error-select', 'NETWORK_TIMEOUT');

    // Wait for banner to appear
    await page.waitForSelector('.dap-overlay-react--banner', { timeout: 5000 });

    // Verify banner content
    const banner = page.locator('.dap-overlay-react--banner');
    await expect(banner).toBeVisible();
    await expect(banner).toContainText('Network Issue');
  });

  test('should show modal when VALIDATION_ERROR is selected', async ({ page }) => {
    // Select VALIDATION_ERROR
    await page.selectOption('#error-select', 'VALIDATION_ERROR');

    // Wait for modal to appear
    await page.waitForSelector('.dap-overlay-react--modal', { timeout: 5000 });

    // Verify modal content
    const modal = page.locator('.dap-overlay-react--modal');
    await expect(modal).toBeVisible();
    await expect(modal).toContainText('Form Validation Error');

    // Verify backdrop is present
    const backdrop = page.locator('.dap-overlay-react-backdrop');
    await expect(backdrop).toBeVisible();
  });

  test('should dismiss tooltip when close button is clicked', async ({ page }) => {
    // Show tooltip
    await page.selectOption('#error-select', 'AUTH_401');
    await page.waitForSelector('.dap-overlay-react--tooltip');

    // Click close button
    const closeButton = page.locator('.dap-overlay-react--tooltip .dap-overlay-react__close');
    await closeButton.click();

    // Verify tooltip is removed
    await expect(page.locator('.dap-overlay-react--tooltip')).not.toBeVisible();
  });

  test('should show feature highlight tooltip on dashboard path', async ({ page }) => {
    // Path should be /dashboard by default
    await page.waitForTimeout(1000);

    // Feature highlight should be visible
    const tooltip = page.locator('.dap-overlay-react--tooltip:has-text("New Feature")');
    await expect(tooltip).toBeVisible();
  });

  test('should hide feature highlight when changing path', async ({ page }) => {
    // Wait for feature highlight on dashboard
    await page.waitForSelector('.dap-overlay-react--tooltip:has-text("New Feature")');

    // Change path to settings
    await page.selectOption('#path-select', '/settings');

    // Wait a bit for re-render
    await page.waitForTimeout(500);

    // Feature highlight should be hidden
    await expect(
      page.locator('.dap-overlay-react--tooltip:has-text("New Feature")')
    ).not.toBeVisible();
  });

  test('should handle CTA button click', async ({ page }) => {
    // Show tooltip with CTA
    await page.selectOption('#error-select', 'AUTH_401');
    await page.waitForSelector('.dap-overlay-react--tooltip');

    // Set up dialog handler
    page.on('dialog', async (dialog) => {
      expect(dialog.message()).toContain('Retrying login');
      await dialog.accept();
    });

    // Click CTA button
    const ctaButton = page.locator('.dap-overlay-react__cta');
    await ctaButton.click();

    // Tooltip should be dismissed (auto-dismiss on CTA click)
    await expect(page.locator('.dap-overlay-react--tooltip')).not.toBeVisible();
  });
});
