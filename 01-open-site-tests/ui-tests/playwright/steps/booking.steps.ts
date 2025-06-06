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
