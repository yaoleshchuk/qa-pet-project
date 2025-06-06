import { Page } from '@playwright/test';

export class BookingPage {
  constructor(private page: Page) {}

  // Locators
  get searchInput() { return this.page.locator('input[name="ss"]'); }
  get signInButton() { return this.page.getByRole('button', { name: /sign in/i }); }
  get continueButton() { return this.page.getByRole('button', { name: /continue/i }); }
  get emailInput() { return this.page.getByPlaceholder('Enter your email address'); }
  get passwordInput() { return this.page.getByPlaceholder('Enter your password'); }
  get searchButton() { return this.page.getByRole('button', { name: /search/i }); }
  get wishlistButton() { return this.page.locator('[data-testid="wishlist-button"]'); }

  // Navigation
  async gotoHomePage() {
    await this.page.goto('https://www.booking.com');
  }

  // Auth actions
  async clickSignIn() {
    await this.signInButton.click();
  }

  async enterEmail(email: string) {
    await this.emailInput.fill(email);
    await this.continueButton.click();
  }

  async enterPassword(password: string) {
    await this.passwordInput.fill(password);
    await this.signInButton.click();
  }

  // Search actions
  async search(city: string, checkin: string, checkout: string, adults: string) {
    await this.searchInput.fill(city);
    await this.searchButton.click();
    // Add date picker and adults selectors as needed
  }

  async applyFilter(filterName: string) {
    await this.page.getByText(filterName, { exact: false }).click();
  }

  async sortBy(option: string) {
    await this.page.getByText(/sort by/i).click();
    await this.page.getByText(option).click();
  }

  async saveFirstHotel() {
    await this.wishlistButton.first().click();
  }
}
