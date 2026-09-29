import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { LocalStaysPage } from '../pages/selectors';
import { page } from '../../fixtures/world';

// A Page Object is resolved inside a step, after the Cucumber hook creates
// the scenario Page. No browser or API fixture is shared across scenarios.
const stays = () => new LocalStaysPage(page);
const cards = () => page.getByTestId('hotel-card');

async function cardTexts() {
  return cards().allTextContents();
}

async function displayedPrices() {
  const values = await cards().locator('[data-testid="hotel-price"]').allTextContents();
  return values.map((value) => Number(value.replace(/[^0-9.]/g, '')));
}

Given('I open the Booking.com homepage', async () => {
  await stays().gotoHomePage();
});

Given(/^I am logged in as "([^"]+)" with password "([^"]+)"$/, async (email: string, password: string) => {
  await stays().gotoHomePage();
  await stays().clickSignIn();
  await stays().enterEmail(email);
  await stays().enterPassword(password);
  await stays().clickButton('Sign in');
  await expect(page).toHaveURL(/\/account$/);
});

Given('I am on the contact page', async () => {
  await page.goto('/contact');
});

Given('I have searched for hotels in {string} from {string} to {string}', async (city: string, checkin: string, checkout: string) => {
  await stays().gotoHomePage();
  await stays().search(city, checkin, checkout, '2');
});

When('I click on the {string} button', async (label: string) => {
  if (label === 'Sign in') await stays().clickSignIn();
  else await stays().clickButton(label);
});

When('I enter email {string} and click {string}', async (email: string, button: string) => {
  await stays().enterEmail(email);
  // The local UI has one credential form rather than two remote-site pages.
  // "Continue" fills its first stage; the following Sign in submits the API form.
  if (button !== 'Continue') await stays().clickButton(button);
});

When('I enter password {string} and click {string}', async (password: string, button: string) => {
  await stays().enterPassword(password);
  await stays().clickButton(button);
});

When(/^I search for hotels in "([^"]+)" from "([^"]+)" to "([^"]+)" for "([^"]+)" adults$/, async (city, checkin, checkout, adults) => {
  await stays().search(city, checkin, checkout, adults);
});

When(/^I apply filter "([^"]+)"$/, async (filter: string) => {
  await stays().applyFilter(filter);
});

When('I apply filters: {string}, {string}, {string}', async (first: string, second: string, third: string) => {
  await stays().applyFilter(first);
  await stays().applyFilter(second);
  await stays().applyFilter(third);
});

When(/^I sort results by "([^"]+)"$/, async (option: string) => {
  await stays().sortBy(option);
});

When(/^I click "Save" on the first hotel$/, async () => {
  await stays().saveFirstHotel();
});

When('I change currency to {string}', async (currency: string) => {
  await stays().selectCurrency(currency);
});

When('I select language {string}', async (language: string) => {
  await stays().selectLanguage(language);
});

When('I click the submit button without filling any field', async () => {
  await page.getByRole('button', { name: 'Submit' }).click();
});

Then(/^I should be redirected to the user dashboard$/, async () => {
  await expect(page).toHaveURL(/\/account$/);
  await expect(page.getByTestId('account-greeting')).toContainText('testuser@example.com');
});

Then(/^I should see search results for "([^"]+)" with availability$/, async (city: string) => {
  await expect(cards().first()).toBeVisible();
  const texts = await cardTexts();
  expect(texts.every((text) => text.includes(city))).toBe(true);
  const currentUrl = new URL(page.url());
  expect(currentUrl.searchParams.get('city')).toBe(city);
  expect(currentUrl.searchParams.get('checkin')).toBe(await page.getByTestId('search-checkin').inputValue());
  expect(currentUrl.searchParams.get('checkout')).toBe(await page.getByTestId('search-checkout').inputValue());

  // This known blocked stay proves date parameters affect the server response,
  // rather than only the displayed form or URL.
  if (city === 'Paris' && currentUrl.searchParams.get('checkin') === '2026-07-01' && currentUrl.searchParams.get('checkout') === '2026-07-05') {
    expect(texts).toHaveLength(2);
    expect(texts.join(' ')).not.toContain('Eiffel Boutique Hotel');
  }
});

Then(/^I should see only 5-star hotel listings$/, async () => {
  const texts = await cardTexts();
  expect(texts.length).toBeGreaterThan(0);
  expect(texts.every((text) => text.includes('5 stars'))).toBe(true);
});

Then(/^the first result should have the lowest price$/, async () => {
  const prices = await displayedPrices();
  expect(prices.length).toBeGreaterThan(1);
  expect(prices).toEqual([...prices].sort((left, right) => left - right));
});

Then(/^the hotel should be added to my favorites$/, async () => {
  await expect(cards().first().getByTestId('wishlist-button')).toHaveAttribute('aria-pressed', 'true');
  await page.getByTestId('favorites-link').click();
  await expect(page.locator('#favorites-results').getByTestId('hotel-card')).toHaveCount(1);
});

Then('prices should be displayed in {string}', async (symbol: string) => {
  const prices = await cards().locator('[data-testid="hotel-price"]').allTextContents();
  expect(prices.length).toBeGreaterThan(0);
  expect(prices.every((price) => price.startsWith(symbol))).toBe(true);
});

Then('the site should display text {string}', async (text: string) => {
  await expect(page.getByText(text, { exact: true })).toBeVisible();
});

Then('I should see validation errors for required fields', async () => {
  await expect(page.locator('#contact-error')).toBeVisible();
});

Then('I should see an error message', async () => {
  await expect(page.locator('#login-error')).toBeVisible();
});

// Kept for the strict shared-feature matching gate. BVA guest-capacity cases
// are intentionally not tagged @LocalUI: this UI only validates the field and
// does not claim server-side capacity/availability behaviour.
Then('I should see a validation error message', async () => {
  await expect(page.locator('#search-error')).toBeVisible();
});

Then('the results should only include hotels matching those filters', async () => {
  const texts = await cardTexts();
  expect(texts.length).toBeGreaterThan(0);
  const wifi = await page.getByTestId('filter-wifi').isChecked();
  const breakfast = await page.getByTestId('filter-breakfast').isChecked();
  const stars = await page.getByTestId('filter-stars').inputValue();
  expect(texts.every((text) => (!wifi || text.includes('WiFi')) && (!breakfast || text.includes('Breakfast')) && (!stars || text.includes(`${stars} stars`)))).toBe(true);
});
