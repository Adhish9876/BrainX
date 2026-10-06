import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
test.use({ trace: 'off' });

const env = Object.fromEntries(readFileSync('.env.local', 'utf8').split(/\r?\n/).filter(l => l.includes('=')).map(l => {
  const i = l.indexOf('=');
  return [l.slice(0, i), l.slice(i + 1).replace(/^['"]|['"]$/g, '')];
}));

test('authenticated editing persists a multi-item draft and resets without committing', async ({ page }) => {
  page.on('dialog', dialog => dialog.accept());
  await page.goto('/admin');
  await page.getByLabel('Username', { exact: true }).fill(env.ADMIN_USERNAME);
  await page.getByLabel('Password', { exact: true }).fill(env.ADMIN_PASSWORD);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Sign out', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Research', exact: true })).toBeVisible();
  await page.screenshot({ path: '/tmp/opencode/brainx-admin-desktop.png', fullPage: true });
  await page.getByLabel('Tagline', { exact: true }).fill('Browser-side QA draft — not published');
  await page.getByRole('button', { name: 'Research', exact: true }).click();
  await page.getByRole('button', { name: 'New research area', exact: true }).click();
  await page.getByLabel('Title', { exact: true }).fill('QA research draft');
  await page.getByLabel('Description', { exact: true }).fill('Temporary editor test, never committed.');
  await page.getByLabel('Tags', { exact: true }).fill('Custom / 任意');
  await page.getByLabel('Tags', { exact: true }).press('Enter');
  await expect(page.getByRole('button', { name: 'Remove tag Custom / 任意' })).toBeVisible();
  await page.getByRole('button', { name: 'Add', exact: true }).click();
  await expect(page.getByRole('button', { name: /You’ve made 2 changes/ })).toBeVisible();
  await page.getByRole('button', { name: 'Move QA research draft up', exact: true }).click();
  await page.reload();
  await expect(page.getByText('Restored an unsaved draft from this browser tab.', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Research', exact: true }).click();
  await expect(page.getByText('QA research draft', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Edit QA research draft', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Remove tag Custom / 任意' })).toBeVisible();
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  await page.getByRole('button', { name: 'Delete QA research draft', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Delete', exact: true }).click();
  await expect(page.getByText('QA research draft', { exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Reset', exact: true }).click();
  await page.getByRole('button', { name: 'Reset changes', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Redeploy', exact: true })).toHaveCount(0);
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test('authentication and mutation boundaries reject unauthenticated and cross-origin requests', async ({ request, baseURL }) => {
  expect((await request.get('/api/admin/content')).status()).toBe(401);
  expect((await request.post('/api/admin/login', { headers: { Origin: 'https://attacker.example' }, data: { username: env.ADMIN_USERNAME, password: env.ADMIN_PASSWORD } })).status()).toBe(403);
  const loggedIn = await request.post('/api/admin/login', { headers: { Origin: baseURL! }, data: { username: env.ADMIN_USERNAME, password: env.ADMIN_PASSWORD } });
  expect(loggedIn.status()).toBe(200);
  expect(loggedIn.headers()['set-cookie']).toContain('HttpOnly');
  expect(loggedIn.headers()['set-cookie']).toContain('Secure');
  // APIRequestContext intentionally withholds Secure cookies on loopback HTTP;
  // browser login is tested separately. Carry the test cookie explicitly here.
  const Cookie = loggedIn.headers()['set-cookie'].split(';')[0];
  const remote = await request.get('/api/admin/content', { headers: { Cookie } });
  expect(remote.status()).toBe(200);
  expect(remote.headers()['cache-control']).toContain('no-store');
  const body = await remote.json();
  expect(body.content.publications).toHaveLength(17);
  expect((await request.post('/api/admin/commit', { headers: { Origin: baseURL!, Cookie }, data: { content: body.content, baseSha: '0000000000000000000000000000000000000000' } })).status()).toBe(409);
  expect((await request.post('/api/admin/upload', { headers: { Origin: baseURL!, Cookie }, multipart: { file: { name: 'not-an-image.png', mimeType: 'image/png', buffer: Buffer.from('not an image') } } })).status()).toBe(415);
});
