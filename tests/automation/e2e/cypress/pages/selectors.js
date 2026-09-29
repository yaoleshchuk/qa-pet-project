class LocalStaysPage {
  visit() { cy.visit('/'); }
  signIn() { cy.get('[data-testid="sign-in-link"]').click(); }
  clickButton(label) { cy.contains('button', new RegExp(`^${label}$`, 'i')).click(); }
  enterEmail(email) { cy.get('[data-testid="login-email"]').clear().type(email); }
  enterPassword(password) { cy.get('[data-testid="login-password"]').clear().type(password); }
  search(city, checkin, checkout, adults) {
    cy.get('[data-testid="search-city"]').clear().type(city);
    cy.get('[data-testid="search-checkin"]').clear().type(checkin);
    cy.get('[data-testid="search-checkout"]').clear().type(checkout);
    cy.get('[data-testid="search-adults"]').clear().type(adults);
    cy.get('[data-testid="search-submit"]').click();
  }
  applyFilter(name) {
    if (name === 'Free WiFi') cy.get('[data-testid="filter-wifi"]').check();
    else if (name === 'Breakfast included') cy.get('[data-testid="filter-breakfast"]').check();
    else if (/^[345] stars$/.test(name)) cy.get('[data-testid="filter-stars"]').select(name[0]);
    else throw new Error(`Unsupported local filter: ${name}`);
  }
  selectLanguage(language) {
    cy.get('[data-testid="header-language-picker-trigger"]').select({ English: 'en', Español: 'es', Deutsch: 'de' }[language]);
  }
  selectCurrency(currency) { cy.get('[data-testid="header-currency-picker-trigger"]').select(currency); }
  sortBy(option) {
    cy.get('[data-testid="sorters-dropdown-trigger"]').select(option === 'Price (lowest first)' ? 'price-asc' : 'price-desc');
  }
}

export default LocalStaysPage;
