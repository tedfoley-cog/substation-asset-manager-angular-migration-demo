import { test, expect } from '@playwright/test';
import { signInAs, USERS, screenshot } from './helpers';

// S6 — disturbance records: filter pending by site, download COMTRADE header, record flips to collected.
test('S6 COMTRADE download marks the record as collected', async ({ page }) => {
  await signInAs(page, USERS.engineer);
  await page.getByTestId('nav-records').click();
  await page.getByTestId('rec-filter-substation').selectOption({ label: 'NTH-01' });
  await page.getByTestId('rec-filter-downloaded').selectOption('false');
  const rows = page.getByTestId('rec-row');
  await expect(rows.first()).toBeVisible();
  const pendingBefore = Number(await page.getByTestId('rec-pending').textContent());
  expect(pendingBefore).toBeGreaterThan(0);
  const target = rows.first();
  const recordId = (await target.getAttribute('data-record'))!;
  expect(recordId).toMatch(/^[A-Z]{3}0\d_/);
  await expect(target).toContainText('Comtrade');

  const download = page.waitForEvent('download');
  await target.getByTestId('rec-download').click();
  expect((await download).suggestedFilename()).toBe(recordId + '.cfg');
  await expect(page.getByTestId('toast')).toContainText('COMTRADE retrieved');
  await expect(target.getByTestId('rec-collected')).toHaveText('mbrandt');
  await screenshot(page, 's6-record-downloaded');

  await page.getByTestId('rec-filter-downloaded').selectOption('true');
  await expect(page.getByTestId('rec-row').filter({ hasText: recordId })).toHaveCount(1);
});
