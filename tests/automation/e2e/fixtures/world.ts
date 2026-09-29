import { Before, After, Status, setDefaultTimeout } from '@cucumber/cucumber';
import {
  Browser,
  BrowserContext,
  Page,
  chromium,
} from '@playwright/test';
import * as dotenv from 'dotenv';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';

dotenv.config();

setDefaultTimeout(30 * 1000);

let browser: Browser;
let context: BrowserContext;
export let page: Page;

function localBaseUrl() {
  const baseURL = process.env.BASE_URL;
  if (!baseURL || !/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(baseURL)) {
    throw new Error('Real UI execution requires a local BASE_URL started by scripts/run-local-ui-tests.js.');
  }
  return baseURL;
}

Before(async function () {
  browser = await chromium.launch({ headless: true });
  context = await browser.newContext({
    baseURL: localBaseUrl(),
    locale: 'en-GB',
  });
  page = await context.newPage();
  await context.tracing.start({ screenshots: true, snapshots: true, sources: true });
  // The UI command owns a dedicated mock process, so this reset cannot race
  // API suites or another UI runner. It makes wishlist state independent.
  const reset = await page.request.post('/api/test/reset');
  if (!reset.ok()) throw new Error(`Could not reset dedicated UI mock: ${reset.status()}`);
  await page.goto('/');
  await page.evaluate('sessionStorage.clear()');
});

After(async function ({ result, pickle }) {
  const safeName = pickle.name.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || 'scenario';
  const artifactDirectory = path.join(process.env.UI_ARTIFACT_DIR || 'reports/ui/playwright', safeName);
  if (result?.status === Status.FAILED) {
    await fs.mkdir(artifactDirectory, { recursive: true });
    await page?.screenshot({ path: path.join(artifactDirectory, 'failure.png'), fullPage: true });
    await context?.tracing.stop({ path: path.join(artifactDirectory, 'trace.zip') });
  } else {
    await context?.tracing.stop();
  }
  await page?.close();
  await context?.close();
  await browser?.close();
});
