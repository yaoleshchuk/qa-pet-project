
// --- bookingPage.js ---
require('dotenv').config();

class BookingPage {
  visit() {
    cy.visit('/');
  }

  clickButton(label) {
    cy.contains('button', new RegExp(label, 'i')).click();
  }

  enterEmail(email) {
    cy.get('input[type=email], input[placeholder*="email"]').first().type(email);
  }

  enterPassword(password) {
    cy.get('input[type=password]').first().type(password);
  }

  search(city, checkin, checkout, adults) {
    const params = new URLSearchParams({
      ss: city,
      checkin,
      checkout,
      group_adults: adults,
      no_rooms: '1',
      group_children: '0',
    });

    cy.visit(`/searchresults.html?${params.toString()}`);
  }

  applyFilter(filterName) {
    cy.contains(filterName).click({ force: true });
  }

  selectLanguage(language) {
    cy.get('[data-testid="header-language-picker-trigger"]').click();
    cy.contains(language).click({ force: true });
  }

  selectCurrency(currency) {
    cy.get('[data-testid="header-currency-picker-trigger"]').click();
    cy.contains(currency).click({ force: true });
  }
}

export default BookingPage;
