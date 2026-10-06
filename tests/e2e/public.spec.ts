import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('all public sections render and remain responsive', async ({ page }) => {
  for (const route of ['/', '/research', '/publications', '/team', '/projects', '/events', '/pictures']) {
    const response = await page.goto(route);
    expect(response?.status(), route).toBe(200);
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('body')).toContainText('BrainX');
    expect(await page.locator('a[href="/admin"]').count()).toBe(0);
    await page.setViewportSize({ width: 390, height: 844 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.setViewportSize({ width: 1440, height: 1000 });
  }
});

test('publication timeline and supplied members are visible', async ({ page }) => {
  await page.goto('/publications');
  await expect(page.getByText('Neurological insights into personality and emotional intelligence', { exact: false })).toBeVisible();
  await expect(page.getByText('2018', { exact: true }).first()).toBeVisible();
  await page.goto('/team');
  await expect(page.getByText('Yogeshwari R', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('Nidhish Kumar M', { exact: true })).toBeVisible();
});

test('public pages and admin login satisfy core WCAG checks', async ({ page }) => {
  for (const route of ['/', '/research', '/publications', '/team', '/projects', '/events', '/pictures', '/admin']) {
    await page.goto(route);
    await page.waitForLoadState('networkidle');
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    expect(results.violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => n.target) }))).toEqual([]);
  }
});

test('Show all selects the news tab and tabs keep the URL in sync', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Show all news', exact: true }).click();
  await expect(page).toHaveURL(/\/events\?tab=news$/);
  await expect(page.getByRole('tab', { name: /^News/ })).toHaveAttribute('aria-selected', 'true');
  await page.getByRole('tab', { name: /^Events/ }).click();
  await expect(page).toHaveURL(/tab=events/);
  await expect(page.getByText('No events scheduled', { exact: true })).toBeVisible();
});

test('gallery uses thumbnail cards and preserves image ratio with keyboard navigation', async ({ page }) => {
  await page.goto('/pictures');
  const card = page.getByRole('button', { name: /^View gallery / }).first();
  const thumbnail = await card.locator('img').getAttribute('src');
  await card.click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  const image = dialog.locator('img');
  await expect(image).toHaveAttribute('src', thumbnail!);
  await expect.poll(() => image.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
  const ratios = await image.evaluate((img: HTMLImageElement) => ({ actual: img.getBoundingClientRect().width / img.getBoundingClientRect().height, natural: img.naturalWidth / img.naturalHeight }));
  expect(Math.abs(ratios.actual - ratios.natural)).toBeLessThan(0.01);
  await page.keyboard.press('ArrowRight');
  await expect(image).not.toHaveAttribute('src', thumbnail!);
  await page.keyboard.press('ArrowLeft');
  await expect(image).toHaveAttribute('src', thumbnail!);
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(card).toBeFocused();
});
