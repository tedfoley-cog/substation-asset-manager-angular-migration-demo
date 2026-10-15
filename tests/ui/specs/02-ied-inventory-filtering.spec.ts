import { test, expect } from '@playwright/test';
import { signInAs, USERS, screenshot } from './helpers';

// S2 — search / filter / sort on the IED inventory plus the drawer drill-down.
test('S2 inventory filters, sort and drawer show the right relays', async ({ page }) => {
  await signInAs(page, USERS.viewer);
  await page.getByTestId('nav-ieds').click();
  await expect(page.getByTestId('ied-count')).toHaveText('20');

  await page.getByTestId('filter-type').selectOption('LINE_DISTANCE');
  await expect(page.getByTestId('ied-row')).toHaveCount(4);
  await expect(page.getByTestId('ied-row').first()).toContainText('CEN01_L2_21');

  await page.getByTestId('ied-search').fill('nth');
  await expect(page.getByTestId('ied-row')).toHaveCount(3);
  const names = await page.getByTestId('ied-row').locator('strong').allTextContents();
  expect(names).toEqual(['NTH01_L1_21', 'NTH02_L1_21', 'NTH02_L2_21']);

  await page.getByTestId('filter-reset').click();
  await expect(page.getByTestId('ied-count')).toHaveText('20');
  await page.getByTestId('filter-status').selectOption('MAINTENANCE');
  await expect(page.getByTestId('ied-row')).toHaveCount(1);
  await expect(page.getByTestId('ied-row')).toContainText('CEN01_SGT3_87T');

  await page.getByTestId('filter-reset').click();
  await page.getByTestId('sort-firmware').click();
  const firstFw = await page.getByTestId('ied-row').first().getByTestId('firmware-badge').textContent();
  await page.getByTestId('sort-firmware').click();
  const lastFw = await page.getByTestId('ied-row').first().getByTestId('firmware-badge').textContent();
  expect(firstFw).not.toEqual(lastFw);
  await expect(page.getByTestId('eol-count')).toHaveText('2');

  await page.getByTestId('ied-row').filter({ hasText: 'CEN01_SGT2_87T' }).click();
  const drawer = page.getByTestId('ied-drawer');
  await expect(drawer).toBeVisible();
  await expect(drawer).toContainText('CEN01_SGT2_87T');
  await expect(drawer).toContainText('10.43.1.11');
  await screenshot(page, 's2-ied-drawer');
  await drawer.getByTestId('drawer-open-settings').click();
  await expect(page).toHaveURL(/#!\/ieds\/\d+\?tab=settings/);
  await expect(page.getByTestId('settings-panel')).toBeVisible();
});
