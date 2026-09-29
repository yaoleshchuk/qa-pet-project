const { defineConfig } = require('cypress');
const createBundler = require('@bahmutov/cypress-esbuild-preprocessor');
const { addCucumberPreprocessorPlugin } = require('@badeball/cypress-cucumber-preprocessor');
const { createEsbuildPlugin } = require('@badeball/cypress-cucumber-preprocessor/esbuild');
require('dotenv').config();

async function setupNodeEvents(on, config) {
  await addCucumberPreprocessorPlugin(on, config);
  on('file:preprocessor', createBundler({ plugins: [createEsbuildPlugin(config)] }));
  return config;
}

module.exports = defineConfig({
  e2e: {
    // Local is intentional: these feature implementations must never open the
    // external site. Real UI commands start this origin themselves.
    baseUrl: process.env.BASE_URL || 'http://localhost:3001',
    specPattern: 'tests/manual/features/e2e/**/*.feature',
    supportFile: false,
    viewportWidth: 1280,
    viewportHeight: 800,
    defaultCommandTimeout: 10000,
    video: false,
    screenshotOnRunFailure: true,
    setupNodeEvents,
  },
  env: {
    stepDefinitions: ['tests/automation/e2e/cypress/steps/*.js'],
  },
});
