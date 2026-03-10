const { defineConfig } = require('cypress');
const createBundler = require('@bahmutov/cypress-esbuild-preprocessor');
const { addCucumberPreprocessorPlugin } = require('@badeball/cypress-cucumber-preprocessor');
const { createEsbuildPlugin } = require('@badeball/cypress-cucumber-preprocessor/esbuild');
require('dotenv').config();

module.exports = defineConfig({
  e2e: {
    baseUrl: process.env.BASE_URL || 'https://www.booking.com',
    specPattern: 'tests/manual/features/**/*.feature',
    supportFile: false,
    viewportWidth: 1280,
    viewportHeight: 800,
    defaultCommandTimeout: 10000,
    video: false,
    screenshotOnRunFailure: true,

    async setupNodeEvents(on, config) {
      await addCucumberPreprocessorPlugin(on, config);
      on(
        'file:preprocessor',
        createBundler({ plugins: [createEsbuildPlugin(config)] })
      );
      return config;
    },
  },

  env: {
    API_URL: process.env.API_URL || 'https://www.booking.com',
    stepDefinitions: [
      'tests/automation/e2e/cypress/steps/*.js',
      'tests/automation/api/cypress/api.steps.js',
    ],
  },
});
