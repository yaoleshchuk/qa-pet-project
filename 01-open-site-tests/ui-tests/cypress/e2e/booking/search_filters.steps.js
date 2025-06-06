import { Given, When, Then } from '@badeball/cypress-cucumber-preprocessor';
import BookingPage from '../../support/pages/bookingPage';
const booking = new BookingPage();

Given('I have searched for hotels in {string} from {string} to {string}', (city, checkin, checkout) => {
  booking.search(city, checkin, checkout, '2');
});

When('I apply filters: {string}, {string}, {string}', (f1, f2, f3) => {
  booking.applyFilter(f1);
  booking.applyFilter(f2);
  booking.applyFilter(f3);
});

Then('the results should only include hotels matching those filters', () => {
  cy.get('main').should('contain.text', 'Breakfast').and('contain.text', 'WiFi');
});
