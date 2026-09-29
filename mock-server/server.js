#!/usr/bin/env node
'use strict';

const express = require('express');
const path = require('path');

const DEFAULT_PORT = 3001;
const CURRENCY_RATES = Object.freeze({ EUR: 1, USD: 1.1, GBP: 0.85 });
const CURRENCY_SYMBOLS = Object.freeze({ EUR: '€', USD: '$', GBP: '£' });

const VALID_CREDENTIALS = [
  { email: 'user1@mail.com', password: 'password123' },
  { email: 'tester@booking.com', password: 'secretpass' },
  { email: 'testuser@example.com', password: 'correct_password' },
];

const BASE_HOTELS = [
  { id: 1, city: 'Paris', name: 'Hotel Le Marais', stars: 4, rating: 4.6, price: 180.07, address: '10 Rue de Rivoli, Paris', amenities: ['WiFi', 'Breakfast', 'Gym'] },
  { id: 2, city: 'Paris', name: 'Eiffel Boutique Hotel', stars: 5, rating: 4.9, price: 250, address: '25 Quai Branly, Paris', amenities: ['WiFi', 'Pool', 'Spa'] },
  { id: 3, city: 'Paris', name: 'Montmartre Garden Inn', stars: 3, rating: 4.1, price: 120, address: '18 Rue Lepic, Paris', amenities: ['WiFi', 'Breakfast'] },
  { id: 4, city: 'Rome', name: 'Colosseum Grand Hotel', stars: 5, rating: 4.8, price: 290, address: 'Via Sacra 5, Rome', amenities: ['WiFi', 'Pool', 'Breakfast', 'Spa'] },
  { id: 5, city: 'Rome', name: 'Trastevere Boutique', stars: 3, rating: 4.2, price: 135, address: 'Via della Lungaretta 9, Rome', amenities: ['WiFi', 'Breakfast'] },
  { id: 6, city: 'Bangkok', name: 'Sukhumvit Skyline Hotel', stars: 5, rating: 4.7, price: 195, address: '88 Sukhumvit Rd, Bangkok', amenities: ['WiFi', 'Pool', 'Gym'] },
  { id: 7, city: 'Bangkok', name: 'Khao San Palace', stars: 3, rating: 4.0, price: 75, address: '22 Khao San Rd, Bangkok', amenities: ['WiFi'] },
  { id: 8, city: 'New York', name: 'Manhattan Grand', stars: 5, rating: 4.8, price: 320, address: '350 5th Ave, New York', amenities: ['WiFi', 'Gym', 'Spa'] },
  { id: 9, city: 'New York', name: 'Brooklyn Loft Hotel', stars: 3, rating: 4.1, price: 140, address: '88 Smith St, Brooklyn', amenities: ['WiFi', 'Breakfast'] },
  { id: 10, city: 'Tokyo', name: 'Shinjuku Palace', stars: 5, rating: 4.9, price: 280, address: '1-2-3 Shinjuku, Tokyo', amenities: ['WiFi', 'Onsen', 'Breakfast'] },
  { id: 11, city: 'Tokyo', name: 'Akihabara Capsule Plus', stars: 2, rating: 4.0, price: 65, address: '5-6 Akihabara, Tokyo', amenities: ['WiFi'] },
  { id: 12, city: 'Barcelona', name: 'Sagrada Suites', stars: 5, rating: 4.7, price: 220, address: 'Passeig de Gràcia 42, Barcelona', amenities: ['WiFi', 'Pool', 'Breakfast'] },
  { id: 13, city: 'Barcelona', name: 'Gothic Quarter Inn', stars: 3, rating: 4.2, price: 110, address: 'Carrer del Bisbe 12, Barcelona', amenities: ['WiFi', 'Breakfast'] },
  { id: 14, city: 'London', name: 'Westminster Palace Hotel', stars: 5, rating: 4.8, price: 350, address: '14 Buckingham Gate, London', amenities: ['WiFi', 'Gym', 'Restaurant'] },
  { id: 15, city: 'London', name: 'Covent Garden Stay', stars: 4, rating: 4.4, price: 195, address: '20 Long Acre, London', amenities: ['WiFi', 'Breakfast'] },
];

const HOTEL_321 = {
  id: 321,
  city: 'Amsterdam',
  name: 'Grand Booking Hotel Amsterdam',
  stars: 5,
  rating: 4.8,
  address: '100 Main Boulevard, Amsterdam',
  description: 'A flagship property in the heart of Amsterdam with panoramic canal views.',
  amenities: ['WiFi', 'Pool', 'Spa', 'Gym', 'Restaurant', 'Concierge'],
};

const SEED_REVIEWS = [
  { id: 1, hotelId: 321, user: 'Alice Martin', rating: 5, comment: 'Outstanding views and impeccable service.' },
  { id: 2, hotelId: 321, user: 'Bob Chen', rating: 4, comment: 'Very comfortable stay, will return.' },
  { id: 3, hotelId: 321, user: 'Sophie Müller', rating: 5, comment: 'Best hotel I have stayed at in Amsterdam.' },
];

// Half-open stay intervals: checkout on the blocked checkout date is available.
const UNAVAILABLE_STAYS = Object.freeze([
  { hotelId: 2, checkin: '2026-07-01', checkout: '2026-07-05' },
  { hotelId: 4, checkin: '2026-08-10', checkout: '2026-08-15' },
]);

const HOTEL_BY_ID = new Map([...BASE_HOTELS, HOTEL_321].map((hotel) => [hotel.id, hotel]));

function apiError(res, status, code, message, details) {
  const error = { code, message };
  if (details !== undefined) error.details = details;
  return res.status(status).json({ error });
}

function parsePositiveId(value) {
  if (!/^\d+$/.test(value)) return undefined;
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : undefined;
}

function parseIsoDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return undefined;
  return date;
}

function intervalsOverlap(checkin, checkout, blockedCheckin, blockedCheckout) {
  return checkin < blockedCheckout && checkout > blockedCheckin;
}

function normalizeReviewBody(body, partial) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { structural: 'Request body must be a JSON object' };
  }
  const allowed = new Set(['rating', 'comment']);
  const unknown = Object.keys(body).filter((key) => !allowed.has(key));
  if (unknown.length > 0) return { structural: `Unknown fields: ${unknown.join(', ')}` };
  if (!partial && (!Object.hasOwn(body, 'rating') || !Object.hasOwn(body, 'comment'))) {
    return { structural: 'Both rating and comment are required' };
  }
  if (partial && !Object.hasOwn(body, 'rating') && !Object.hasOwn(body, 'comment')) {
    return { structural: 'At least one of rating or comment is required' };
  }
  if (Object.hasOwn(body, 'rating') && (typeof body.rating !== 'number' || !Number.isInteger(body.rating))) {
    return { structural: 'Rating must be an integer' };
  }
  if (Object.hasOwn(body, 'comment') && typeof body.comment !== 'string') {
    return { structural: 'Comment must be a string' };
  }
  if (Object.hasOwn(body, 'rating') && (body.rating < 1 || body.rating > 5)) {
    return { semantic: 'Rating must be between 1 and 5' };
  }
  let normalizedComment;
  if (Object.hasOwn(body, 'comment')) {
    normalizedComment = body.comment.trim();
    const length = Array.from(normalizedComment).length;
    if (length < 1 || length > 500) {
      return { semantic: 'Comment must contain between 1 and 500 non-whitespace characters' };
    }
  }
  return {
    value: {
      ...(Object.hasOwn(body, 'rating') ? { rating: body.rating } : {}),
      ...(Object.hasOwn(body, 'comment') ? { comment: normalizedComment } : {}),
    },
  };
}

function createApp() {
  const app = express();
  app.use(express.json());

  let reviews;
  let nextReviewId;
  let wishlist;

  function resetState() {
    reviews = new Map(SEED_REVIEWS.map((review) => [review.id, { ...review }]));
    nextReviewId = 100;
    wishlist = [];
  }
  resetState();

  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.post('/api/test/reset', (_req, res) => {
    resetState();
    res.status(204).send();
  });

  app.post('/api/login', (req, res) => {
    if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)
      || typeof req.body.email !== 'string' || typeof req.body.password !== 'string') {
      return apiError(res, 400, 'INVALID_CREDENTIALS_REQUEST', 'email and password must be strings');
    }
    const { email, password } = req.body || {};
    const match = VALID_CREDENTIALS.find((credential) => credential.email === email && credential.password === password);
    if (!match) return apiError(res, 401, 'INVALID_CREDENTIALS', 'Invalid credentials');
    return res.status(200).json({
      token: `mock-jwt-${Buffer.from(email).toString('base64')}`,
      user: { email, name: 'Test User' },
    });
  });

  app.get('/api/hotels', (req, res) => {
    const { city, checkin, checkout, min_price: minPriceRaw, max_price: maxPriceRaw, currency: currencyRaw } = req.query;
    if (Object.values({ city, checkin, checkout, minPriceRaw, maxPriceRaw, currencyRaw }).some(Array.isArray)) {
      return apiError(res, 400, 'INVALID_QUERY', 'Query parameters must not be repeated');
    }
    if ((checkin === undefined) !== (checkout === undefined)) {
      return apiError(res, 400, 'INVALID_DATES', 'checkin and checkout must be provided together');
    }

    let checkinDate;
    let checkoutDate;
    if (checkin !== undefined && checkout !== undefined) {
      checkinDate = parseIsoDate(checkin);
      checkoutDate = parseIsoDate(checkout);
      if (!checkinDate || !checkoutDate) {
        return apiError(res, 400, 'INVALID_DATES', 'Dates must be real calendar dates in YYYY-MM-DD format');
      }
      if (checkoutDate <= checkinDate) {
        return apiError(res, 422, 'INVALID_STAY', 'checkout must be later than checkin');
      }
    }

    const currency = currencyRaw === undefined ? 'EUR' : String(currencyRaw);
    if (!Object.hasOwn(CURRENCY_RATES, currency)) {
      return apiError(res, 400, 'UNSUPPORTED_CURRENCY', 'currency must be one of EUR, USD, GBP');
    }

    function parsePrice(value, name) {
      if (value === undefined) return { value: undefined };
      if (typeof value !== 'string' || value.trim() === '' || !Number.isFinite(Number(value)) || Number(value) < 0) {
        return { error: `${name} must be a non-negative number` };
      }
      return { value: Number(value) };
    }

    const parsedMin = parsePrice(minPriceRaw, 'min_price');
    const parsedMax = parsePrice(maxPriceRaw, 'max_price');
    if (parsedMin.error || parsedMax.error) {
      return apiError(res, 400, 'INVALID_PRICE', parsedMin.error || parsedMax.error);
    }
    if (parsedMin.value !== undefined && parsedMax.value !== undefined && parsedMin.value > parsedMax.value) {
      return apiError(res, 422, 'INVALID_PRICE_RANGE', 'min_price must not exceed max_price');
    }

    let results = [...BASE_HOTELS];
    if (city !== undefined) {
      results = results.filter((hotel) => hotel.city.toLowerCase() === String(city).toLowerCase());
    }
    if (checkinDate && checkoutDate) {
      results = results.filter((hotel) => !UNAVAILABLE_STAYS.some((stay) =>
        stay.hotelId === hotel.id && intervalsOverlap(checkinDate, checkoutDate, parseIsoDate(stay.checkin), parseIsoDate(stay.checkout))
      ));
    }

    const rate = CURRENCY_RATES[currency];
    results = results
      .map((hotel) => ({
        ...hotel,
        price: Math.round(hotel.price * rate * 100) / 100,
        currency,
        currency_symbol: CURRENCY_SYMBOLS[currency],
      }))
      .filter((hotel) => parsedMin.value === undefined || hotel.price >= parsedMin.value)
      .filter((hotel) => parsedMax.value === undefined || hotel.price <= parsedMax.value);

    return res.status(200).json(results);
  });

  app.get('/api/hotel/:id', (req, res) => {
    const hotelId = parsePositiveId(req.params.id);
    if (!hotelId) return apiError(res, 400, 'INVALID_ID', 'Hotel id must be a positive integer');
    const hotel = HOTEL_BY_ID.get(hotelId);
    if (!hotel) return apiError(res, 404, 'HOTEL_NOT_FOUND', 'Hotel not found');
    return res.status(200).json(hotel);
  });

  app.get('/api/hotel/:id/reviews', (req, res) => {
    const hotelId = parsePositiveId(req.params.id);
    if (!hotelId) return apiError(res, 400, 'INVALID_ID', 'Hotel id must be a positive integer');
    if (!HOTEL_BY_ID.has(hotelId)) return apiError(res, 404, 'HOTEL_NOT_FOUND', 'Hotel not found');
    return res.status(200).json([...reviews.values()].filter((review) => review.hotelId === hotelId));
  });

  app.post('/api/hotel/:id/reviews', (req, res) => {
    const hotelId = parsePositiveId(req.params.id);
    if (!hotelId) return apiError(res, 400, 'INVALID_ID', 'Hotel id must be a positive integer');
    if (!HOTEL_BY_ID.has(hotelId)) return apiError(res, 404, 'HOTEL_NOT_FOUND', 'Hotel not found');
    const validation = normalizeReviewBody(req.body, false);
    if (validation.structural) return apiError(res, 400, 'INVALID_REVIEW', validation.structural);
    if (validation.semantic) return apiError(res, 422, 'INVALID_REVIEW', validation.semantic);
    const review = { id: nextReviewId++, hotelId, user: 'Test User', ...validation.value };
    reviews.set(review.id, review);
    return res.status(201).json(review);
  });

  function findOwnedReview(req, res) {
    const hotelId = parsePositiveId(req.params.id);
    const reviewId = parsePositiveId(req.params.reviewId);
    if (!hotelId || !reviewId) {
      apiError(res, 400, 'INVALID_ID', 'Hotel and review ids must be positive integers');
      return undefined;
    }
    if (!HOTEL_BY_ID.has(hotelId)) {
      apiError(res, 404, 'HOTEL_NOT_FOUND', 'Hotel not found');
      return undefined;
    }
    const review = reviews.get(reviewId);
    if (!review || review.hotelId !== hotelId) {
      apiError(res, 404, 'REVIEW_NOT_FOUND', 'Review not found for this hotel');
      return undefined;
    }
    return review;
  }

  app.get('/api/hotel/:id/reviews/:reviewId', (req, res) => {
    const review = findOwnedReview(req, res);
    if (!review) return;
    return res.status(200).json(review);
  });

  app.put('/api/hotel/:id/reviews/:reviewId', (req, res) => {
    const review = findOwnedReview(req, res);
    if (!review) return;
    const validation = normalizeReviewBody(req.body, true);
    if (validation.structural) return apiError(res, 400, 'INVALID_REVIEW', validation.structural);
    if (validation.semantic) return apiError(res, 422, 'INVALID_REVIEW', validation.semantic);
    const updated = { ...review, ...validation.value };
    reviews.set(review.id, updated);
    return res.status(200).json(updated);
  });

  app.delete('/api/hotel/:id/reviews/:reviewId', (req, res) => {
    const review = findOwnedReview(req, res);
    if (!review) return;
    reviews.delete(review.id);
    return res.status(204).send();
  });

  app.post('/api/wishlist', (req, res) => {
    const { hotel_id: hotelId } = req.body || {};
    if (!Number.isSafeInteger(hotelId) || hotelId <= 0) {
      return apiError(res, 400, 'INVALID_ID', 'hotel_id must be a positive integer');
    }
    if (!wishlist.includes(hotelId)) wishlist.push(hotelId);
    return res.status(200).json({ wishlist: [...wishlist] });
  });

  app.get('/api/wishlist', (_req, res) => res.status(200).json({ wishlist: [...wishlist] }));

  app.delete('/api/wishlist/:id', (req, res) => {
    const id = parsePositiveId(req.params.id);
    if (!id) return apiError(res, 400, 'INVALID_ID', 'Hotel id must be a positive integer');
    wishlist = wishlist.filter((hotelId) => hotelId !== id);
    return res.status(200).json({ wishlist: [...wishlist] });
  });

  // The teaching UI deliberately shares this origin with the mock API.  This
  // keeps the browser exercise fully local and avoids a second development
  // server, CORS configuration, or an external Booking.com dependency.
  const uiDirectory = path.join(__dirname, '..', 'ui');
  app.use(express.static(uiDirectory));
  app.get(['/', '/searchresults.html', '/login', '/account', '/favorites', '/contact'], (_req, res) => {
    res.sendFile(path.join(uiDirectory, 'index.html'));
  });

  app.use((req, res) => apiError(res, 404, 'ROUTE_NOT_FOUND', 'Route not found'));
  app.use((error, _req, res, next) => {
    if (error?.type === 'entity.parse.failed') {
      return apiError(res, 400, 'INVALID_JSON', 'Request body must contain valid JSON');
    }
    return next(error);
  });

  return app;
}

if (require.main === module) {
  const port = Number(process.env.MOCK_PORT || DEFAULT_PORT);
  createApp().listen(port, '0.0.0.0', () => {
    console.log(`Mock API server listening on http://0.0.0.0:${port}`);
    console.log(`Health check: http://localhost:${port}/health`);
  });
}

module.exports = { createApp };
