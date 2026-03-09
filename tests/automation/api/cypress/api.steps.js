import { Given, When, Then } from "@badeball/cypress-cucumber-preprocessor";
const API_URL = Cypress.env("API_URL");

// ===== LOGIN =====
When("I send POST request to /api/login with email {string} and password {string}", (email, password) => {
  cy.request({
    method: "POST",
    url: `${API_URL}/api/login`,
    body: { email, password },
    failOnStatusCode: false
  }).as("loginResponse");
});

Then("the response status code should be {int}", (code) => {
  cy.get("@loginResponse").its("status").should("eq", code);
});

Then("the response should contain field {string}", (field) => {
  cy.get("@loginResponse").its("body").should("have.property", field);
});

// ===== SEARCH CITY =====
When("I send GET request to /api/hotels?city={string}", (city) => {
  cy.request("GET", `${API_URL}/api/hotels?city=${city}`).as("searchResponse");
});

Then("response should contain hotels in {string}", (city) => {
  cy.get("@searchResponse").its("body").should("satisfy", (body) =>
    body.every((hotel) => hotel.city === city)
  );
});

// ===== DATE SEARCH =====
When("I send GET request to /api/hotels?city={string}&checkin={string}&checkout={string}", (city, checkin, checkout) => {
  cy.request("GET", `${API_URL}/api/hotels?city=${city}&checkin=${checkin}&checkout=${checkout}`).as("dateSearchResponse");
});

Then("response should contain available hotels in {string}", (city) => {
  cy.get("@dateSearchResponse").its("body").should("satisfy", (body) =>
    body.every((hotel) => hotel.city === city)
  );
});

// ===== PRICE FILTER =====
When("I send GET request to /api/hotels?city=Paris&min_price=100&max_price=300", () => {
  cy.request("GET", `${API_URL}/api/hotels?city=Paris&min_price=100&max_price=300`).as("priceResponse");
});

Then("response should only include hotels with price between 100 and 300", () => {
  cy.get("@priceResponse").its("body").should("satisfy", (body) =>
    body.every((hotel) => hotel.price >= 100 && hotel.price <= 300)
  );
});

// ===== CURRENCY =====
When("I send GET request to /api/hotels?city=Paris&currency={string}", (currency) => {
  cy.request("GET", `${API_URL}/api/hotels?city=Paris&currency=${currency}`).as("currencyResponse");
});

Then("all hotel prices should be in {string}", (symbol) => {
  cy.get("@currencyResponse").its("body").should("satisfy", (body) =>
    body.every((hotel) => hotel.currency_symbol === symbol)
  );
});

// ===== WISHLIST =====
When("I send POST request to /api/wishlist with hotel_id=123", () => {
  cy.request("POST", `${API_URL}/api/wishlist`, { hotel_id: 123 }).as("addWishlistResponse");
});

Then("wishlist should contain hotel 123", () => {
  cy.get("@addWishlistResponse").its("body.wishlist").should("include", 123);
});

When("I send DELETE request to /api/wishlist/123", () => {
  cy.request("DELETE", `${API_URL}/api/wishlist/123`).as("removeWishlistResponse");
});

Then("hotel 123 should no longer be in the wishlist", () => {
  cy.get("@removeWishlistResponse").its("body.wishlist").should("not.include", 123);
});

// ===== HOTEL DETAILS =====
When("I send GET request to /api/hotel/321", () => {
  cy.request("GET", `${API_URL}/api/hotel/321`).as("detailsResponse");
});

Then("response should contain hotel name, rating and address", () => {
  cy.get("@detailsResponse").its("body").should((body) => {
    expect(body).to.have.property("name");
    expect(body).to.have.property("rating");
    expect(body).to.have.property("address");
  });
});

// ===== REVIEWS =====
When("I send GET request to /api/hotel/321/reviews", () => {
  cy.request("GET", `${API_URL}/api/hotel/321/reviews`).as("reviewsResponse");
});

Then("response should contain list of reviews with user names and ratings", () => {
  cy.get("@reviewsResponse").its("body").should("satisfy", (body) =>
    body.every((review) => review.user && review.rating !== undefined)
  );
});
