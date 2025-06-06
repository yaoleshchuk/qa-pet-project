import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';

let response;
const API_URL = process.env.API_URL;

// ===== LOGIN =====
When('I send POST request to /api/login with email {string} and password {string}', async (email, password) => {
  response = await global.request.post(`${API_URL}/api/login`, {
    data: { email, password }
  });
});

Then('the response status code should be {int}', async (status) => {
  expect(response.status()).toBe(status);
});

Then('the response should contain field {string}', async (field) => {
  const body = await response.json();
  expect(body).toHaveProperty(field);
});

// ===== SEARCH CITY =====
When('I send GET request to /api/hotels?city={string}', async (city) => {
  response = await global.request.get(`${API_URL}/api/hotels?city=${city}`);
});

Then('response should contain hotels in {string}', async (city) => {
  const hotels = await response.json();
  for (const h of hotels) {
    expect(h.city).toBe(city);
  }
});

// ===== DATE SEARCH =====
When('I send GET request to /api/hotels?city={string}&checkin={string}&checkout={string}', async (city, checkin, checkout) => {
  response = await global.request.get(`${API_URL}/api/hotels?city=${city}&checkin=${checkin}&checkout=${checkout}`);
});

Then('response should contain available hotels in {string}', async (city) => {
  const hotels = await response.json();
  for (const h of hotels) {
    expect(h.city).toBe(city);
  }
});

// ===== PRICE FILTER =====
When('I send GET request to /api/hotels?city=Paris&min_price=100&max_price=300', async () => {
  response = await global.request.get(`${API_URL}/api/hotels?city=Paris&min_price=100&max_price=300`);
});

Then('response should only include hotels with price between 100 and 300', async () => {
  const hotels = await response.json();
  for (const h of hotels) {
    expect(h.price).toBeGreaterThanOrEqual(100);
    expect(h.price).toBeLessThanOrEqual(300);
  }
});

// ===== CURRENCY =====
When('I send GET request to /api/hotels?city=Paris&currency={string}', async (currency) => {
  response = await global.request.get(`${API_URL}/api/hotels?city=Paris&currency=${currency}`);
});

Then('all hotel prices should be in {string}', async (symbol) => {
  const hotels = await response.json();
  for (const h of hotels) {
    expect(h.currency_symbol).toBe(symbol);
  }
});

// ===== WISHLIST =====
When('I send POST request to /api/wishlist with hotel_id=123', async () => {
  response = await global.request.post(`${API_URL}/api/wishlist`, {
    data: { hotel_id: 123 }
  });
});

Then('wishlist should contain hotel 123', async () => {
  const body = await response.json();
  expect(body.wishlist).toContain(123);
});

When('I send DELETE request to /api/wishlist/123', async () => {
  response = await global.request.delete(`${API_URL}/api/wishlist/123`);
});

Then('hotel 123 should no longer be in the wishlist', async () => {
  const body = await response.json();
  expect(body.wishlist).not.toContain(123);
});

// ===== HOTEL DETAILS =====
When('I send GET request to /api/hotel/321', async () => {
  response = await global.request.get(`${API_URL}/api/hotel/321`);
});

Then('response should contain hotel name, rating and address', async () => {
  const body = await response.json();
  expect(body).toHaveProperty("name");
  expect(body).toHaveProperty("rating");
  expect(body).toHaveProperty("address");
});

// ===== REVIEWS =====
When('I send GET request to /api/hotel/321/reviews', async () => {
  response = await global.request.get(`${API_URL}/api/hotel/321/reviews`);
});

Then('response should contain list of reviews with user names and ratings', async () => {
  const reviews = await response.json();
  for (const r of reviews) {
    expect(r).toHaveProperty("user");
    expect(r).toHaveProperty("rating");
  }
});
