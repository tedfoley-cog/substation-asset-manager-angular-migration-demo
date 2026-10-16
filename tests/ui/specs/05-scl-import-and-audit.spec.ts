import { test, expect } from '@playwright/test';
import path from 'path';
import { signInAs, USERS, screenshot } from './helpers';

const FIXTURES = path.resolve(__dirname, '../../../backend/src/test/resources/scl');

// S5 — chained golden path: engineer imports an SCD, follows a matched IED, admin assigns unapproved firmware, viewer is denied,
// auditor sees every step. Exercises modal, permissions and the append-only trail.
test('S5 golden path: SCL import → firmware modal → denied download → audit trail', async ({ page }) => {
  await signInAs(page, USERS.engineer2);
  await page.getByTestId('nav-scl').click();
  await expect(page.getByTestId('scl-import-row').first()).toBeVisible();
  const before = await page.getByTestId('scl-import-row').count();
  expect(before).toBeGreaterThanOrEqual(7);
  await expect(page.getByTestId('scl-import-row').filter({ hasText: 'NTH-02_SGT1_refurb.scd' })).toHaveAttribute('data-status', 'FAILED');

  await page.getByTestId('scl-file-input').setInputFiles(path.join(FIXTURES, 'broken_subnetwork.scd'));
  await expect(page.getByTestId('scl-detail-status')).toHaveText('Failed');
  await expect(page.getByTestId('scl-detail-message')).toContainText('SubNetwork is missing required attribute name');

  await page.getByTestId('scl-file-input').setInputFiles(path.join(FIXTURES, 'NTH-01_station.scd'));
  await expect(page.getByTestId('scl-detail-status')).toHaveText('Completed');
  await expect(page.getByTestId('scl-detail-message')).toContainText('3 of 4 IEDs matched');
  await expect(page.getByTestId('scl-import-row')).toHaveCount(before + 2);
  const rows = page.getByTestId('scl-ied-row');
  await expect(rows.filter({ hasText: 'NTH01_HMI' })).toHaveAttribute('data-matched', 'false');
  await expect(rows.filter({ hasText: 'NTH01_T1_87T' })).toContainText('10.41.1.11');
  await screenshot(page, 's5-scl-import');
  await rows.filter({ hasText: 'NTH01_T1_87T' }).click();
  await expect(page).toHaveURL(/#!\/ieds\/1/);

  // engineer cannot assign firmware; admin can, with the unapproved warning in the modal
  await expect(page.getByTestId('assign-firmware')).toBeDisabled();
  await page.getByTestId('user-switcher').selectOption(USERS.admin);
  await expect(page.getByTestId('current-role')).toHaveText('Protection Admin');
  await page.getByTestId('assign-firmware').click();
  const modal = page.getByTestId('modal');
  await expect(modal).toContainText('Assign firmware — NTH01_T1_87T');
  await modal.getByTestId('firmware-select').selectOption({ label: '2.50.03 — NOT approved' });
  await expect(modal.getByTestId('firmware-unapproved-warning')).toContainText('2.50.03 is not approved for service');
  await screenshot(page, 's5-firmware-modal');
  await modal.getByTestId('firmware-confirm').click();
  await expect(page.getByTestId('toast').filter({ hasText: 'now on 2.50.03' })).toBeVisible();
  await expect(page.getByTestId('overview-panel').getByTestId('firmware-badge')).toContainText('unapproved');

  // viewer is denied a COMTRADE download (server-side), and the denial is audited
  await page.getByTestId('user-switcher').selectOption(USERS.viewer);
  await page.getByTestId('nav-records').click();
  await expect(page.getByTestId('rec-row').first()).toBeVisible();
  await expect(page.getByTestId('rec-download').first()).toBeDisabled();
  const denied = await page.evaluate(() => fetch('/api/records/3/download', { method: 'POST', headers: { 'X-SAM-User': 'lchen' } }).then(r => r.status));
  expect(denied).toBe(403);

  await page.getByTestId('user-switcher').selectOption(USERS.auditor);
  await page.getByTestId('nav-audit').click();
  await expect(page.getByTestId('audit-row').first()).toBeVisible();
  await page.getByTestId('audit-filter-action').selectOption('RECORD_DOWNLOAD');
  await expect(page.getByTestId('audit-row').filter({ hasText: 'lchen' }).first()).toHaveAttribute('data-outcome', 'DENIED');
  await page.getByTestId('audit-filter-action').selectOption('FIRMWARE_ASSIGN');
  await expect(page.getByTestId('audit-row').first()).toContainText('rvasquez');
  await expect(page.getByTestId('audit-row').first()).toContainText('2.50.03 (unapproved)');
  await page.getByTestId('audit-filter-action').selectOption('SCL_IMPORT');
  await expect(page.getByTestId('audit-row').first()).toContainText('NTH-01_station.scd');
  await screenshot(page, 's5-audit-trail');
});
