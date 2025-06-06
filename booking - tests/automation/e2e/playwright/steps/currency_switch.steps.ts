import { Given, When, Then } from '@cucumber/cucumber';
import { page } from '../../fixtures/world';
import { BookingPage } from '../pages/bookingPage';
import dotenv from 'dotenv';

dotenv.config();
const booking = new BookingPage(page);

Given('I open the Booking.com homepage', async () => {
  await booking.gotoHomePage();
});

When('I change currency to {string}', async (currency: string) => {
  await booking.selectCurrency(currency);
});

Then('prices should be displayed in {string}', async (symbol: string) => {
  await page.getByText(symbol).isVisible();
});
