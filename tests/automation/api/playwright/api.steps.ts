import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import type { APIResponse } from '@playwright/test';

let response: APIResponse | undefined;
let reviewId: number;
const API_URL = process.env.API_URL;

// ===== LOGIN =====

When(/^I send POST request to \/api\/login with email "([^"]+)" and password "([^"]+)"$/, async (email: string, password: string) => {
  response = await (global as any).request.post(`${API_URL}/api/login`, {
    data: { email, password }
  });
});

Then('the response status code should be {int}', async (status: number) => {
  expect(response!.status()).toBe(status);
});

Then('the response should contain field {string}', async (field: string) => {
  const body = await response!.json();
  expect(body).toHaveProperty(field);
});

// ===== SEARCH BY CITY =====

When(/^I send GET request to \/api\/hotels\?city=([^&\s]+)$/, async (city: string) => {
  response = await (global as any).request.get(`${API_URL}/api/hotels?city=${city}`);
});

Then('response should contain hotels in {string}', async (city: string) => {
  const hotels = await response!.json();
  for (const h of hotels) {
    expect(h.city).toBe(city);
  }
});

// ===== SEARCH WITH DATES =====

When(/^I send GET request to \/api\/hotels\?city=([^&\s]+)&checkin=([^&\s]+)&checkout=([^&\s]+)$/, async (city: string, checkin: string, checkout: string) => {
  response = await (global as any).request.get(`${API_URL}/api/hotels?city=${city}&checkin=${checkin}&checkout=${checkout}`);
});

Then('response should contain available hotels in {string}', async (city: string) => {
  const hotels = await response!.json();
  for (const h of hotels) {
    expect(h.city).toBe(city);
  }
});

// ===== PRICE FILTER =====

When(/^I send GET request to \/api\/hotels\?city=Paris&min_price=100&max_price=300$/, async () => {
  response = await (global as any).request.get(`${API_URL}/api/hotels?city=Paris&min_price=100&max_price=300`);
});

Then('response should only include hotels with price between 100 and 300', async () => {
  const hotels = await response!.json();
  for (const h of hotels) {
    expect(h.price).toBeGreaterThanOrEqual(100);
    expect(h.price).toBeLessThanOrEqual(300);
  }
});

// ===== CURRENCY =====

When(/^I send GET request to \/api\/hotels\?city=Paris&currency=([^&\s]+)$/, async (currency: string) => {
  response = await (global as any).request.get(`${API_URL}/api/hotels?city=Paris&currency=${currency}`);
});

Then('all hotel prices should be in {string}', async (symbol: string) => {
  const hotels = await response!.json();
  for (const h of hotels) {
    expect(h.currency_symbol).toBe(symbol);
  }
});

// ===== WISHLIST =====

When(/^I send POST request to \/api\/wishlist with hotel_id=123$/, async () => {
  response = await (global as any).request.post(`${API_URL}/api/wishlist`, {
    data: { hotel_id: 123 }
  });
});

Then('wishlist should contain hotel 123', async () => {
  const body = await response!.json();
  expect(body.wishlist).toContain(123);
});

When(/^I send DELETE request to \/api\/wishlist\/123$/, async () => {
  response = await (global as any).request.delete(`${API_URL}/api/wishlist/123`);
});

Then('hotel 123 should no longer be in the wishlist', async () => {
  const body = await response!.json();
  expect(body.wishlist).not.toContain(123);
});

// ===== HOTEL DETAILS =====

When(/^I send GET request to \/api\/hotel\/321$/, async () => {
  response = await (global as any).request.get(`${API_URL}/api/hotel/321`);
});

Then('response should contain hotel name, rating and address', async () => {
  const body = await response!.json();
  expect(body).toHaveProperty('name');
  expect(body).toHaveProperty('rating');
  expect(body).toHaveProperty('address');
});

// ===== REVIEWS (GET LIST) =====

When(/^I send GET request to \/api\/hotel\/321\/reviews$/, async () => {
  response = await (global as any).request.get(`${API_URL}/api/hotel/321/reviews`);
});

Then('response should contain list of reviews with user names and ratings', async () => {
  const reviews = await response!.json();
  for (const r of reviews) {
    expect(r).toHaveProperty('user');
    expect(r).toHaveProperty('rating');
  }
});

// ===== REVIEW CRUD LIFECYCLE =====

// CREATE (C)
When(/^I create a review for hotel (\d+) with rating (\d+) and comment "([^"]+)"$/, async (hotelId: string, rating: string, comment: string) => {
  response = await (global as any).request.post(`${API_URL}/api/hotel/${hotelId}/reviews`, {
    data: { rating: parseInt(rating, 10), comment }
  });
  if (response!.status() === 201) {
    const body = await response!.json();
    reviewId = body.id;
  }
});

Then('the response status should be {int}', async (status: number) => {
  expect(response!.status()).toBe(status);
});

Then('the review should be created successfully', async () => {
  expect(response!.status()).toBe(201);
  const body = await response!.json();
  expect(body).toHaveProperty('id');
  expect(typeof body.id).toBe('number');
});

// READ (R)
Given('a review exists for hotel 321', async () => {
  response = await (global as any).request.post(`${API_URL}/api/hotel/321/reviews`, {
    data: { rating: 5, comment: 'Exceptional service and location' }
  });
  const body = await response!.json();
  reviewId = body.id;
});

Given('a review has been deleted for hotel 321', async () => {
  // Create and immediately delete to get a valid-but-deleted id
  const createRes = await (global as any).request.post(`${API_URL}/api/hotel/321/reviews`, {
    data: { rating: 4, comment: 'To be deleted' }
  });
  const body = await createRes.json();
  reviewId = body.id;
  await (global as any).request.delete(`${API_URL}/api/hotel/321/reviews/${reviewId}`);
});

When('I retrieve the review by id', async () => {
  response = await (global as any).request.get(`${API_URL}/api/hotel/321/reviews/${reviewId}`);
});

Then(/^the review should contain rating (\d+) and comment "([^"]+)"$/, async (rating: string, comment: string) => {
  const body = await response!.json();
  expect(body.rating).toBe(parseInt(rating, 10));
  expect(body.comment).toBe(comment);
});

// UPDATE (U)
When(/^I update the review to rating (\d+) and comment "([^"]+)"$/, async (rating: string, comment: string) => {
  response = await (global as any).request.put(`${API_URL}/api/hotel/321/reviews/${reviewId}`, {
    data: { rating: parseInt(rating, 10), comment }
  });
});

When(/^I update review (\d+) for hotel (\d+) to rating (\d+) and comment "([^"]+)"$/, async (rId: string, hotelId: string, rating: string, comment: string) => {
  response = await (global as any).request.put(`${API_URL}/api/hotel/${hotelId}/reviews/${rId}`, {
    data: { rating: parseInt(rating, 10), comment }
  });
});

// DELETE (D)
When('I delete the review', async () => {
  response = await (global as any).request.delete(`${API_URL}/api/hotel/321/reviews/${reviewId}`);
});
