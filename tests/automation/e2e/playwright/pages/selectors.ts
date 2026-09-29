import { Page } from '@playwright/test';

export class LocalStaysPage {
  constructor(private page: Page) {}

  // Locators
  get cityInput() { return this.page.getByTestId('search-city'); }
  get checkinInput() { return this.page.getByTestId('search-checkin'); }
  get checkoutInput() { return this.page.getByTestId('search-checkout'); }
  get adultsInput() { return this.page.getByTestId('search-adults'); }
  get searchSubmit() { return this.page.getByTestId('search-submit'); }
  get signInLink() { return this.page.getByTestId('sign-in-link'); }
  get emailInput() { return this.page.getByTestId('login-email'); }
  get passwordInput() { return this.page.getByPlaceholder('Enter your password'); }
  get cards() { return this.page.getByTestId('hotel-card'); }

  // Navigation
  async gotoHomePage() {
    await this.page.goto('/');
  }

  // Auth
  async clickSignIn() {
    await this.signInLink.click();
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
    await this.cityInput.fill(city);
    await this.checkinInput.fill(checkin);
    await this.checkoutInput.fill(checkout);
    await this.adultsInput.fill(adults);
    await this.searchSubmit.click();
  }

  async applyFilter(filterName: string) {
    const controls: Record<string, string> = {
      'Free WiFi': 'filter-wifi',
      'Breakfast included': 'filter-breakfast',
      '5 stars': 'filter-stars',
      '4 stars': 'filter-stars',
      '3 stars': 'filter-stars',
    };
    const testId = controls[filterName];
    if (!testId) throw new Error(`Unsupported local filter: ${filterName}`);
    if (filterName.endsWith('stars')) await this.page.getByTestId(testId).selectOption(filterName[0]);
    else await this.page.getByTestId(testId).check();
  }

  async sortBy(option: string) {
    const value = option === 'Price (lowest first)' ? 'price-asc' : option === 'Price (highest first)' ? 'price-desc' : '';
    await this.page.getByTestId('sorters-dropdown-trigger').selectOption(value);
  }

  // Language / Currency
  async selectLanguage(language: string) {
    const values: Record<string, string> = { English: 'en', Español: 'es', Deutsch: 'de' };
    await this.page.getByTestId('header-language-picker-trigger').selectOption(values[language]);
  }

  async selectCurrency(currency: string) {
    await this.page.getByTestId('header-currency-picker-trigger').selectOption(currency);
  }

  async saveFirstHotel() {
    await this.cards.first().getByTestId('wishlist-button').click();
  }
}
