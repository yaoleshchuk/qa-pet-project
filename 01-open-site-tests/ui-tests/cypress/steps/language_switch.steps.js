import { Given, When, Then } from '@badeball/cypress-cucumber-preprocessor';
import BookingPage from '../../support/pages/bookingPage';
const booking = new BookingPage();

Given('I open the Booking.com homepage', () => {
  booking.visit();
});

When('I select language {string}', (language) => {
  booking.selectLanguage(language);
});

Then('the site should display text {string}', (text) => {
  cy.contains(text, { matchCase: false }).should('be.visible');
});
