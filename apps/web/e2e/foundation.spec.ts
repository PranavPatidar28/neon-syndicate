import { expect, test } from '@playwright/test';
test('foundation landing page is available', async ({ page }) => {
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: 'Neon Syndicate' }),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: /locked/i })).toBeDisabled();
});
