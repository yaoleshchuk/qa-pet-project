import { Given, When, Then } from '@cucumber/cucumber';
import { page } from '../../fixtures/world';
import dotenv from 'dotenv';

dotenv.config();

Given('I am on the contact page', async () => {
  await page.goto('https://www.booking.com/contact');
});

When('I click the submit button without filling any field', async () => {
  await page.getByRole('button', { name: /submit/i }).click();
});

Then('I should see validation errors for required fields', async () => {
  await page.locator('.error, .validation-error').first().isVisible();
});
