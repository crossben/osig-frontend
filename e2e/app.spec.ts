import { expect, test, type Page } from '@playwright/test';

const unique = () => Math.random().toString(36).slice(2, 10);

async function register(page: Page) {
  const id = unique();
  const email = `e2e.${id}@gmail.com`;
  await page.goto('/#/register');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Username').fill(`e2e${id}`);
  await page.getByLabel('Password', { exact: true }).fill('Passw0rd!x');
  await page.getByLabel('Repeat password').fill('Passw0rd!x');
  await page.getByLabel(/legitimate purposes/).check();
  await page.getByRole('button', { name: 'Create account' }).click();
  await expect(page.getByRole('heading', { name: 'New scan' })).toBeVisible();
  return email;
}

test('landing page shows the trace hero and switches target types', async ({ page }) => {
  await page.goto('/#/');
  await expect(page.getByRole('heading', { name: /public internet already knows/ })).toBeVisible();
  await page.getByRole('tab', { name: 'Domain' }).click();
  await expect(page.getByRole('img', { name: /example\.com checked against/ })).toBeVisible();
});

test('sign up lands on the dashboard; wrong password shows an error', async ({ page }) => {
  const email = await register(page);
  await page.getByRole('button', { name: /E2E|e2e/ }).first().click();
  await page.getByRole('menuitem', { name: 'Log out' }).click();
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill('not-the-password');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByText('Incorrect email or password').first()).toBeVisible();
});

test('new scan validates the target before starting', async ({ page }) => {
  await register(page);
  await page.getByRole('radio', { name: 'Domain' }).click();
  await page.locator('#targetValue').fill('https://not a domain');
  await page.getByRole('button', { name: 'Start scan' }).click();
  await expect(page.getByText(/Enter a domain like example\.com/)).toBeVisible();
  await expect(page.getByText('Confirm your reason before starting the scan.')).toBeVisible();
  // The "this scan checks" panel follows the selected type and depth
  await expect(page.getByRole('heading', { name: 'This scan checks' })).toBeVisible();
  await expect(page.getByText('Shodan InternetDB')).toBeVisible();
});

test('account page validates the new password', async ({ page }) => {
  await register(page);
  await page.goto('/#/profile');
  await page.getByLabel('Current password').fill('Passw0rd!x');
  await page.getByLabel('New password', { exact: true }).fill('short');
  await page.getByLabel('Repeat new password').fill('short');
  await page.getByRole('button', { name: 'Change password' }).click();
  await expect(page.getByRole('alert').filter({ hasText: 'at least 8 characters' })).toBeVisible();
});

test('expired access token is refreshed silently', async ({ page }) => {
  await register(page);
  // Corrupt the stored access token; the refresh token must recover the session
  await page.evaluate(() => {
    const key = Object.keys(localStorage).find((k) => k.includes('auth'));
    if (!key) throw new Error('no auth storage');
    const state = JSON.parse(localStorage.getItem(key)!);
    state.state.tokens.accessToken = 'expired.invalid.token';
    localStorage.setItem(key, JSON.stringify(state));
  });
  await page.goto('/#/history');
  await expect(page.getByRole('heading', { name: 'Scan history' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Sign in' })).toHaveCount(0);
});
