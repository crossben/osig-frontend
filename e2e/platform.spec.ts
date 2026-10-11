import { expect, test, type APIRequestContext, type Page } from '@playwright/test';
import { mailedLink, markVerified, totp } from './backend';

const API = process.env.E2E_API_URL ?? 'http://localhost:8000/api/v1';
const PASSWORD = 'Passw0rd!x';
const unique = () => Math.random().toString(36).slice(2, 10);

async function apiUser(request: APIRequestContext, verified = true) {
  const id = unique();
  const email = `e2e.p${id}@gmail.com`;
  const res = await request.post(`${API}/auth/register`, { data: { email, username: `e2ep${id}`, password: PASSWORD } });
  expect(res.ok()).toBeTruthy();
  const body = await res.json();
  if (verified) markVerified(email);
  return { email, token: body.access_token as string, id: body.user.id as string };
}

async function signIn(page: Page, email: string, password = PASSWORD) {
  await page.goto('/#/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Sign in' }).click();
}

test('unverified users see the banner until they open the emailed link', async ({ page, request }) => {
  const { email } = await apiUser(request, false);
  await signIn(page, email);
  await expect(page.getByText('Confirm your email to run scans.')).toBeVisible();
  await page.goto(`/#${mailedLink(email, 'verify_email')}`);
  await expect(page.getByText(/confirmed/i).first()).toBeVisible();
  await page.goto('/#/history');
  await expect(page.getByText('Confirm your email to run scans.')).toHaveCount(0);
});

test('forgot password sends a single-use reset link', async ({ page, request }) => {
  const { email } = await apiUser(request);
  await page.goto('/#/forgot-password');
  await page.getByLabel('Email').fill(email);
  await page.getByRole('button', { name: 'Send the link' }).click();
  const link = mailedLink(email, 'reset_password');
  await page.goto(`/#${link}`);
  await page.getByLabel('New password', { exact: true }).fill('BrandNew123!');
  await page.getByLabel('Repeat new password').fill('BrandNew123!');
  await page.getByRole('button', { name: 'Reset password' }).click();
  await expect(page).toHaveURL(/#\/login/);
  await signIn(page, email, 'BrandNew123!');
  await expect(page.getByRole('heading', { name: 'New scan' })).toBeVisible();
});

test('two-factor sign-in asks for a code after the password', async ({ page, request }) => {
  const { email, token } = await apiUser(request);
  const headers = { Authorization: `Bearer ${token}` };
  const setup = await (await request.post(`${API}/auth/2fa/setup`, { headers })).json();
  expect((await request.post(`${API}/auth/2fa/enable`, { headers, data: { code: totp(setup.secret) } })).ok()).toBeTruthy();

  await signIn(page, email);
  await page.getByLabel('Code', { exact: true }).fill('000000');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByText(/isn.t right/).first()).toBeVisible();
  await page.getByLabel('Code', { exact: true }).fill(totp(setup.secret));
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByRole('heading', { name: 'New scan' })).toBeVisible();
});

test('bulk scan from CSV starts scans inside a new investigation', async ({ page, request }) => {
  const { email } = await apiUser(request);
  await signIn(page, email);
  await page.goto('/#/bulk');
  await page.getByLabel('Investigation name').fill('E2E batch');
  await page.locator('#bulk-csv').fill('domain,example.com\nip,10.0.0.1');
  await page.locator('#bulk-confirm').check();
  await page.getByRole('button', { name: /Start \d+ scans?/ }).click();
  await expect(page.getByText(/Started 1 scan/)).toBeVisible();
  await page.getByRole('link', { name: 'Open the investigation' }).or(page.getByRole('button', { name: 'Open the investigation' })).click();
  await expect(page.getByText('example.com').first()).toBeVisible();
});

test('a shared investigation is read-only for viewers', async ({ page, request }) => {
  const owner = await apiUser(request);
  const viewer = await apiUser(request);
  const headers = { Authorization: `Bearer ${owner.token}` };
  const inv = await (await request.post(`${API}/investigations`, { headers, data: { name: 'Shared case' } })).json();
  expect((await request.post(`${API}/investigations/${inv.id}/members`, { headers, data: { email: viewer.email, role: 'viewer' } })).ok()).toBeTruthy();

  await signIn(page, viewer.email);
  await page.goto(`/#/investigation?id=${inv.id}`);
  await expect(page.getByText(/Shared with you by/)).toBeVisible();
  await expect(page.getByLabel('Investigation name')).toHaveValue('Shared case');
  await expect(page.getByRole('button', { name: 'Leave' })).toBeVisible();
  await expect(page.getByRole('button', { name: /^Share/ })).toHaveCount(0);
  await expect(page.getByRole('button', { name: /^Delete/ })).toHaveCount(0);
});

test('admin console is closed to regular users', async ({ page, request }) => {
  const { email } = await apiUser(request);
  await signIn(page, email);
  await expect(page.getByRole('link', { name: 'Admin' })).toHaveCount(0);
  await page.goto('/#/admin');
  await expect(page.getByText('Admins only').first()).toBeVisible();
});
