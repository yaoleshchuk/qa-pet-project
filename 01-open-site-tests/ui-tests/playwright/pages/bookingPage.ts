import { Page } from '@playwright/test';

export class BookingPage {
  constructor(private page: Page) {}

  // Locators
  get searchInput() { return this.page.locator('input[name="ss"]'); }
  get signInButton() { return this.page.getByRole('button', { name: /sign in/i }); }
  get continueButton() { return this.page.getByRole('button', { name: /continue/i }); }
  get emailInput() { return this.page.getByPlaceholder('Enter your email address'); }
  get passwordInput() { return this.page.getByPlaceholder('Enter your password'); }
  get wishlistButton() { return this.page.locator('[data-testid="wishlist-button"]'); }

  // Navigation
  async gotoHomePage() {
    await this.page.goto(process.env.BASE_URL || 'https://www.booking.com');
  }

  // Auth
  async clickButton(label: string) {
    await this.page.getByRole('button', { name: new RegExp(label, 'i') }).click();
  }

  async enterEmail(email: string) {
    await this.emailInput.fill(email);
  }

  async enterPassword(password: string) {
    await this.passwordInput.fill(password);
  }

  // Search
  async search(city: string, checkin: string, checkout: string, adults: string) {
    await this.searchInput.fill(city);
    await this.page.getByRole('button', { name: /search/i }).click();
    // Dates and adults are placeholder logic here
  }

  async applyFilter(filterName: string) {
    await this.page.getByText(filterName, { exact: false }).click();
  }

  // Language/Currency
  async selectLanguage(language: string) {
    await this.page.getByTestId('header-language-picker-trigger').click();
    await this.page.getByText(language, { exact: false }).click();
  }

  async selectCurrency(currency: string) {
    await this.page.getByTestId('header-currency-picker-trigger').click();
    await this.page.getByText(currency, { exact: false }).click();
  }

  async saveFirstHotel() {
    await this.wishlistButton.first().click();
  }
}
