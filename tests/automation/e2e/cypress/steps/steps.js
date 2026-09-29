import { Before, Given, When, Then } from '@badeball/cypress-cucumber-preprocessor';
import LocalStaysPage from '../pages/selectors';

// Cypress queues commands; construct a stateless Page Object per step and
// reset only the mock process owned by this UI command before each scenario.
const stays = () => new LocalStaysPage();
const cards = () => cy.get('[data-testid="hotel-card"]');

Before(() => {
  cy.request('POST', '/api/test/reset');
  cy.visit('/', { onBeforeLoad: (window) => window.sessionStorage.clear() });
});

Given('I open the Booking.com homepage', () => stays().visit());

Given(/^I am logged in as "([^"]+)" with password "([^"]+)"$/, (email, password) => {
  stays().visit(); stays().signIn(); stays().enterEmail(email); stays().enterPassword(password); stays().clickButton('Sign in');
  cy.location('pathname').should('eq', '/account');
});

Given('I am on the contact page', () => cy.visit('/contact'));

Given('I have searched for hotels in {string} from {string} to {string}', (city, checkin, checkout) => {
  stays().visit(); stays().search(city, checkin, checkout, '2');
});

When('I click on the {string} button', (label) => {
  if (label === 'Sign in') stays().signIn(); else stays().clickButton(label);
});
When('I enter email {string} and click {string}', (email, label) => {
  stays().enterEmail(email);
  if (label !== 'Continue') stays().clickButton(label);
});
When('I enter password {string} and click {string}', (password, label) => { stays().enterPassword(password); stays().clickButton(label); });
When(/^I search for hotels in "([^"]+)" from "([^"]+)" to "([^"]+)" for "([^"]+)" adults$/, (city, checkin, checkout, adults) => stays().search(city, checkin, checkout, adults));
When(/^I apply filter "([^"]+)"$/, (filter) => stays().applyFilter(filter));
When('I apply filters: {string}, {string}, {string}', (first, second, third) => { stays().applyFilter(first); stays().applyFilter(second); stays().applyFilter(third); });
When(/^I sort results by "([^"]+)"$/, (option) => stays().sortBy(option));
When(/^I click "Save" on the first hotel$/, () => cards().first().find('[data-testid="wishlist-button"]').click());
When('I change currency to {string}', (currency) => stays().selectCurrency(currency));
When('I select language {string}', (language) => stays().selectLanguage(language));
When('I click the submit button without filling any field', () => cy.contains('button', 'Submit').click());

Then('I should be redirected to the user dashboard', () => {
  cy.location('pathname').should('eq', '/account');
  cy.get('[data-testid="account-greeting"]').should('contain.text', 'testuser@example.com');
});
Then(/^I should see search results for "([^"]+)" with availability$/, (city) => {
  cards().should('have.length.greaterThan', 0).then(($cards) => {
    const texts = [...$cards].map((card) => card.textContent);
    expect(texts.every((text) => text.includes(city))).to.equal(true);
    if (city === 'Paris') {
      cy.get('[data-testid="search-checkin"]').invoke('val').then((checkin) => {
        cy.get('[data-testid="search-checkout"]').invoke('val').then((checkout) => {
          if (checkin === '2026-07-01' && checkout === '2026-07-05') {
            expect(texts).to.have.length(2);
            expect(texts.join(' ')).not.to.contain('Eiffel Boutique Hotel');
          }
        });
      });
    }
  });
  cy.location('search').then((search) => {
    const params = new URLSearchParams(search);
    expect(params.get('city')).to.equal(city);
    cy.get('[data-testid="search-checkin"]').invoke('val').should('equal', params.get('checkin'));
    cy.get('[data-testid="search-checkout"]').invoke('val').should('equal', params.get('checkout'));
  });
});
Then('I should see only 5-star hotel listings', () => cards().each(($card) => expect($card.text()).to.include('5 stars')));
Then('the first result should have the lowest price', () => {
  cy.get('[data-testid="hotel-price"]').then(($prices) => {
    const values = [...$prices].map((price) => Number(price.textContent.replace(/[^0-9.]/g, '')));
    expect(values.length).to.be.greaterThan(1);
    expect(values).to.deep.equal([...values].sort((left, right) => left - right));
  });
});
Then('the hotel should be added to my favorites', () => {
  cards().first().find('[data-testid="wishlist-button"]').should('have.attr', 'aria-pressed', 'true');
  cy.get('[data-testid="favorites-link"]').click();
  cy.get('#favorites-results [data-testid="hotel-card"]').should('have.length', 1);
});
Then('prices should be displayed in {string}', (symbol) => {
  const currency = { '$': 'USD', '€': 'EUR', '£': 'GBP' }[symbol];
  cy.get('[data-testid="header-currency-picker-trigger"]').should('have.value', currency);
  cy.get('[data-testid="hotel-price"]').should(($prices) => {
  expect($prices.length).to.be.greaterThan(0);
  [...$prices].forEach((price) => {
    expect(price.textContent).to.match(new RegExp(`^\\${symbol}`));
    expect(price.textContent).to.match(new RegExp(` ${currency}$`));
  });
  });
});
Then('the site should display text {string}', (text) => cy.contains(text, { matchCase: true }).should('be.visible'));
Then('I should see validation errors for required fields', () => cy.get('#contact-error').should('be.visible'));
Then('I should see an error message', () => cy.get('#login-error').should('be.visible'));
Then('the results should only include hotels matching those filters', () => {
  cy.get('[data-testid="filter-wifi"]').invoke('prop', 'checked').then((wifi) => {
    cy.get('[data-testid="filter-breakfast"]').invoke('prop', 'checked').then((breakfast) => {
      cy.get('[data-testid="filter-stars"]').invoke('val').then((stars) => cards().each(($card) => {
        if (wifi) expect($card.text()).to.include('WiFi');
        if (breakfast) expect($card.text()).to.include('Breakfast');
        if (stars) expect($card.text()).to.include(`${stars} stars`);
      }));
    });
  });
});
