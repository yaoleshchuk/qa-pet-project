import { Given, When, Then } from '@cucumber/cucumber';
import { page } from '../../fixtures/world';
import { BookingPage } from '../pages/bookingPage';
import dotenv from 'dotenv';

dotenv.config();
const booking = new BookingPage(page);

Given('I open the Booking.com homepage', async () => {
  await booking.gotoHomePage();
});

When('I select language {string}', async (language: string) => {
  await booking.selectLanguage(language);
});

Then('the site should display text {string}', async (text: string) => {
  await page.getByText(new RegExp(text, 'i')).isVisible();
});
