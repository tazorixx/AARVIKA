import { test, expect } from '@playwright/test';

for (const width of [320, 390]) {
  test(`static category rail stays open while navigating at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto('/department/clothing');
    const rail = () => page.getByTestId('department-side-rail').last();
    await expect(rail()).toBeVisible();
    await expect(rail().getByRole('button')).toHaveCount(9);
    await expect(rail().getByTestId('side-rail-clothing')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByTestId('department-rail-toggle')).toHaveCount(0);
    await expect(page.getByTestId('department-rail-close')).toHaveCount(0);
    await expect(page.getByTestId('department-rail-up-cue')).toHaveCount(0);
    await expect(page.getByTestId('department-rail-down-cue')).toHaveCount(0);
    const furniture = rail().getByRole('button', { name: 'Furniture', exact: true });
    await furniture.scrollIntoViewIfNeeded();
    await furniture.click();
    await expect(page).toHaveURL(/\/department\/furniture/);
    await expect(rail().getByTestId('side-rail-furniture')).toHaveAttribute('aria-pressed', 'true');
    expect((await rail().boundingBox())!.height).toBe(300);
    const all = rail().getByRole('button', { name: 'All departments', exact: true });
    await all.scrollIntoViewIfNeeded();
    await all.click();
    await expect(page).toHaveURL(/\/categories/);
    await expect(rail().getByTestId('side-rail-all')).toHaveAttribute('aria-pressed', 'true');
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
    await page.screenshot({ path: `evidence/static-category-rail-${width}.png` });
  });
}

test('rail remains expanded after the former auto-close interval', async ({ page }) => {
  await page.goto('/department/birthday');
  const rail = page.getByTestId('department-side-rail').last();
  await expect(rail).toBeVisible();
  const before = await rail.boundingBox();
  await page.waitForTimeout(10500);
  expect(await rail.boundingBox()).toEqual(before);
  await expect(rail.getByTestId('side-rail-birthday')).toHaveAttribute('aria-pressed', 'true');
});
