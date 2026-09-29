'use strict';

const assert = require('node:assert/strict');
const { after, before, beforeEach, test } = require('node:test');
const { createApp } = require('../../mock-server/server');

let server;
let baseUrl;

async function request(path, options = {}) {
  const headers = { connection: 'close', ...(options.body === undefined ? {} : { 'content-type': 'application/json' }), ...options.headers };
  return fetch(`${baseUrl}${path}`, { ...options, headers });
}

async function json(response) {
  return response.json();
}

async function expectError(response, status, code) {
  assert.equal(response.status, status);
  const body = await json(response);
  assert.deepEqual(Object.keys(body), ['error']);
  assert.equal(body.error.code, code);
  assert.equal(typeof body.error.message, 'string');
  assert.ok(body.error.message.length > 0);
}

before(async () => {
  server = createApp().listen(0, '127.0.0.1');
  await new Promise((resolve, reject) => {
    server.once('listening', resolve);
    server.once('error', reject);
  });
  const address = server.address();
  baseUrl = `http://127.0.0.1:${address.port}`;
});

after(async () => {
  server.closeAllConnections();
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
});

beforeEach(async () => {
  const response = await request('/api/test/reset', { method: 'POST' });
  assert.equal(response.status, 204);
});

test('POST review creates a normalized resource at the documented boundaries', async () => {
  for (const [rating, comment] of [[1, ' x '], [5, 'x'.repeat(500)]]) {
    const response = await request('/api/hotel/321/reviews', {
      method: 'POST',
      body: JSON.stringify({ rating, comment }),
    });
    assert.equal(response.status, 201);
    const review = await json(response);
    assert.equal(review.hotelId, 321);
    assert.equal(review.rating, rating);
    assert.equal(review.comment, comment.trim());
    assert.equal(typeof review.id, 'number');
  }
});

test('review structure errors are 400 and semantic value errors are 422', async () => {
  await expectError(await request('/api/hotel/321/reviews', {
    method: 'POST', body: JSON.stringify({ rating: '5', comment: 'typed incorrectly' }),
  }), 400, 'INVALID_REVIEW');
  await expectError(await request('/api/hotel/321/reviews', {
    method: 'POST', body: JSON.stringify({ rating: 5 }),
  }), 400, 'INVALID_REVIEW');
  await expectError(await request('/api/hotel/321/reviews', {
    method: 'POST', body: JSON.stringify({ rating: 5, comment: 'valid', extra: true }),
  }), 400, 'INVALID_REVIEW');
  await expectError(await request('/api/hotel/321/reviews', {
    method: 'POST', body: JSON.stringify({ rating: 6, comment: 'out of range' }),
  }), 422, 'INVALID_REVIEW');
  await expectError(await request('/api/hotel/321/reviews', {
    method: 'POST', body: JSON.stringify({ rating: 4, comment: '   ' }),
  }), 422, 'INVALID_REVIEW');
  await expectError(await request('/api/hotel/321/reviews', {
    method: 'POST', body: JSON.stringify({ rating: 4, comment: 'x'.repeat(501) }),
  }), 422, 'INVALID_REVIEW');
});

test('malformed JSON is a 400 error with the common error envelope', async () => {
  await expectError(await request('/api/hotel/321/reviews', {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: '{broken',
  }), 400, 'INVALID_JSON');
});

test('PUT is partial, validates supplied fields, and does not mutate after rejection', async () => {
  const updatedResponse = await request('/api/hotel/321/reviews/1', {
    method: 'PUT', body: JSON.stringify({ rating: 3 }),
  });
  assert.equal(updatedResponse.status, 200);
  const updated = await json(updatedResponse);
  assert.equal(updated.rating, 3);
  assert.equal(updated.comment, 'Outstanding views and impeccable service.');

  await expectError(await request('/api/hotel/321/reviews/1', {
    method: 'PUT', body: JSON.stringify({ comment: '' }),
  }), 422, 'INVALID_REVIEW');
  await expectError(await request('/api/hotel/321/reviews/1', {
    method: 'PUT', body: JSON.stringify({ rating: 1.5 }),
  }), 400, 'INVALID_REVIEW');
  await expectError(await request('/api/hotel/321/reviews/1', {
    method: 'PUT', body: JSON.stringify({ rating: 0 }),
  }), 422, 'INVALID_REVIEW');
  await expectError(await request('/api/hotel/321/reviews/1', {
    method: 'PUT', body: JSON.stringify({}),
  }), 400, 'INVALID_REVIEW');

  const stored = await json(await request('/api/hotel/321/reviews/1'));
  assert.equal(stored.rating, 3);
  assert.equal(stored.comment, 'Outstanding views and impeccable service.');
});

test('review routes require an existing hotel and enforce review ownership', async () => {
  await expectError(await request('/api/hotel/999/reviews', {
    method: 'POST', body: JSON.stringify({ rating: 5, comment: 'valid body' }),
  }), 404, 'HOTEL_NOT_FOUND');

  const createdResponse = await request('/api/hotel/1/reviews', {
    method: 'POST', body: JSON.stringify({ rating: 5, comment: 'Paris review' }),
  });
  assert.equal(createdResponse.status, 201);
  const created = await json(createdResponse);
  await expectError(await request(`/api/hotel/321/reviews/${created.id}`), 404, 'REVIEW_NOT_FOUND');
  await expectError(await request(`/api/hotel/321/reviews/${created.id}`, {
    method: 'PUT', body: JSON.stringify({ rating: 4 }),
  }), 404, 'REVIEW_NOT_FOUND');
  await expectError(await request(`/api/hotel/321/reviews/${created.id}`, {
    method: 'DELETE',
  }), 404, 'REVIEW_NOT_FOUND');
  const ownedReview = await json(await request(`/api/hotel/1/reviews/${created.id}`));
  assert.equal(ownedReview.comment, 'Paris review');
  await expectError(await request('/api/hotel/not-an-id/reviews'), 400, 'INVALID_ID');
  await expectError(await request('/api/hotel/321/reviews/not-an-id'), 400, 'INVALID_ID');
});

test('DELETE is successful once and repeated DELETE returns 404', async () => {
  assert.equal((await request('/api/hotel/321/reviews/1', { method: 'DELETE' })).status, 204);
  await expectError(await request('/api/hotel/321/reviews/1', { method: 'DELETE' }), 404, 'REVIEW_NOT_FOUND');
});

test('date validation distinguishes malformed input from an invalid stay', async () => {
  await expectError(await request('/api/hotels?checkin=2026-02-30&checkout=2026-03-02'), 400, 'INVALID_DATES');
  await expectError(await request('/api/hotels?checkin=2026-07-01'), 400, 'INVALID_DATES');
  await expectError(await request('/api/hotels?checkin=2026-07-05&checkout=2026-07-01'), 422, 'INVALID_STAY');
});

test('availability removes only hotels whose blocked stay overlaps the requested interval', async () => {
  const allParis = await json(await request('/api/hotels?city=Paris'));
  const blockedDates = await json(await request('/api/hotels?city=Paris&checkin=2026-07-02&checkout=2026-07-04'));
  const adjacentDates = await json(await request('/api/hotels?city=Paris&checkin=2026-07-05&checkout=2026-07-06'));
  assert.deepEqual(allParis.map(({ id }) => id), [1, 2, 3]);
  assert.deepEqual(blockedDates.map(({ id }) => id), [1, 3]);
  assert.deepEqual(adjacentDates.map(({ id }) => id), [1, 2, 3]);
});

test('fixed rates recalculate numeric prices and price filters use requested currency', async () => {
  const eur = await json(await request('/api/hotels?city=Paris&currency=EUR'));
  const usd = await json(await request('/api/hotels?city=Paris&currency=USD'));
  const gbp = await json(await request('/api/hotels?city=Paris&currency=GBP'));
  assert.equal(eur[0].price, 180.07);
  assert.equal(usd[0].price, 198.08);
  assert.equal(gbp[0].price, 153.06);
  assert.equal(usd[0].currency, 'USD');
  assert.equal(usd[0].currency_symbol, '$');

  const filtered = await json(await request('/api/hotels?city=Paris&currency=USD&min_price=190&max_price=200'));
  assert.deepEqual(filtered.map(({ id }) => id), [1]);
  await expectError(await request('/api/hotels?min_price=not-a-number'), 400, 'INVALID_PRICE');
  await expectError(await request('/api/hotels?min_price=200&max_price=100'), 422, 'INVALID_PRICE_RANGE');
  await expectError(await request('/api/hotels?currency=CAD'), 400, 'UNSUPPORTED_CURRENCY');
  await expectError(await request('/api/hotels?currency=usd'), 400, 'UNSUPPORTED_CURRENCY');
});

test('reset restores seed reviews, wishlist, and deterministic review ids', async () => {
  const emptyWishlist = await json(await request('/api/wishlist'));
  assert.deepEqual(emptyWishlist.wishlist, []);
  const wishlistBeforeReset = await json(await request('/api/wishlist', {
    method: 'POST', body: JSON.stringify({ hotel_id: 123 }),
  }));
  assert.deepEqual(wishlistBeforeReset.wishlist, [123]);
  assert.deepEqual((await json(await request('/api/wishlist'))).wishlist, [123]);
  assert.equal((await request('/api/hotel/321/reviews/1', { method: 'DELETE' })).status, 204);
  const firstCreated = await json(await request('/api/hotel/321/reviews', {
    method: 'POST', body: JSON.stringify({ rating: 4, comment: 'temporary' }),
  }));
  assert.equal(firstCreated.id, 100);

  assert.equal((await request('/api/test/reset', { method: 'POST' })).status, 204);
  const seed = await json(await request('/api/hotel/321/reviews/1'));
  assert.equal(seed.user, 'Alice Martin');
  const wishlistAfterReset = await json(await request('/api/wishlist', {
    method: 'POST', body: JSON.stringify({ hotel_id: 456 }),
  }));
  assert.deepEqual(wishlistAfterReset.wishlist, [456]);
  assert.deepEqual((await json(await request('/api/wishlist'))).wishlist, [456]);
  const createdAfterReset = await json(await request('/api/hotel/321/reviews', {
    method: 'POST', body: JSON.stringify({ rating: 4, comment: 'after reset' }),
  }));
  assert.equal(createdAfterReset.id, 100);
});
