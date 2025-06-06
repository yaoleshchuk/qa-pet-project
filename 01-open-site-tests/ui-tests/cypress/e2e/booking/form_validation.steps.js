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
