import { Given, When, Then } from '@badeball/cypress-cucumber-preprocessor';
import BookingPage from '../../support/pages/bookingPage';
const booking = new BookingPage();

Given('I open the Booking.com homepage', () => {
  booking.visit();
});

When('I click on the {string} button', (label) => {
  booking.clickButton(label);
});

When('I enter email {string} and click {string}', (email, btn) => {
  booking.enterEmail(email);
  booking.clickButton(btn);
});

When('I enter password {string} and click {string}', (password, btn) => {
  booking.enterPassword(password);
  booking.clickButton(btn);
});

Then('I should see an error message', () => {
  cy.contains('incorrect').should('be.visible');
});
