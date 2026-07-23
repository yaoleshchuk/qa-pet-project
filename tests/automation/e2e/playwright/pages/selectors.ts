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
  get sortDropdown() { return this.page.locator('[data-testid="sorters-dropdown-trigger"]'); }

  // Navigation
  async gotoHomePage() {
    await this.page.goto('/');
  }

  // Auth
  async clickSignIn() {
    await this.signInButton.click();
  }

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
    const params = new URLSearchParams({
      ss: city,
      checkin,
      checkout,
      group_adults: adults,
      no_rooms: '1',
      group_children: '0',
    });

    // Navigating with explicit search parameters keeps the portfolio example
    // deterministic and proves that every argument participates in the flow.
    await this.page.goto(`/searchresults.html?${params.toString()}`);
  }

  async applyFilter(filterName: string) {
    await this.page.getByText(filterName, { exact: false }).click();
  }

  async sortBy(option: string) {
    await this.sortDropdown.click();
    await this.page.getByText(option, { exact: false }).click();
  }

  // Language / Currency
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
