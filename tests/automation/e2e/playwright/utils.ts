import * as dotenv from 'dotenv';
dotenv.config();

export const baseUrl = process.env.BASE_URL || 'https://booking.com';
export const email = process.env.TEST_EMAIL || 'test@example.com';
export const password = process.env.TEST_PASSWORD || '12345678';
