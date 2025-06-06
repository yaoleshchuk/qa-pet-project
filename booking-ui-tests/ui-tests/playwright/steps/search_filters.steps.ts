import { Given, When, Then } from '@cucumber/cucumber';
import { page } from '../../fixtures/world';
import { BookingPage } from '../pages/bookingPage';
import dotenv from 'dotenv';

dotenv.config();
const booking = new BookingPage(page);

Given('I have searched for hotels in {string} from {string} to {string}', async (city: string, checkin: string, checkout: string) => {
  await booking.search(city, checkin, checkout, '2');
});

When('I apply filters: {string}, {string}, {string}', async (f1: string, f2: string, f3: string) => {
  await booking.applyFilter(f1);
  await booking.applyFilter(f2);
  await booking.applyFilter(f3);
});

Then('the results should only include hotels matching those filters', async () => {
  await page.getByText(/WiFi|Breakfast|4 stars/i).isVisible();
});
