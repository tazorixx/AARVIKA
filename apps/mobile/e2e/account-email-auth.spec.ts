import {test, expect} from '@playwright/test';
import {readyImages} from './capture';

test('local Firebase email code signs in, restores and signs out', async ({page}) => {
  const email = `shopper-${Date.now()}@example.test`;
  await page.setViewportSize({width: 390, height: 844});
  await page.goto('/account');
  await page.getByRole('button', {name: 'Sign up / Log in with email'}).click();
  await page.getByRole('textbox', {name: 'Email address'}).fill(email);
  await page.getByRole('button', {name: 'Send six-digit code'}).click();
  await expect(page.getByText('LOCAL TEST INBOX · AARVIKA CODE')).toBeVisible();
  await page.getByRole('button', {name: 'Use local preview code'}).click();
  await page.getByRole('button', {name: 'Verify and sign in'}).click();
  await expect(page.getByText('Hello, ' + email.split('@')[0])).toBeVisible();
  await expect(page.getByText('LOCAL EMAIL')).toBeVisible();
  await expect(page.getByRole('button', {name: 'Close email sign-in'})).toBeHidden();
  await readyImages(page);
  await page.screenshot({path: 'evidence/account-email-signed-in-390.png'});
  await page.reload();
  await expect(page.getByText('Hello, ' + email.split('@')[0])).toBeVisible();
  await page.getByRole('button', {name: 'App settings'}).click();
  await page.getByRole('button', {name: 'Sign out of email'}).click();
  await expect(page.getByRole('button', {name: 'Sign up / Log in with email'})).toBeVisible();
});

test('code failure stays in the sign-in sheet with a clear retry path', async ({page}) => {
  await page.goto('/account');
  await page.getByRole('button', {name: 'Sign up / Log in with email'}).click();
  await page.getByRole('textbox', {name: 'Email address'}).fill(`retry-${Date.now()}@example.test`);
  await page.getByRole('button', {name: 'Send six-digit code'}).click();
  await page.getByRole('textbox', {name: 'Six-digit code'}).fill('000000');
  await page.getByRole('button', {name: 'Verify and sign in'}).click();
  await expect(page.getByText(/Code invalid or expired/)).toBeVisible();
  await expect(page.getByRole('button', {name: 'Use local preview code'})).toBeVisible();
});

test('account shortcuts reach orders, reminders and help', async ({page}) => {
  await page.setViewportSize({width: 320, height: 740});
  await page.goto('/account');
  await expect(page.getByRole('heading', {name: 'My account'})).toBeVisible();
  await readyImages(page);
  await page.screenshot({path: 'evidence/account-guest-320.png'});
  await page.getByRole('button', {name: 'My orders'}).click();
  await expect(page.getByText('No placed orders yet')).toBeVisible();
  await page.goto('/account');
  await page.getByRole('button', {name: 'Reminders'}).click();
  await page.getByRole('textbox', {name: 'Who or what is this for?'}).fill('Mum');
  await page.getByRole('textbox', {name: 'Date (YYYY-MM-DD)'}).fill('2026-12-15');
  await page.getByRole('button', {name: 'Save reminder'}).click();
  await expect(page.getByRole('heading', {name: 'Mum'})).toBeVisible();
  await page.goto('/account');
  await page.getByRole('button', {name: 'Help & support'}).click();
  await expect(page.getByRole('button', {name: 'Draft a support message'})).toBeVisible();
});
