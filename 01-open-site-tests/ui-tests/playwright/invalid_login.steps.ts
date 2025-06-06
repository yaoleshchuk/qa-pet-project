import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { page } from '../../fixtures/world';
import { BookingPage } from '../pages/bookingPage';
import dotenv from 'dotenv';

dotenv.config();
const booking = new BookingPage(page);

Given('I open the Booking.com homepage', async () => {
  await booking.gotoHomePage();
});

When('I click on the {string} button', async (label: string) => {
  await booking.clickButton(label);
});

When('I enter email {string} and click {string}', async (email: string, btn: string) => {
  await booking.enterEmail(email);
  await booking.clickButton(btn);
});

When('I enter password {string} and click {string}', async (password: string, btn: string) => {
  await booking.enterPassword(password);
  await booking.clickButton(btn);
});

Then('I should see an error message', async () => {
  await expect(page.locator('text=/incorrect|invalid|error/i')).toBeVisible();
});
