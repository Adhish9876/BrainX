import { test, expect } from '@playwright/test';
import { readFileSync, writeFileSync } from 'node:fs';
import sharp from 'sharp';

test.use({ trace: 'off' });
test.skip(process.env.RUN_CMS_PUBLISH !== '1', 'Explicit opt-in: creates a real repository commit and triggers deployment.');

test('multiple staged photos and a placeholder logo publish in one atomic CMS commit', async ({ page }) => {
  test.setTimeout(120_000);
  const env = Object.fromEntries(readFileSync('.env.local', 'utf8').split(/\r?\n/).filter(l => l.includes('=')).map(l => { const i = l.indexOf('='); return [l.slice(0, i), l.slice(i + 1).replace(/^['"]|['"]$/g, '')]; }));
  const groupName = 'Admin upload demonstration — placeholder';
  await page.goto('/admin');
  await page.getByLabel('Username', { exact: true }).fill(env.ADMIN_USERNAME);
  await page.getByLabel('Password', { exact: true }).fill(env.ADMIN_PASSWORD);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Sign out', exact: true })).toBeVisible();
  const initial = await (await page.request.get('/api/admin/content')).json();
  expect(initial.content.pictures.some((g: { name: string }) => g.name === groupName)).toBe(false);
  const logo = await sharp(readFileSync('public/logo.svg')).png().toBuffer();
  await page.locator('input[type=file]').setInputFiles({ name: 'placeholder-logo.png', mimeType: 'image/png', buffer: logo });
  await expect(page.getByLabel('Logo', { exact: true })).toHaveValue(/\/api\/admin\/uploads\/[a-f0-9]{32}/);
  await page.getByRole('button', { name: 'Pictures', exact: true }).click();
  await page.getByRole('button', { name: 'New picture group', exact: true }).click();
  await page.getByLabel('Name', { exact: true }).fill(groupName);
  await page.getByLabel('Description', { exact: true }).fill('Generated placeholder photos uploaded through the admin dashboard to verify staging, thumbnail selection, reordering and rebuild-on-commit. Replace or remove this demonstration group when real lab photos are available.');
  const dialog = page.getByRole('dialog');
  await dialog.locator('input[type=file]').setInputFiles([
    { name: 'placeholder-01.png', mimeType: 'image/png', buffer: readFileSync('data/pictures/demo-gallery/demo-01.png') },
    { name: 'placeholder-02.png', mimeType: 'image/png', buffer: readFileSync('data/pictures/demo-gallery/demo-02.png') },
    { name: 'remove-before-commit.png', mimeType: 'image/png', buffer: readFileSync('data/pictures/demo-gallery/demo-01.png') },
  ]);
  await expect(dialog.locator('img')).toHaveCount(3);
  await expect(dialog.getByRole('button', { name: 'Add', exact: true })).toBeEnabled();
  await dialog.getByRole('button', { name: 'Use as thumbnail', exact: true }).nth(1).click();
  await dialog.getByRole('button', { name: 'Move image earlier', exact: true }).nth(1).click();
  await dialog.getByRole('button', { name: 'Remove image', exact: true }).nth(2).click();
  await expect(dialog.locator('img')).toHaveCount(2);
  await dialog.getByRole('button', { name: 'Add', exact: true }).click();
  await expect(page.getByRole('button', { name: /You’ve made 2 changes/ })).toBeVisible();
  let commitRequests = 0;
  page.on('request', req => { if (req.method() === 'POST' && new URL(req.url()).pathname === '/api/admin/commit') commitRequests++; });
  const resultPromise = page.waitForResponse(res => new URL(res.url()).pathname === '/api/admin/commit' && res.request().method() === 'POST');
  await page.getByRole('button', { name: 'Publish changes', exact: true }).click();
  const response = await resultPromise;
  expect(response.status()).toBe(200);
  const result = await response.json();
  await expect(page.getByText(/Your changes are saved/)).toBeVisible();
  expect(commitRequests).toBe(1);
  expect(result.sha).not.toBe(initial.sha);
  expect(result.content.site.logo).toMatch(/^\/media\/uploads\/[a-f0-9]{32}\.webp$/);
  const group = result.content.pictures.find((g: { name: string }) => g.name === groupName);
  expect(group.images).toHaveLength(2);
  expect(group.thumbnail).toBe(group.images[0]);
  expect(group.images.every((p: string) => p.startsWith(`/media/pictures/${group.id}/`))).toBe(true);
  expect(result.content.publications).toHaveLength(17);
  writeFileSync('/tmp/opencode/brainx-cms-result.json', JSON.stringify({ sha: result.sha, baseSha: initial.sha, group, logo: result.content.site.logo, url: result.url }, null, 2));
});
