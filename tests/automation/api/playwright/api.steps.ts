import { Given, Then, When } from '@cucumber/cucumber';
import { expect, type APIRequestContext, type APIResponse } from '@playwright/test';
import type { ApiWorld } from './world-api';

interface ErrorBody {
  error: { code: string; message: string };
}

interface Hotel {
  id: number;
  city: string;
  name: string;
  stars: number;
  rating: number;
  price: number;
  address: string;
  amenities: string[];
  currency: string;
  currency_symbol: string;
}

interface Review {
  id: number;
  hotelId: number;
  user: string;
  rating: number;
  comment: string;
}

function requestFor(world: ApiWorld): APIRequestContext {
  expect(world.request, 'API request context should be initialized for the scenario').toBeDefined();
  return world.request!;
}

function responseFor(world: ApiWorld): APIResponse {
  expect(world.response, 'An API request should be sent before asserting its response').toBeDefined();
  return world.response!;
}

function reviewIdFor(world: ApiWorld): number {
  expect(world.reviewId, 'The scenario should create its own review before using its id').toBeDefined();
  return world.reviewId!;
}

function reviewHotelIdFor(world: ApiWorld): number {
  expect(world.reviewHotelId, 'The scenario should record the review hotel id').toBeDefined();
  return world.reviewHotelId!;
}

async function bodyOf<T>(world: ApiWorld): Promise<T> {
  return responseFor(world).json() as Promise<T>;
}

function expectNonEmptyString(value: unknown, label: string): asserts value is string {
  expect(typeof value, label).toBe('string');
  expect((value as string).length, label).toBeGreaterThan(0);
}

function expectHotelShape(hotel: Hotel): void {
  expect(Number.isSafeInteger(hotel.id)).toBe(true);
  expect(hotel.id).toBeGreaterThan(0);
  expectNonEmptyString(hotel.city, 'hotel.city');
  expectNonEmptyString(hotel.name, 'hotel.name');
  expect(Number.isInteger(hotel.stars)).toBe(true);
  expect(hotel.stars).toBeGreaterThanOrEqual(1);
  expect(hotel.stars).toBeLessThanOrEqual(5);
  expect(typeof hotel.rating).toBe('number');
  expectNonEmptyString(hotel.address, 'hotel.address');
  expect(Array.isArray(hotel.amenities)).toBe(true);
}

function expectReviewShape(review: Review, hotelId = 321): void {
  expect(Number.isSafeInteger(review.id)).toBe(true);
  expect(review.id).toBeGreaterThan(0);
  expect(review.hotelId).toBe(hotelId);
  expectNonEmptyString(review.user, 'review.user');
  expect(Number.isInteger(review.rating)).toBe(true);
  expect(review.rating).toBeGreaterThanOrEqual(1);
  expect(review.rating).toBeLessThanOrEqual(5);
  expectNonEmptyString(review.comment, 'review.comment');
}

async function captureCreatedReview(world: ApiWorld, hotelId: number): Promise<void> {
  if (responseFor(world).status() !== 201) return;
  const review = await bodyOf<Review>(world);
  if (Number.isSafeInteger(review.id) && review.id > 0) world.trackReview(hotelId, review.id);
  expectReviewShape(review, hotelId);
}

// Login
When(/^I send POST request to \/api\/login with email "([^"]+)" and password "([^"]+)"$/, async function (this: ApiWorld, email: string, password: string) {
  this.response = await requestFor(this).post('/api/login', { data: { email, password } });
});

Then('the response status code should be {int}', async function (this: ApiWorld, status: number) {
  expect(responseFor(this).status()).toBe(status);
});

Then('the response should contain field {string}', async function (this: ApiWorld, field: string) {
  const body = await bodyOf<Record<string, unknown>>(this);
  expect(body).toHaveProperty(field);
  if (field === 'token') {
    expectNonEmptyString(body.token, 'token');
    expect(body.user).toEqual(expect.objectContaining({ email: expect.any(String), name: expect.any(String) }));
  } else if (field === 'id') {
    expect(Number.isSafeInteger(body.id)).toBe(true);
    expect(body.id).toBeGreaterThan(0);
  } else if (field === 'error') {
    const errorBody = body as unknown as ErrorBody;
    expect(Object.keys(errorBody)).toEqual(['error']);
    expectNonEmptyString(errorBody.error?.code, 'error.code');
    expectNonEmptyString(errorBody.error?.message, 'error.message');
  }
});

// Hotel search
When(/^I send GET request to \/api\/hotels\?city=([^&\s]+)$/, async function (this: ApiWorld, city: string) {
  this.response = await requestFor(this).get(`/api/hotels?city=${encodeURIComponent(city)}`);
});

Then('response should contain hotels in {string}', async function (this: ApiWorld, city: string) {
  const hotels = await bodyOf<Hotel[]>(this);
  expect(Array.isArray(hotels)).toBe(true);
  expect(hotels.length).toBeGreaterThan(0);
  for (const hotel of hotels) {
    expectHotelShape(hotel);
    expect(hotel.city).toBe(city);
    expect(hotel.currency).toBe('EUR');
    expect(hotel.currency_symbol).toBe('€');
    expect(hotel.price).toBeGreaterThan(0);
  }
});

When(/^I send GET request to \/api\/hotels\?city=([^&\s]+)&checkin=([^&\s]+)&checkout=([^&\s]+)$/, async function (this: ApiWorld, city: string, checkin: string, checkout: string) {
  const query = new URLSearchParams({ city, checkin, checkout });
  this.response = await requestFor(this).get(`/api/hotels?${query.toString()}`);
});

Then('response should contain available hotels in {string}', async function (this: ApiWorld, city: string) {
  const hotels = await bodyOf<Hotel[]>(this);
  expect(Array.isArray(hotels)).toBe(true);
  expect(hotels.length).toBeGreaterThan(0);
  for (const hotel of hotels) {
    expectHotelShape(hotel);
    expect(hotel.city).toBe(city);
    expect(hotel.price).toBeGreaterThan(0);
  }
  if (city === 'Paris') expect(hotels.map(({ id }) => id)).not.toContain(2);
  if (city === 'Rome') expect(hotels.map(({ id }) => id)).not.toContain(4);
});

When(/^I send GET request to \/api\/hotels\?city=Paris&min_price=100&max_price=300$/, async function (this: ApiWorld) {
  this.response = await requestFor(this).get('/api/hotels?city=Paris&min_price=100&max_price=300');
});

Then('response should only include hotels with price between 100 and 300', async function (this: ApiWorld) {
  const hotels = await bodyOf<Hotel[]>(this);
  expect(Array.isArray(hotels)).toBe(true);
  expect(hotels.length).toBeGreaterThan(0);
  for (const hotel of hotels) {
    expectHotelShape(hotel);
    expect(hotel.city).toBe('Paris');
    expect(hotel.currency).toBe('EUR');
    expect(hotel.price).toBeGreaterThanOrEqual(100);
    expect(hotel.price).toBeLessThanOrEqual(300);
  }
});

When(/^I send GET request to \/api\/hotels\?city=Paris&currency=([^&\s]+)$/, async function (this: ApiWorld, currency: string) {
  this.response = await requestFor(this).get(`/api/hotels?city=Paris&currency=${encodeURIComponent(currency)}`);
});

Then('all hotel prices should be in {string}', async function (this: ApiWorld, symbol: string) {
  const hotels = await bodyOf<Hotel[]>(this);
  const currencyBySymbol: Record<string, string> = { '$': 'USD', '€': 'EUR', '£': 'GBP' };
  const firstHotelPriceByCurrency: Record<string, number> = { USD: 198.08, EUR: 180.07, GBP: 153.06 };
  expect(hotels.length).toBeGreaterThan(0);
  expect(currencyBySymbol[symbol]).toBeDefined();
  for (const hotel of hotels) {
    expectHotelShape(hotel);
    expect(hotel.currency_symbol).toBe(symbol);
    expect(hotel.currency).toBe(currencyBySymbol[symbol]);
    expect(hotel.price).toBeGreaterThan(0);
  }
  expect(hotels.find(({ id }) => id === 1)?.price).toBe(firstHotelPriceByCurrency[currencyBySymbol[symbol]]);
});

// Wishlist
Given('hotel 123 is in the wishlist for this scenario', async function (this: ApiWorld) {
  const setupResponse = await requestFor(this).post('/api/wishlist', { data: { hotel_id: 123 } });
  expect(setupResponse.status()).toBe(200);
  this.wishlistHotelIds.add(123);
  expect(await setupResponse.json()).toEqual({ wishlist: [123] });
});

When(/^I send POST request to \/api\/wishlist with hotel_id=123$/, async function (this: ApiWorld) {
  this.response = await requestFor(this).post('/api/wishlist', { data: { hotel_id: 123 } });
  if (this.response.status() === 200) this.wishlistHotelIds.add(123);
});

Then('wishlist should contain hotel 123', async function (this: ApiWorld) {
  const body = await bodyOf<{ wishlist: unknown }>(this);
  expect(Array.isArray(body.wishlist)).toBe(true);
  expect(body.wishlist).toEqual([123]);
});

When(/^I send DELETE request to \/api\/wishlist\/123$/, async function (this: ApiWorld) {
  this.response = await requestFor(this).delete('/api/wishlist/123');
  if (this.response.status() === 200) this.wishlistHotelIds.delete(123);
});

Then('hotel 123 should no longer be in the wishlist', async function (this: ApiWorld) {
  const body = await bodyOf<{ wishlist: unknown }>(this);
  expect(Array.isArray(body.wishlist)).toBe(true);
  expect(body.wishlist).toEqual([]);
});

// Hotel details and review list
When(/^I send GET request to \/api\/hotel\/321$/, async function (this: ApiWorld) {
  this.response = await requestFor(this).get('/api/hotel/321');
});

Then('response should contain hotel name, rating and address', async function (this: ApiWorld) {
  const hotel = await bodyOf<Record<string, unknown>>(this);
  expect(hotel.id).toBe(321);
  expect(hotel.name).toBe('Grand Booking Hotel Amsterdam');
  expect(hotel.rating).toBe(4.8);
  expect(hotel.address).toBe('100 Main Boulevard, Amsterdam');
  expectNonEmptyString(hotel.description, 'hotel.description');
  expect(Array.isArray(hotel.amenities)).toBe(true);
  expect((hotel.amenities as unknown[]).length).toBeGreaterThan(0);
});

When(/^I send GET request to \/api\/hotel\/321\/reviews$/, async function (this: ApiWorld) {
  this.response = await requestFor(this).get('/api/hotel/321/reviews');
});

Then('response should contain list of reviews with user names and ratings', async function (this: ApiWorld) {
  const reviews = await bodyOf<Review[]>(this);
  expect(Array.isArray(reviews)).toBe(true);
  expect(reviews).toHaveLength(3);
  expect(reviews.map(({ id }) => id)).toEqual([1, 2, 3]);
  for (const review of reviews) expectReviewShape(review);
});

// Review CRUD
When(
  /^I send POST request to \/api\/hotel\/(\d+)\/reviews with rating "([^"]+)" and comment "([^"]*)"$/,
  async function (this: ApiWorld, hotelIdText: string, rating: string, comment: string) {
    const hotelId = Number(hotelIdText);
    this.response = await requestFor(this).post(`/api/hotel/${hotelId}/reviews`, {
      data: { rating: Number(rating), comment },
    });
    await captureCreatedReview(this, hotelId);
  },
);

When(
  /^I send POST request to \/api\/hotel\/(\d+)\/reviews with rating "([^"]+)" and a comment of (\d+) characters$/,
  async function (this: ApiWorld, hotelIdText: string, rating: string, characterCount: string) {
    const hotelId = Number(hotelIdText);
    this.response = await requestFor(this).post(`/api/hotel/${hotelId}/reviews`, {
      data: { rating: Number(rating), comment: 'x'.repeat(Number(characterCount)) },
    });
    await captureCreatedReview(this, hotelId);
  },
);

Then('the response field {string} should equal {string}', async function (this: ApiWorld, field: string, expected: string) {
  const body = await bodyOf<Record<string, unknown>>(this);
  expect(String(body[field])).toBe(expected);
});

When(/^I create a review for hotel (\d+) with rating (\d+) and comment "([^"]+)"$/, async function (this: ApiWorld, hotelIdText: string, rating: string, comment: string) {
  const hotelId = Number(hotelIdText);
  this.response = await requestFor(this).post(`/api/hotel/${hotelId}/reviews`, {
    data: { rating: Number(rating), comment },
  });
  await captureCreatedReview(this, hotelId);
});

Then('the response status should be {int}', async function (this: ApiWorld, status: number) {
  expect(responseFor(this).status()).toBe(status);
});

Then('the review should be created successfully', async function (this: ApiWorld) {
  expect(responseFor(this).status()).toBe(201);
  const review = await bodyOf<Review>(this);
  expectReviewShape(review, reviewHotelIdFor(this));
  expect(review.id).toBe(reviewIdFor(this));
});

Given('a review exists for hotel 321', async function (this: ApiWorld) {
  const setupResponse = await requestFor(this).post('/api/hotel/321/reviews', {
    data: { rating: 5, comment: 'Exceptional service and location' },
  });
  expect(setupResponse.status()).toBe(201);
  const review = await setupResponse.json() as Review;
  if (Number.isSafeInteger(review.id) && review.id > 0) this.trackReview(321, review.id);
  expectReviewShape(review);
});

Given('a review has been deleted for hotel 321', async function (this: ApiWorld) {
  const setupResponse = await requestFor(this).post('/api/hotel/321/reviews', {
    data: { rating: 4, comment: 'To be deleted' },
  });
  expect(setupResponse.status()).toBe(201);
  const review = await setupResponse.json() as Review;
  if (Number.isSafeInteger(review.id) && review.id > 0) this.trackReview(321, review.id);
  expectReviewShape(review);
  const deleteResponse = await requestFor(this).delete(`/api/hotel/321/reviews/${review.id}`);
  expect(deleteResponse.status()).toBe(204);
  this.forgetReview(review.id);
});

When('I retrieve the review by id', async function (this: ApiWorld) {
  this.response = await requestFor(this).get(`/api/hotel/${reviewHotelIdFor(this)}/reviews/${reviewIdFor(this)}`);
});

Then(/^the review should contain rating (\d+) and comment "([^"]+)"$/, async function (this: ApiWorld, rating: string, comment: string) {
  const review = await bodyOf<Review>(this);
  expectReviewShape(review, reviewHotelIdFor(this));
  expect(review.id).toBe(reviewIdFor(this));
  expect(review.rating).toBe(Number(rating));
  expect(review.comment).toBe(comment);
});

When(/^I update the review to rating (\d+) and comment "([^"]+)"$/, async function (this: ApiWorld, rating: string, comment: string) {
  this.response = await requestFor(this).put(`/api/hotel/${reviewHotelIdFor(this)}/reviews/${reviewIdFor(this)}`, {
    data: { rating: Number(rating), comment },
  });
});

When(/^I update review (\d+) for hotel (\d+) to rating (\d+) and comment "([^"]+)"$/, async function (this: ApiWorld, reviewId: string, hotelId: string, rating: string, comment: string) {
  this.response = await requestFor(this).put(`/api/hotel/${hotelId}/reviews/${reviewId}`, {
    data: { rating: Number(rating), comment },
  });
});

When('I delete the review', async function (this: ApiWorld) {
  const reviewId = reviewIdFor(this);
  this.response = await requestFor(this).delete(`/api/hotel/${reviewHotelIdFor(this)}/reviews/${reviewId}`);
  if (this.response.status() === 204) this.forgetReview(reviewId);
});
