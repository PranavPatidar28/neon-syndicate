import { expect, test } from '@playwright/test';

test('loads the untouched campaign and supports read-only mentor preview', async ({
  page,
}) => {
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: 'Operations deck' }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: /Monorepo Recon/ }),
  ).toBeVisible();
  await expect(page.getByText('0 / 48')).toBeVisible();

  await page.getByRole('button', { name: 'Campaign', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Campaign map' }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: /01-01.*Monorepo Recon/ }),
  ).toBeEnabled();
  await expect(
    page.getByRole('button', { name: /01-02.*Service Lifelines/ }),
  ).toBeDisabled();

  await page.getByRole('button', { name: 'Mentor', exact: true }).click();
  await page.getByRole('button', { name: 'Build context preview' }).click();
  await expect(page.getByRole('heading', { name: /characters/ })).toBeVisible();
  await expect(
    page.getByRole('button', {
      name: /Approve and ask Antigravity|Start Antigravity proxy to send/,
    }),
  ).toBeVisible();
});
