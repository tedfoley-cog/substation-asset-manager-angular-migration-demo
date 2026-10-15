import { test, expect } from '@playwright/test';
import { signInAs, USERS, screenshot } from './helpers';

// S3 — form validation invalid → valid: upload a new settings version for NTH01_T1_87T as an engineer.
test('S3 settings upload rejects out-of-range values then stores v4', async ({ page }) => {
  await signInAs(page, USERS.engineer);
  await page.goto('/#!/ieds/1?tab=settings');
  await page.getByTestId('upload-settings').click();
  const form = page.getByTestId('upload-form');
  await expect(form).toContainText(/pre-filled from v\d+/);
  const versionsBefore = await page.getByTestId('settings-version').count();
  expect(await form.getByTestId('upload-row').count()).toBeGreaterThan(10);

  // 1. too-short comment → client-side validation
  await form.getByTestId('upload-comment').fill('short');
  await form.getByTestId('upload-submit').click();
  await expect(form.getByTestId('upload-errors')).toContainText('Complete the highlighted fields');

  // 2. out-of-range pickup → server-side 400 with detail
  await form.getByTestId('upload-comment').fill('Retuned after fault study FS-2026-03');
  const pickupRow = form.locator('[data-test="upload-row"][data-setting="87T Pickup"]').first();
  const pickup = pickupRow.getByTestId('upload-value');
  await pickup.fill('1.50');
  await expect(pickupRow).toHaveClass(/diff-row-violation/);
  await form.getByTestId('upload-submit').click();
  await expect(form.getByTestId('upload-errors')).toContainText('Validation failed');
  await expect(form.getByTestId('upload-errors')).toContainText('87T Pickup: 1.50 exceeds maximum 1.00');
  await screenshot(page, 's3-upload-rejected');

  // 3. valid value → 201, history grows, toast confirms
  await pickup.fill('0.35');
  await form.getByTestId('upload-submit').click();
  await expect(page.getByTestId('toast').filter({ hasText: 'stored as v' })).toContainText(new RegExp(`NTH01_T1_87T_v00${versionsBefore + 1}\\.rsf stored as v${versionsBefore + 1}`));
  const versions = page.getByTestId('settings-version');
  await expect(versions).toHaveCount(versionsBefore + 1);
  await expect(versions.nth(0)).toContainText(`v${versionsBefore + 1}`);
  await expect(versions.nth(0)).toContainText('Active');
  await expect(versions.nth(1)).toContainText('Superseded');
  await screenshot(page, 's3-upload-stored');
});
