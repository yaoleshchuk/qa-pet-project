#!/usr/bin/env node
'use strict';

/**
 * Mock API Server — Booking.com test double
 *
 * Simulates the Booking.com REST API so that Playwright/Cucumber API tests
 * can run headlessly against a controlled in-memory backend, producing
 * deterministic, CI-friendly results.
 *
 * Endpoints:
 *   POST   /api/login
 *   GET    /api/hotels
 *   POST   /api/wishlist
 *   DELETE /api/wishlist/:id
 *   GET    /api/hotel/:id
 *   GET    /api/hotel/:id/reviews
 *   POST   /api/hotel/:id/reviews
 *   GET    /api/hotel/:id/reviews/:reviewId
 *   PUT    /api/hotel/:id/reviews/:reviewId
 *   DELETE /api/hotel/:id/reviews/:reviewId
 *   GET    /health
 */

const express = require('express');

const app = express();
const PORT = process.env.MOCK_PORT || 3001;

app.use(express.json());

// ─── Seed data ────────────────────────────────────────────────────────────────

const VALID_CREDENTIALS = [
  { email: 'user1@mail.com',       password: 'password123' },
  { email: 'tester@booking.com',   password: 'secretpass'  },
  { email: 'testuser@example.com', password: 'correct_password' },
];

const CURRENCY_SYMBOLS = { USD: '$', EUR: '€', GBP: '£' };

const BASE_HOTELS = [
  // Paris
  { id: 1,  city: 'Paris',     name: 'Hotel Le Marais',          stars: 4, rating: 4.6, price: 180, address: '10 Rue de Rivoli, Paris',           amenities: ['WiFi', 'Breakfast', 'Gym'] },
  { id: 2,  city: 'Paris',     name: 'Eiffel Boutique Hotel',    stars: 5, rating: 4.9, price: 250, address: '25 Quai Branly, Paris',              amenities: ['WiFi', 'Pool', 'Spa'] },
  { id: 3,  city: 'Paris',     name: 'Montmartre Garden Inn',    stars: 3, rating: 4.1, price: 120, address: '18 Rue Lepic, Paris',                amenities: ['WiFi', 'Breakfast'] },
  // Rome
  { id: 4,  city: 'Rome',      name: 'Colosseum Grand Hotel',    stars: 5, rating: 4.8, price: 290, address: 'Via Sacra 5, Rome',                  amenities: ['WiFi', 'Pool', 'Breakfast', 'Spa'] },
  { id: 5,  city: 'Rome',      name: 'Trastevere Boutique',      stars: 3, rating: 4.2, price: 135, address: 'Via della Lungaretta 9, Rome',        amenities: ['WiFi', 'Breakfast'] },
  // Bangkok
  { id: 6,  city: 'Bangkok',   name: 'Sukhumvit Skyline Hotel',  stars: 5, rating: 4.7, price: 195, address: '88 Sukhumvit Rd, Bangkok',           amenities: ['WiFi', 'Pool', 'Gym'] },
  { id: 7,  city: 'Bangkok',   name: 'Khao San Palace',          stars: 3, rating: 4.0, price: 75,  address: '22 Khao San Rd, Bangkok',            amenities: ['WiFi'] },
  // New York
  { id: 8,  city: 'New York',  name: 'Manhattan Grand',          stars: 5, rating: 4.8, price: 320, address: '350 5th Ave, New York',              amenities: ['WiFi', 'Gym', 'Spa'] },
  { id: 9,  city: 'New York',  name: 'Brooklyn Loft Hotel',      stars: 3, rating: 4.1, price: 140, address: '88 Smith St, Brooklyn',              amenities: ['WiFi', 'Breakfast'] },
  // Tokyo
  { id: 10, city: 'Tokyo',     name: 'Shinjuku Palace',          stars: 5, rating: 4.9, price: 280, address: '1-2-3 Shinjuku, Tokyo',              amenities: ['WiFi', 'Onsen', 'Breakfast'] },
  { id: 11, city: 'Tokyo',     name: 'Akihabara Capsule Plus',   stars: 2, rating: 4.0, price: 65,  address: '5-6 Akihabara, Tokyo',               amenities: ['WiFi'] },
  // Barcelona
  { id: 12, city: 'Barcelona', name: 'Sagrada Suites',           stars: 5, rating: 4.7, price: 220, address: 'Passeig de Gràcia 42, Barcelona',    amenities: ['WiFi', 'Pool', 'Breakfast'] },
  { id: 13, city: 'Barcelona', name: 'Gothic Quarter Inn',       stars: 3, rating: 4.2, price: 110, address: 'Carrer del Bisbe 12, Barcelona',     amenities: ['WiFi', 'Breakfast'] },
  // London
  { id: 14, city: 'London',    name: 'Westminster Palace Hotel', stars: 5, rating: 4.8, price: 350, address: '14 Buckingham Gate, London',         amenities: ['WiFi', 'Gym', 'Restaurant'] },
  { id: 15, city: 'London',    name: 'Covent Garden Stay',       stars: 4, rating: 4.4, price: 195, address: '20 Long Acre, London',               amenities: ['WiFi', 'Breakfast'] },
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
  { id: 1, hotelId: 321, user: 'Alice Martin',  rating: 5, comment: 'Outstanding views and impeccable service.' },
  { id: 2, hotelId: 321, user: 'Bob Chen',       rating: 4, comment: 'Very comfortable stay, will return.'       },
  { id: 3, hotelId: 321, user: 'Sophie Müller',  rating: 5, comment: 'Best hotel I have stayed at in Amsterdam.' },
];

// ─── In-memory state (reset on server start) ──────────────────────────────────

let reviews = new Map(SEED_REVIEWS.map(r => [r.id, { ...r }]));
let nextReviewId = 100;
let wishlist = [];

// ─── Health check ─────────────────────────────────────────────────────────────

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── POST /api/login ──────────────────────────────────────────────────────────

app.post('/api/login', (req, res) => {
  const { email, password } = req.body || {};
  const match = VALID_CREDENTIALS.find(c => c.email === email && c.password === password);
  if (match) {
    return res.status(200).json({
      token: `mock-jwt-${Buffer.from(email).toString('base64')}`,
      user: { email, name: 'Test User' },
    });
  }
  return res.status(401).json({ error: 'Invalid credentials' });
});

// ─── GET /api/hotels ──────────────────────────────────────────────────────────
// Query params: city, checkin, checkout, min_price, max_price, currency

app.get('/api/hotels', (req, res) => {
  const { city, min_price, max_price, currency } = req.query;

  let results = [...BASE_HOTELS];

  if (city) {
    results = results.filter(h => h.city.toLowerCase() === city.toString().toLowerCase());
  }
  if (min_price !== undefined) {
    results = results.filter(h => h.price >= Number(min_price));
  }
  if (max_price !== undefined) {
    results = results.filter(h => h.price <= Number(max_price));
  }

  const currencyKey = currency ? currency.toString().toUpperCase() : 'EUR';
  const symbol = CURRENCY_SYMBOLS[currencyKey] || '€';
  results = results.map(h => ({ ...h, currency_symbol: symbol }));

  return res.status(200).json(results);
});

// ─── GET /api/hotel/:id ───────────────────────────────────────────────────────

app.get('/api/hotel/:id', (req, res) => {
  if (parseInt(req.params.id, 10) === 321) {
    return res.status(200).json(HOTEL_321);
  }
  return res.status(404).json({ error: 'Hotel not found' });
});

// ─── GET /api/hotel/:id/reviews ───────────────────────────────────────────────

app.get('/api/hotel/:id/reviews', (req, res) => {
  const hotelId = parseInt(req.params.id, 10);
  const list = [...reviews.values()].filter(r => r.hotelId === hotelId);
  return res.status(200).json(list);
});

// ─── POST /api/hotel/:id/reviews ─────────────────────────────────────────────

app.post('/api/hotel/:id/reviews', (req, res) => {
  const hotelId = parseInt(req.params.id, 10);
  const { rating, comment } = req.body || {};

  if (typeof rating !== 'number' || !Number.isInteger(rating) || rating < 1 || rating > 5) {
    return res.status(422).json({ error: 'Rating must be an integer between 1 and 5' });
  }

  const id = nextReviewId++;
  const review = { id, hotelId, user: 'Test User', rating, comment: comment || '' };
  reviews.set(id, review);
  return res.status(201).json(review);
});

// ─── GET /api/hotel/:id/reviews/:reviewId ─────────────────────────────────────

app.get('/api/hotel/:id/reviews/:reviewId', (req, res) => {
  const reviewId = parseInt(req.params.reviewId, 10);
  const review = reviews.get(reviewId);
  if (!review) {
    return res.status(404).json({ error: 'Review not found' });
  }
  return res.status(200).json(review);
});

// ─── PUT /api/hotel/:id/reviews/:reviewId ─────────────────────────────────────

app.put('/api/hotel/:id/reviews/:reviewId', (req, res) => {
  const reviewId = parseInt(req.params.reviewId, 10);
  const review = reviews.get(reviewId);
  if (!review) {
    return res.status(404).json({ error: 'Review not found' });
  }
  const { rating, comment } = req.body || {};
  const updated = {
    ...review,
    rating:  rating  !== undefined ? rating  : review.rating,
    comment: comment !== undefined ? comment : review.comment,
  };
  reviews.set(reviewId, updated);
  return res.status(200).json(updated);
});

// ─── DELETE /api/hotel/:id/reviews/:reviewId ──────────────────────────────────

app.delete('/api/hotel/:id/reviews/:reviewId', (req, res) => {
  const reviewId = parseInt(req.params.reviewId, 10);
  reviews.delete(reviewId);
  return res.status(204).send();
});

// ─── POST /api/wishlist ───────────────────────────────────────────────────────

app.post('/api/wishlist', (req, res) => {
  const { hotel_id } = req.body || {};
  if (hotel_id !== undefined && !wishlist.includes(hotel_id)) {
    wishlist.push(hotel_id);
  }
  return res.status(200).json({ wishlist: [...wishlist] });
});

// ─── DELETE /api/wishlist/:id ─────────────────────────────────────────────────

app.delete('/api/wishlist/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  wishlist = wishlist.filter(h => h !== id);
  return res.status(200).json({ wishlist: [...wishlist] });
});

// ─── Start ────────────────────────────────────────────────────────────────────

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Mock API server listening on http://0.0.0.0:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});
