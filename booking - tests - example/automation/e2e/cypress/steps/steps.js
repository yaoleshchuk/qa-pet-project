
// --- booking.steps.js ---
import { Given, When, Then } from '@badeball/cypress-cucumber-preprocessor';

import BookingPage from '../../support/pages/bookingPage';
const booking = new BookingPage();

Given('I open the Booking.com homepage', () => {
  booking.visit();
});

When('I click on the {string} button', (btn) => {
  booking.clickButton(btn);
});

When('I enter email {string} and click {string}', (email, btn) => {
  booking.enterEmail(email);
  booking.clickButton(btn);
});

When('I enter password {string} and click {string}', (password, btn) => {
  booking.enterPassword(password);
  booking.clickButton(btn);
});

Then('I should be redirected to the user dashboard', () => {
  cy.url().should('include', '/account');
});

// --- currency_switch.steps.js ---
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

// --- form_validation.steps.js ---
import { Given, When, Then } from '@badeball/cypress-cucumber-preprocessor';

Given('I am on the contact page', () => {
  cy.visit('/contact'); // Replace with actual URL if exists
});

When('I click the submit button without filling any field', () => {
  cy.get('button[type=submit]').click();
});

Then('I should see validation errors for required fields', () => {
  cy.get('.error, .validation-error').should('exist');
});

// --- invalid_login.steps.js ---
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

// --- language_switch.steps.js ---
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

// --- search_filters.steps.js ---
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
