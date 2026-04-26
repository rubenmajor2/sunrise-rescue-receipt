// tests/receipt.spec.js
// End-to-end smoke tests for the Sunrise Rescue receipt form.
// Run with:   npx playwright test
// Run UI:     npx playwright test --ui

const { test, expect } = require('@playwright/test');

test.describe('Sunrise Rescue receipt form', () => {

  test('loads the form and shows the brand header', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Sunrise Rescue/);
    await expect(page.getByRole('heading', { name: 'Donation / Adoption Fee Receipt' })).toBeVisible();
    await expect(page.locator('.logo')).toContainText('Sunrise Rescue');
  });

  test('blocks submit when required fields are empty', async ({ page }) => {
    await page.goto('/');
    // Clear the auto-filled date so all required fields are missing
    await page.fill('#date_received', '');
    await page.click('#submitBtn');
    await expect(page.locator('#status.err')).toBeVisible();
  });

  test('preview returns a PDF', async ({ page }) => {
    await page.goto('/');
    await page.fill('#donor_name',  'Playwright Donor');
    await page.fill('#donor_email', 'donor@example.com');
    await page.fill('#amount',      '50');
    await page.selectOption('#receipt_type', 'Donation');
    await page.selectOption('#payment_method', 'PayPal');

    // Intercept the preview response and confirm content-type is application/pdf
    const [response] = await Promise.all([
      page.waitForResponse(r => r.url().includes('/api/receipt/preview')),
      page.click('#previewBtn'),
    ]);
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('application/pdf');
    const body = await response.body();
    // Every PDF starts with "%PDF-"
    expect(body.subarray(0, 5).toString()).toBe('%PDF-');
  });

  test('full submit generates a receipt number and admin record', async ({ page }) => {
    await page.goto('/');
    await page.fill('#donor_name',  'Playwright Donor');
    await page.fill('#donor_email', 'donor@example.com');
    await page.fill('#donor_address', '123 Main St, San Diego, CA');
    await page.fill('#amount',      '100');
    await page.selectOption('#receipt_type', 'Adoption Fee');
    await page.fill('#animal_name', 'Bernice');
    await page.selectOption('#payment_method', 'Credit / Debit Card');
    await page.fill('#reference',  'TXN-TEST-12345');
    await page.fill('#notes',      'Adopted from Saturday adoption event.');

    const [response] = await Promise.all([
      page.waitForResponse(r => r.url().includes('/api/receipt/send')),
      page.click('#submitBtn'),
    ]);
    expect(response.status()).toBe(200);
    const json = await response.json();
    expect(json.ok).toBe(true);
    expect(json.receipt_number).toMatch(/^SR-\d{8}-[A-F0-9]{4}$/);
    expect(json.pdf_url).toContain('/receipts/SR-');

    await expect(page.locator('#status.ok')).toBeVisible();
    await expect(page.locator('#status')).toContainText('Receipt #' + json.receipt_number);
  });

});
