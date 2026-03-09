
// --- bookingPage.js ---
require('dotenv').config();

class BookingPage {
  visit() {
    cy.visit(Cypress.env('baseUrl') || 'https://www.booking.com');
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
    cy.get('input[name="ss"]').clear().type(city);
    cy.get('button[type=submit]').click();
    // NOTE: Add date/adult picker selectors if needed
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
