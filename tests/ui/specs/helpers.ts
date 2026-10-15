import { Page, expect } from '@playwright/test';

export const USERS = { admin: 'rvasquez', engineer: 'mbrandt', engineer2: 'aokafor', viewer: 'lchen', auditor: 'sdubois' };

export async function signInAs(page: Page, username: string) {
  await page.goto('/#!/substations');
  await page.evaluate((u) => localStorage.setItem('sam.username', u), username);
  await page.reload();
  await expect(page.getByTestId('user-switcher')).toHaveValue(username);
  await expect(page.getByTestId('api-status')).toHaveText('online');
}

export async function screenshot(page: Page, name: string) {
  await page.screenshot({ path: `screenshots/${name}.png`, fullPage: true });
}
