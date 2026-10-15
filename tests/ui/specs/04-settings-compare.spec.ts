import { test, expect } from '@playwright/test';
import { signInAs, USERS, screenshot } from './helpers';

// S4 — the bounded feature the migration targets: compare two versions, violations first, locale formatting, CSV.
test('S4 settings comparison flags the out-of-range slope on CEN01_SGT2_87T', async ({ page }) => {
  await signInAs(page, USERS.engineer); // de-DE locale
  await page.getByTestId('nav-ieds').click();
  await page.getByTestId('ied-search').fill('CEN01_SGT2');
  await expect(page.getByTestId('ied-row')).toHaveCount(1);
  await page.getByTestId('ied-row').first().getByTestId('ied-open').click();
  await page.getByTestId('tab-settings').click();
  await page.getByTestId('compare-go').click();

  await expect(page).toHaveURL(/settings\/compare\?left=\d+&right=\d+/);
  await expect(page.locator('h1')).toContainText('Settings comparison — CEN01_SGT2_87T');
  await expect(page.getByTestId('sum-violations')).toHaveText('1');
  await expect(page.getByTestId('violation-banner')).toContainText('fall outside the permitted range');
  const first = page.getByTestId('compare-row').first();
  await expect(first).toHaveAttribute('data-setting', '87T Slope 2');
  await expect(first).toHaveAttribute('data-kind', 'violation');
  await expect(first).toContainText('exceeds maximum 90');
  await expect(first.locator('.diff-cell-right')).toHaveText('95');
  await screenshot(page, 's4-compare-violation');

  const changed = Number(await page.getByTestId('sum-changed').textContent());
  const added = Number(await page.getByTestId('sum-added').textContent());
  const removed = Number(await page.getByTestId('sum-removed').textContent());
  await expect(page.getByTestId('compare-row')).toHaveCount(changed + added + removed);

  await page.getByTestId('show-unchanged').check();
  const all = await page.getByTestId('compare-row').count();
  expect(all).toBeGreaterThan(changed + added + removed);

  // de-DE number formatting on a decimal value
  const decimal = page.getByTestId('compare-row').filter({ hasText: '87T Pickup' }).first().locator('.diff-cell-right');
  await expect(decimal).toHaveText(/\d,\d+/);

  await page.getByTestId('compare-swap').click();
  await expect(page.getByTestId('sum-violations')).toHaveText('0');

  const download = page.waitForEvent('download');
  await page.getByTestId('export-csv').click();
  expect((await download).suggestedFilename()).toBe('CEN01_SGT2_87T_compare.csv');
});
