import {test,expect} from '@playwright/test';

test('shared mobile preview reads published catalogue and shows real Firebase sign-in',async({page})=>{
  await page.goto('/account',{waitUntil:'domcontentloaded'});
  await expect(page.getByRole('heading',{name:'My account'})).toBeVisible();
  await expect(page.getByText('Sign in securely with your Firebase email and password.')).toBeVisible();
  await page.getByRole('button',{name:'Sign up / Log in with email'}).click();
  await expect(page.getByRole('textbox',{name:'Password'})).toBeVisible();
  await page.goto('/categories',{waitUntil:'domcontentloaded'});
  await expect(page.getByRole('tab',{name:'Categories'})).toBeVisible();
  await page.goto('/department/wedding',{waitUntil:'domcontentloaded'});
  await expect(page.getByText('Explore states',{exact:true})).toBeVisible();
});
