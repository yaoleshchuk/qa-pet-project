/**
 * Lightweight world fixture for API-only test runs.
 *
 * Sets up a Playwright APIRequestContext pointed at the mock server
 * (API_URL env var) without launching a full browser.  Used exclusively
 * by the api-acceptance / api-smoke / api-regression Cucumber profiles.
 */
import { Before, After, setDefaultTimeout } from '@cucumber/cucumber';
import { APIRequestContext, request as playwrightRequest } from '@playwright/test';
import * as dotenv from 'dotenv';

dotenv.config();

setDefaultTimeout(15 * 1000);

let apiRequest: APIRequestContext;

Before(async () => {
  apiRequest = await playwrightRequest.newContext({
    baseURL: process.env.API_URL || 'http://localhost:3001',
    extraHTTPHeaders: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  });
  (global as any).request = apiRequest;
});

After(async () => {
  await apiRequest?.dispose();
});
