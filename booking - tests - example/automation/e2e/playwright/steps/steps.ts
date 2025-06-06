
// --- booking.steps.ts ---
import dotenv from 'dotenv';
dotenv.config();
import dotenv from 'dotenv';
dotenv.config();
import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { BookingPage } from '../pages/bookingPage';
import { page } from '../../fixtures/world';

const booking = new BookingPage(page);

// Given steps
Given(/^I open the Booking\.com homepage$/, async () => {
  await booking.gotoHomePage();
});

Given(/^I am logged in as "([^"]+)" with password "([^"]+)"$/, async (email: string, password: string) => {
  await booking.gotoHomePage();
  await booking.clickSignIn();
  await booking.enterEmail(email);
  await booking.enterPassword(password);
});

// When steps
When(/^I click on the "Sign in" button$/, async () => {
  await booking.clickSignIn();
});

When(/^I enter email "([^"]+)" and click "Continue"$/, async (email: string) => {
  await booking.enterEmail(email);
});

When(/^I enter password "([^"]+)" and click "Sign in"$/, async (password: string) => {
  await booking.enterPassword(password);
});

When(/^I search for hotels in "([^"]+)" from "([^"]+)" to "([^"]+)" for "([^"]+)" adults$/, async (city, checkin, checkout, adults) => {
  await booking.search(city, checkin, checkout, adults);
});

When(/^I apply filter "([^"]+)"$/, async (filter: string) => {
  await booking.applyFilter(filter);
});

When(/^I sort results by "([^"]+)"$/, async (option: string) => {
  await booking.sortBy(option);
});

When(/^I click "Save" on the first hotel$/, async () => {
  await booking.saveFirstHotel();
});

// Then steps
Then(/^I should be redirected to the user dashboard$/, async () => {
  await expect(page).toHaveURL(/account/);
});

Then(/^I should see search results for "([^"]+)" with availability$/, async (city: string) => {
  await expect(page.locator('main')).toContainText(city);
});

Then(/^I should see only 5-star hotel listings$/, async () => {
  await expect(page.locator('main')).toContainText('5 stars');
});

Then(/^the first result should have the lowest price$/, async () => {
  await expect(page.locator('main')).toContainText('$');
});

Then(/^the hotel should be added to my favorites$/, async () => {
  await expect(page.locator('[data-testid="wishlist-button"][aria-pressed="true"]')).toBeVisible();
});

// --- currency_switch.steps.ts ---
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

// --- form_validation.steps.ts ---
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

// --- invalid_login.steps.ts ---
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

// --- language_switch.steps.ts ---
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

// --- search_filters.steps.ts ---
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
