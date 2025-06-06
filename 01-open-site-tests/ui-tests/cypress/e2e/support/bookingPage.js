require('dotenv').config();

require('dotenv').config();

class BookingPage {
  visit() {
    cy.visit('https://www.booking.com');
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
}

export default BookingPage;
