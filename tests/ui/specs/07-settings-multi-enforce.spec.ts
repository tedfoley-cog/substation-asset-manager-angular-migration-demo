import { test, expect } from '@playwright/test';
import { signInAs, USERS, screenshot } from './helpers';

// S7 — several settings files enforced on one IED at once: enforce a superseded file, upload alongside, withdraw.
test('S7 NTH01_T2_87T carries several enforced settings files at once', async ({ page }) => {
  await signInAs(page, USERS.engineer);
  await page.getByTestId('nav-ieds').click();
  await page.getByTestId('ied-search').fill('NTH01_T2_87T');
  await expect(page.getByTestId('ied-row')).toHaveCount(1);
  await page.getByTestId('ied-row').first().getByTestId('ied-open').click();
  await expect(page.locator('h1')).toContainText('NTH01_T2_87T');
  await page.getByTestId('tab-settings').click();

  const row = (v: number) => page.locator(`[data-test="settings-version"][data-version="${v}"]`);
  await expect(row(2)).toContainText('Active');
  await expect(row(1)).toContainText('Superseded');
  await expect(page.getByTestId('enforced-summary')).toContainText('Enforced on NTH01_T2_87T: v2 (1 file)');

  // 1. enforce the superseded v1 alongside v2
  await row(1).getByTestId('settings-enforce').click();
  await expect(page.getByTestId('toast').filter({ hasText: 'NTH01_T2_87T_v001.rsf is now enforced' })).toBeVisible();
  await expect(row(1)).toContainText('Active');
  await expect(row(2)).toContainText('Active');
  await expect(page.getByTestId('enforced-summary')).toContainText('v2, v1 (2 files)');
  await screenshot(page, 's7-two-enforced');

  // 2. upload v3 keeping the enforced files
  await page.getByTestId('upload-settings').click();
  const form = page.getByTestId('upload-form');
  await expect(form).toContainText(/pre-filled from v2/);
  await form.getByTestId('upload-comment').fill('Group 2 overlay for outage OP-2026-11');
  await form.getByTestId('upload-supersede').selectOption({ label: 'Keep enforced alongside' });
  await form.getByTestId('upload-submit').click();
  await expect(page.getByTestId('toast').filter({ hasText: 'NTH01_T2_87T_v003.rsf stored as v3' })).toBeVisible();
  await expect(page.getByTestId('enforced-summary')).toContainText('v3, v2, v1 (3 files)');
  await expect(row(2)).toContainText('Active');

  // 3. withdraw v1; v3 and v2 stay enforced
  await row(1).getByTestId('settings-unenforce').click();
  await expect(page.getByTestId('toast').filter({ hasText: 'NTH01_T2_87T_v001.rsf is no longer enforced' })).toBeVisible();
  await expect(row(1)).toContainText('Superseded');
  await expect(page.getByTestId('enforced-summary')).toContainText('v3, v2 (2 files)');
  await page.getByTestId('tab-overview').click();
  await expect(page.getByTestId('overview-enforced')).toHaveText('v3, v2');
  await screenshot(page, 's7-enforced-overview');

  // 4. a viewer sees the enforced set but cannot change it
  await signInAs(page, USERS.viewer);
  await page.goto('/#!/ieds');
  await page.getByTestId('ied-search').fill('NTH01_T2_87T');
  await expect(page.getByTestId('ied-row')).toHaveCount(1);
  await page.getByTestId('ied-row').first().getByTestId('ied-open').click();
  await page.getByTestId('tab-settings').click();
  await expect(page.getByTestId('enforced-summary')).toContainText('v3, v2 (2 files)');
  await expect(row(3).getByTestId('settings-unenforce')).toBeDisabled();
  await expect(row(1).getByTestId('settings-enforce')).toBeDisabled();
});
