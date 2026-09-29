const { defineConfig } = require('cypress');
const createBundler = require('@bahmutov/cypress-esbuild-preprocessor');
const { addCucumberPreprocessorPlugin } = require('@badeball/cypress-cucumber-preprocessor');
const { createEsbuildPlugin } = require('@badeball/cypress-cucumber-preprocessor/esbuild');

function localMockUrl() {
  const rawUrl = process.env.API_URL || 'http://localhost:3001';
  const url = new URL(rawUrl);
  if (!['localhost', '127.0.0.1', '::1'].includes(url.hostname)) {
    throw new Error(`Cypress API suite only permits a local mock URL, received: ${rawUrl}`);
  }
  return url.origin;
}

async function setupNodeEvents(on, config) {
  await addCucumberPreprocessorPlugin(on, config);
  on('file:preprocessor', createBundler({ plugins: [createEsbuildPlugin(config)] }));
  return config;
}

const apiUrl = localMockUrl();

module.exports = defineConfig({
  e2e: {
    baseUrl: apiUrl,
    specPattern: 'tests/manual/features/api/**/*.feature',
    supportFile: false,
    defaultCommandTimeout: 10000,
    video: false,
    screenshotOnRunFailure: true,
    setupNodeEvents,
  },
  env: {
    API_URL: apiUrl,
    stepDefinitions: ['tests/automation/api/cypress/api.steps.js'],
    jsonEnabled: true,
    jsonOutput: 'reports/cypress-api/cucumber.json',
  },
});
