import {
  After,
  Before,
  type IWorldOptions,
  Status,
  World,
  setDefaultTimeout,
  setWorldConstructor,
} from '@cucumber/cucumber';
import { request as playwrightRequest, type APIRequestContext, type APIResponse } from '@playwright/test';
import * as dotenv from 'dotenv';

dotenv.config();
setDefaultTimeout(15 * 1000);

export interface CreatedReview {
  hotelId: number;
  reviewId: number;
}

export class ApiWorld extends World {
  request?: APIRequestContext;
  response?: APIResponse;
  reviewId?: number;
  reviewHotelId?: number;
  readonly createdReviews = new Map<number, CreatedReview>();
  readonly wishlistHotelIds = new Set<number>();

  constructor(options: IWorldOptions) {
    super(options);
  }

  trackReview(hotelId: number, reviewId: number): void {
    this.createdReviews.set(reviewId, { hotelId, reviewId });
    this.reviewHotelId = hotelId;
    this.reviewId = reviewId;
  }

  forgetReview(reviewId: number): void {
    this.createdReviews.delete(reviewId);
  }
}

setWorldConstructor(ApiWorld);

Before(async function (this: ApiWorld) {
  this.request = await playwrightRequest.newContext({
    baseURL: process.env.API_URL || 'http://localhost:3001',
    extraHTTPHeaders: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  });
});

After(async function (this: ApiWorld, { result, pickle }) {
  const cleanupFailures: string[] = [];
  const apiRequest = this.request;

  if (apiRequest) {
    for (const { hotelId, reviewId } of [...this.createdReviews.values()].reverse()) {
      try {
        const cleanupResponse = await apiRequest.delete(`/api/hotel/${hotelId}/reviews/${reviewId}`);
        if (cleanupResponse.status() !== 204) {
          cleanupFailures.push(`review ${reviewId}: expected cleanup status 204, got ${cleanupResponse.status()}`);
        }
      } catch (error) {
        cleanupFailures.push(`review ${reviewId}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    for (const hotelId of this.wishlistHotelIds) {
      try {
        const cleanupResponse = await apiRequest.delete(`/api/wishlist/${hotelId}`);
        if (cleanupResponse.status() !== 200) {
          cleanupFailures.push(`wishlist hotel ${hotelId}: expected cleanup status 200, got ${cleanupResponse.status()}`);
        }
      } catch (error) {
        cleanupFailures.push(`wishlist hotel ${hotelId}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    try {
      await apiRequest.dispose();
      if (process.env.VERIFY_API_CONTEXT_DISPOSAL === '1') {
        try {
          await apiRequest.get('/health');
          cleanupFailures.push('request context: accepted a request after dispose()');
        } catch {
          await this.attach('Request context rejected a request after dispose().', 'text/plain');
        }
      }
    } catch (error) {
      cleanupFailures.push(`request context: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  this.request = undefined;
  this.response = undefined;
  this.reviewId = undefined;
  this.reviewHotelId = undefined;
  this.createdReviews.clear();
  this.wishlistHotelIds.clear();

  if (cleanupFailures.length === 0) return;

  const message = `Cleanup failed after scenario "${pickle.name}":\n${cleanupFailures.join('\n')}`;
  if (result?.status === Status.FAILED) {
    await this.attach(message, 'text/plain');
    console.error(message);
    return;
  }
  throw new Error(message);
});
