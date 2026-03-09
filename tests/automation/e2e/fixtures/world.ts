import { Before, After, setDefaultTimeout } from '@cucumber/cucumber';
import {
  Browser,
  BrowserContext,
  Page,
  chromium,
  APIRequestContext,
  request as playwrightRequest,
} from '@playwright/test';
import * as dotenv from 'dotenv';

dotenv.config();

setDefaultTimeout(30 * 1000);

let browser: Browser;
let context: BrowserContext;
export let page: Page;
export let request: APIRequestContext;

Before(async () => {
  browser = await chromium.launch({ headless: true });
  context = await browser.newContext({
    baseURL: process.env.BASE_URL || 'https://www.booking.com',
    locale: 'en-GB',
  });
  page = await context.newPage();

  request = await playwrightRequest.newContext({
    baseURL: process.env.API_URL || 'https://www.booking.com',
  });

  (global as any).request = request;
});

After(async () => {
  await page?.close();
  await context?.close();
  await browser?.close();
  await request?.dispose();
});
