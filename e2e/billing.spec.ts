import { expect, test } from '@playwright/test';
import { markVerified } from './backend';

// Needs the local Yoon demo gateway (backend/docker-compose.yoon.yml); skipped otherwise.
const API = process.env.E2E_API_URL ?? 'http://localhost:8000/api/v1';
const YOON = process.env.E2E_YOON_URL ?? 'http://localhost:8080';

test('buying Pro through the Yoon demo checkout activates it', async ({ page, request }) => {
  const up = await request.get(`${YOON}/actuator/health`).then((r) => r.ok()).catch(() => false);
  test.skip(!up, 'Yoon demo gateway is not running');
  test.setTimeout(90_000);

  const id = Math.random().toString(36).slice(2, 10);
  const email = `e2e.bill${id}@gmail.com`;
  expect((await request.post(`${API}/auth/register`, { data: { email, username: `e2eb${id}`, password: 'Passw0rd!x' } })).ok()).toBeTruthy();
  markVerified(email);

  await page.goto('/#/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill('Passw0rd!x');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.goto('/#/billing');

  await page.getByRole('button', { name: /^Pay / }).click();
  await page.waitForURL(/localhost:8080\/checkout/);
  await page.getByText('Wave', { exact: true }).click();
  await page.locator('#pay').click();
  await page.waitForURL(/\/demo\/checkout\//);
  await page.getByRole('button', { name: 'Pay' }).click();
  await page.getByRole('link', { name: /Return to the shop/ }).click();

  await expect(page.getByText('Payment received. Pro is active.')).toBeVisible({ timeout: 60_000 });
});
