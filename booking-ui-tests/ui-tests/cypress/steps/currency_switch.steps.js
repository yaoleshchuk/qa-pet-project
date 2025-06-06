import { Given, When, Then } from '@badeball/cypress-cucumber-preprocessor';
import BookingPage from '../../support/pages/bookingPage';
const booking = new BookingPage();

Given('I open the Booking.com homepage', () => {
  booking.visit();
});

When('I change currency to {string}', (currency) => {
  booking.selectCurrency(currency);
});

Then('prices should be displayed in {string}', (symbol) => {
  cy.contains(symbol).should('exist');
});
