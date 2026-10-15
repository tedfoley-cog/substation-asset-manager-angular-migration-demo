import { test, expect } from '@playwright/test';
import { signInAs, USERS, screenshot } from './helpers';

// S1 — multi-view navigation: substations → bays → IED detail → settings tab, asserting real seeded content.
test('S1 drill-down from estate to a relay settings history', async ({ page }) => {
  await signInAs(page, USERS.engineer);
  await expect(page.getByTestId('stat-sites')).toHaveText('5');
  await expect(page.getByTestId('stat-ieds')).toHaveText('20');
  const cards = page.getByTestId('substation-card');
  await expect(cards).toHaveCount(5);
  await expect(cards.filter({ hasText: 'NTH-01' })).toContainText('Northgate 132/33 kV');

  await page.getByTestId('region-filter').selectOption('North');
  await expect(page.getByTestId('substation-card')).toHaveCount(2);
  await screenshot(page, 's1-substations-north');

  await cards.filter({ hasText: 'NTH-01' }).click();
  await expect(page).toHaveURL(/#!\/substations\/1$/);
  await expect(page.locator('h1')).toContainText('Northgate 132/33 kV');
  const t1 = page.getByTestId('bay-card').filter({ hasText: 'T1' }).first();
  await expect(t1).toContainText('NTH01_T1_87T');
  await expect(t1).toContainText('Transformer');

  await t1.getByRole('link', { name: 'NTH01_T1_87T' }).click();
  await expect(page).toHaveURL(/#!\/ieds\/1/);
  await expect(page.locator('h1')).toContainText('NTH01_T1_87T');
  await expect(page.getByTestId('ied-status')).toHaveText('In Service');
  await expect(page.getByTestId('overview-panel')).toContainText('RP-700 Transformer Differential');

  await page.getByTestId('tab-settings').click();
  const versions = page.getByTestId('settings-version');
  expect(await versions.count()).toBeGreaterThanOrEqual(3);
  await expect(versions.first()).toContainText(/v\d+/);
  await expect(versions.first()).toContainText('Active');
  await expect(versions.first()).toContainText(/NTH01_T1_87T_v\d{3}\.rsf/);
  await expect(versions.last()).toContainText('NTH01_T1_87T_v001.rsf');
  await screenshot(page, 's1-ied-settings-history');
});
