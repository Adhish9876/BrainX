import { test, expect } from '@playwright/test';

test.skip(process.env.RUN_FIXTURE_TESTS !== '1', 'Requires an isolated build with local fixtures; never publish fake announcements.');

test('latest ten news, complete archive, featured event and historical accordion', async ({ page }) => {
  await page.goto('/');
  const rail = page.getByRole('complementary', { name: 'Latest from the lab' });
  await expect(rail.getByText('Local test announcement 11', { exact: true })).toBeVisible();
  await expect(rail.getByText('Local test announcement 01', { exact: true })).toHaveCount(0);
  await page.getByRole('link', { name: 'Show all news', exact: true }).click();
  for (let i = 1; i <= 11; i++) await expect(page.getByText(`Local test announcement ${String(i).padStart(2, '0')}`, { exact: true })).toBeVisible();
  await page.getByRole('tab', { name: /^Events/ }).click();
  await expect(page.getByText('Local featured event', { exact: true })).toBeVisible();
  await expect(page.getByText('10:00–12:00 IST (text)', { exact: true })).toBeVisible();
  await expect(page.getByText('Fixture auditorium', { exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: /More info/ }).first()).toHaveAttribute('href', 'https://example.com/fixture-latest');
  await page.getByRole('button', { name: /Local historical event/ }).click();
  await expect(page.getByText('Historical fixture description.', { exact: true })).toBeVisible();
  await expect(page.getByText('Historical fixture venue', { exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: /More info/ }).last()).toHaveAttribute('href', 'https://example.com/fixture-archive');
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('project fields and single-image gallery behavior', async ({ page }) => {
  await page.goto('/projects');
  await expect(page.getByRole('heading', { name: 'Local fixture project', exact: true })).toBeVisible();
  await expect(page.getByText('Custom, arbitrary / 任意', { exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: /View project|Project link|Explore project|More info/ })).toHaveAttribute('href', 'https://example.com/fixture-project');
  const image = page.locator('main img').first();
  await expect.poll(() => image.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
  await page.goto('/pictures');
  await page.getByRole('button', { name: 'View gallery Single-image local fixture', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Next image', exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Previous image', exact: true })).toHaveCount(0);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
});
