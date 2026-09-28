import { After, Before, Given, Then, When } from '@badeball/cypress-cucumber-preprocessor';

const currencies = { '$': 'USD', '€': 'EUR', '£': 'GBP' };
const hotelOnePrices = { USD: 198.08, EUR: 180.07, GBP: 153.06 };

function apiUrl() {
  const value = Cypress.env('API_URL');
  expect(value, 'Cypress API URL').to.be.a('string').and.not.be.empty;
  const url = new URL(value);
  expect(['localhost', '127.0.0.1', '::1'], 'Cypress API host must be local').to.include(url.hostname);
  return url.origin;
}

function state(context) {
  expect(context.apiState, 'API scenario state should be initialized').to.exist;
  return context.apiState;
}

function request(context, options) {
  void context;
  return cy.request({ failOnStatusCode: false, ...options, url: `${apiUrl()}${options.url}` }).as('apiResponse');
}

function response() {
  return cy.get('@apiResponse');
}

function nonEmptyString(value, label) {
  expect(value, label).to.be.a('string').and.not.be.empty;
}

function errorEnvelope(body) {
  expect(body).to.have.all.keys('error');
  expect(body.error).to.be.an('object');
  nonEmptyString(body.error.code, 'error.code');
  nonEmptyString(body.error.message, 'error.message');
}

function hotelShape(hotel) {
  expect(hotel).to.be.an('object');
  expect(hotel.id).to.be.a('number').and.satisfy(Number.isSafeInteger).and.be.greaterThan(0);
  nonEmptyString(hotel.city, 'hotel.city');
  nonEmptyString(hotel.name, 'hotel.name');
  expect(hotel.stars).to.be.a('number').and.satisfy(Number.isInteger).and.be.within(1, 5);
  expect(hotel.rating).to.be.a('number');
  nonEmptyString(hotel.address, 'hotel.address');
  expect(hotel.amenities).to.be.an('array');
}

function reviewShape(review, hotelId = 321) {
  expect(review).to.be.an('object');
  expect(review.id).to.be.a('number').and.satisfy(Number.isSafeInteger).and.be.greaterThan(0);
  expect(review.hotelId).to.equal(hotelId);
  nonEmptyString(review.user, 'review.user');
  expect(review.rating).to.be.a('number').and.satisfy(Number.isInteger).and.be.within(1, 5);
  nonEmptyString(review.comment, 'review.comment');
}

function reviewId(context) {
  const value = state(context).reviewId;
  expect(value, 'The scenario should create its own review before using its id').to.be.a('number');
  return value;
}

function reviewHotelId(context) {
  const value = state(context).reviewHotelId;
  expect(value, 'The scenario should record the review hotel id').to.be.a('number');
  return value;
}

function trackReview(context, hotelId, result) {
  if (result.status !== 201) return;
  reviewShape(result.body, hotelId);
  const scenario = state(context);
  scenario.createdReviews.set(result.body.id, { hotelId, reviewId: result.body.id, deletionRequested: false });
  scenario.reviewId = result.body.id;
  scenario.reviewHotelId = hotelId;
}

function emergencyDelete(path) {
  const xhr = new XMLHttpRequest();
  xhr.open('DELETE', `${apiUrl()}${path}`, false);
  xhr.send();
  expect(xhr.status, `emergency cleanup ${path}`).to.be.oneOf([200, 204, 404]);
}

function emergencyCleanup(context) {
  const scenario = context.apiState;
  if (!scenario) return;
  [...scenario.createdReviews.values()].reverse().forEach((item) => {
    emergencyDelete(`/api/hotel/${item.hotelId}/reviews/${item.reviewId}`);
    item.deletionRequested = true;
  });
  [...scenario.wishlistHotelIds].forEach((hotelId) => emergencyDelete(`/api/wishlist/${hotelId}`));
}

function createReview(context, hotelId, rating, comment) {
  return request(context, { method: 'POST', url: `/api/hotel/${hotelId}/reviews`, body: { rating, comment } })
    .then((result) => {
      trackReview(context, hotelId, result);
      return result;
    });
}

Before({ tags: '@API' }, function () {
  this.apiState = { createdReviews: new Map(), wishlistHotelIds: new Set(), reviewId: undefined, reviewHotelId: undefined };
  const failHandler = (error) => {
    try {
      emergencyCleanup(this);
    } catch (cleanupError) {
      error.message = `${error.message}\nEmergency cleanup failed: ${cleanupError.message}`;
    }
    throw error;
  };
  this.apiState.failHandler = failHandler;
  Cypress.once('fail', failHandler);
});

After({ tags: '@API' }, function () {
  const scenario = this.apiState;
  if (!scenario) return;
  Cypress.off('fail', scenario.failHandler);
  const reviewCleanup = [...scenario.createdReviews.values()].reverse().reduce(
    (chain, item) => chain.then(() => request(this, { method: 'DELETE', url: `/api/hotel/${item.hotelId}/reviews/${item.reviewId}` })
      .then((result) => expect(result.status, `cleanup review ${item.reviewId}`).to.be.oneOf(item.deletionRequested ? [204, 404] : [204]))),
    cy.wrap(null, { log: false }),
  );
  return reviewCleanup.then(() => [...scenario.wishlistHotelIds].reduce(
    (chain, hotelId) => chain.then(() => request(this, { method: 'DELETE', url: `/api/wishlist/${hotelId}` })
      .then((result) => {
        expect(result.status, `cleanup wishlist hotel ${hotelId}`).to.equal(200);
        expect(result.body).to.deep.equal({ wishlist: [] });
      })),
    cy.wrap(null, { log: false }),
  ));
});

When(/^I send POST request to \/api\/login with email "([^"]+)" and password "([^"]+)"$/, function (email, password) {
  return request(this, { method: 'POST', url: '/api/login', body: { email, password } });
});

Then('the response status code should be {int}', (status) => response().its('status').should('equal', status));
Then('the response status should be {int}', (status) => response().its('status').should('equal', status));

Then('the response should contain field {string}', (field) => response().its('body').should((body) => {
  expect(body).to.have.property(field);
  if (field === 'token') {
    nonEmptyString(body.token, 'token');
    expect(body.user).to.include.all.keys('email', 'name');
    nonEmptyString(body.user.email, 'user.email');
    nonEmptyString(body.user.name, 'user.name');
  } else if (field === 'id') {
    expect(body.id).to.be.a('number').and.satisfy(Number.isSafeInteger).and.be.greaterThan(0);
  } else if (field === 'error') errorEnvelope(body);
}));

When(/^I send GET request to \/api\/hotels\?city=([^&\s]+)$/, function (city) {
  return request(this, { method: 'GET', url: `/api/hotels?city=${encodeURIComponent(city)}` });
});

Then('response should contain hotels in {string}', (city) => response().its('body').should((hotels) => {
  expect(hotels).to.be.an('array').and.not.be.empty;
  hotels.forEach((hotel) => {
    hotelShape(hotel);
    expect(hotel.city).to.equal(city);
    expect(hotel.currency).to.equal('EUR');
    expect(hotel.currency_symbol).to.equal('€');
    expect(hotel.price).to.be.a('number').and.be.greaterThan(0);
  });
}));

When(/^I send GET request to \/api\/hotels\?city=([^&\s]+)&checkin=([^&\s]+)&checkout=([^&\s]+)$/, function (city, checkin, checkout) {
  return request(this, { method: 'GET', url: `/api/hotels?${new URLSearchParams({ city, checkin, checkout })}` });
});

Then('response should contain available hotels in {string}', (city) => response().its('body').should((hotels) => {
  expect(hotels).to.be.an('array').and.not.be.empty;
  hotels.forEach((hotel) => {
    hotelShape(hotel);
    expect(hotel.city).to.equal(city);
    expect(hotel.price).to.be.a('number').and.be.greaterThan(0);
  });
  if (city === 'Paris') expect(hotels.map(({ id }) => id)).not.to.include(2);
  if (city === 'Rome') expect(hotels.map(({ id }) => id)).not.to.include(4);
}));

When(/^I send GET request to \/api\/hotels\?city=Paris&min_price=100&max_price=300$/, function () {
  return request(this, { method: 'GET', url: '/api/hotels?city=Paris&min_price=100&max_price=300' });
});

Then('response should only include hotels with price between 100 and 300', () => response().its('body').should((hotels) => {
  expect(hotels).to.be.an('array').and.not.be.empty;
  hotels.forEach((hotel) => {
    hotelShape(hotel);
    expect(hotel.city).to.equal('Paris');
    expect(hotel.currency).to.equal('EUR');
    expect(hotel.price).to.be.within(100, 300);
  });
}));

When(/^I send GET request to \/api\/hotels\?city=Paris&currency=([^&\s]+)$/, function (currency) {
  return request(this, { method: 'GET', url: `/api/hotels?city=Paris&currency=${encodeURIComponent(currency)}` });
});

Then('all hotel prices should be in {string}', (symbol) => response().its('body').should((hotels) => {
  const currency = currencies[symbol];
  expect(currency, `currency for ${symbol}`).to.exist;
  expect(hotels).to.be.an('array').and.not.be.empty;
  hotels.forEach((hotel) => {
    hotelShape(hotel);
    expect(hotel.currency_symbol).to.equal(symbol);
    expect(hotel.currency).to.equal(currency);
    expect(hotel.price).to.be.a('number').and.be.greaterThan(0);
  });
  expect(hotels.find(({ id }) => id === 1)?.price).to.equal(hotelOnePrices[currency]);
}));

Given('hotel 123 is in the wishlist for this scenario', function () {
  return request(this, { method: 'POST', url: '/api/wishlist', body: { hotel_id: 123 } }).then((result) => {
    expect(result.status).to.equal(200);
    expect(result.body).to.deep.equal({ wishlist: [123] });
    state(this).wishlistHotelIds.add(123);
  });
});

When(/^I send POST request to \/api\/wishlist with hotel_id=123$/, function () {
  return request(this, { method: 'POST', url: '/api/wishlist', body: { hotel_id: 123 } }).then((result) => {
    if (result.status === 200) state(this).wishlistHotelIds.add(123);
  });
});

Then('wishlist should contain hotel 123', () => response().its('body').should('deep.equal', { wishlist: [123] }));

When(/^I send DELETE request to \/api\/wishlist\/123$/, function () {
  return request(this, { method: 'DELETE', url: '/api/wishlist/123' });
});

Then('hotel 123 should no longer be in the wishlist', function () {
  return response().its('body').should('deep.equal', { wishlist: [] }).then(() => state(this).wishlistHotelIds.delete(123));
});

When(/^I send GET request to \/api\/hotel\/321$/, function () {
  return request(this, { method: 'GET', url: '/api/hotel/321' });
});

Then('response should contain hotel name, rating and address', () => response().its('body').should((hotel) => {
  hotelShape(hotel);
  expect(hotel.id).to.equal(321);
  expect(hotel.name).to.equal('Grand Booking Hotel Amsterdam');
  expect(hotel.rating).to.equal(4.8);
  expect(hotel.address).to.equal('100 Main Boulevard, Amsterdam');
  nonEmptyString(hotel.description, 'hotel.description');
  expect(hotel.amenities).to.not.be.empty;
}));

When(/^I send GET request to \/api\/hotel\/321\/reviews$/, function () {
  return request(this, { method: 'GET', url: '/api/hotel/321/reviews' });
});

Then('response should contain list of reviews with user names and ratings', () => response().its('body').should((reviews) => {
  expect(reviews).to.be.an('array').and.to.have.length(3);
  expect(reviews.map(({ id }) => id)).to.deep.equal([1, 2, 3]);
  reviews.forEach((review) => reviewShape(review));
}));

When(/^I send POST request to \/api\/hotel\/(\d+)\/reviews with rating "([^"]+)" and comment "([^"]*)"$/, function (hotelIdText, rating, comment) {
  return createReview(this, Number(hotelIdText), Number(rating), comment);
});

When(/^I send POST request to \/api\/hotel\/(\d+)\/reviews with rating "([^"]+)" and a comment of (\d+) characters$/, function (hotelIdText, rating, count) {
  return createReview(this, Number(hotelIdText), Number(rating), 'x'.repeat(Number(count)));
});

Then('the response field {string} should equal {string}', (field, expected) => response().its('body').should((body) => {
  expect(String(body[field])).to.equal(expected);
}));

When(/^I create a review for hotel (\d+) with rating (\d+) and comment "([^"]+)"$/, function (hotelIdText, rating, comment) {
  return createReview(this, Number(hotelIdText), Number(rating), comment);
});

Then('the review should be created successfully', function () {
  return response().should((result) => {
    expect(result.status).to.equal(201);
    reviewShape(result.body, reviewHotelId(this));
    expect(result.body.id).to.equal(reviewId(this));
  });
});

Given('a review exists for hotel 321', function () {
  return createReview(this, 321, 5, 'Exceptional service and location').then((result) => expect(result.status).to.equal(201));
});

Given('a review has been deleted for hotel 321', function () {
  return createReview(this, 321, 4, 'To be deleted')
    .then((result) => {
      expect(result.status).to.equal(201);
      return request(this, { method: 'DELETE', url: `/api/hotel/321/reviews/${result.body.id}` });
    })
    .then((result) => {
      expect(result.status).to.equal(204);
      state(this).createdReviews.get(reviewId(this)).deletionRequested = true;
    });
});

When('I retrieve the review by id', function () {
  return request(this, { method: 'GET', url: `/api/hotel/${reviewHotelId(this)}/reviews/${reviewId(this)}` });
});

Then(/^the review should contain rating (\d+) and comment "([^"]+)"$/, function (rating, comment) {
  return response().its('body').should((review) => {
    reviewShape(review, reviewHotelId(this));
    expect(review.id).to.equal(reviewId(this));
    expect(review.rating).to.equal(Number(rating));
    expect(review.comment).to.equal(comment);
  });
});

When(/^I update the review to rating (\d+) and comment "([^"]+)"$/, function (rating, comment) {
  return request(this, { method: 'PUT', url: `/api/hotel/${reviewHotelId(this)}/reviews/${reviewId(this)}`, body: { rating: Number(rating), comment } });
});

When(/^I update review (\d+) for hotel (\d+) to rating (\d+) and comment "([^"]+)"$/, function (reviewIdText, hotelId, rating, comment) {
  return request(this, { method: 'PUT', url: `/api/hotel/${hotelId}/reviews/${reviewIdText}`, body: { rating: Number(rating), comment } });
});

When('I delete the review', function () {
  return request(this, { method: 'DELETE', url: `/api/hotel/${reviewHotelId(this)}/reviews/${reviewId(this)}` }).then((result) => {
    if (result.status === 204) state(this).createdReviews.get(reviewId(this)).deletionRequested = true;
  });
});
