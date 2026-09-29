const { defineConfig } = require('cypress');
const createBundler = require('@bahmutov/cypress-esbuild-preprocessor');
const { addCucumberPreprocessorPlugin } = require('@badeball/cypress-cucumber-preprocessor');
const { createEsbuildPlugin } = require('@badeball/cypress-cucumber-preprocessor/esbuild');
const fs = require('node:fs');
const path = require('node:path');
require('dotenv').config();

async function setupNodeEvents(on, config) {
  await addCucumberPreprocessorPlugin(on, config);
  on('file:preprocessor', createBundler({ plugins: [createEsbuildPlugin(config)] }));
  on('after:run', (results) => {
    if (process.env.UI_ARTIFACT_DIR && results) {
      fs.mkdirSync(process.env.UI_ARTIFACT_DIR, { recursive: true });
      fs.writeFileSync(path.join(process.env.UI_ARTIFACT_DIR, 'cypress-results.json'), JSON.stringify({
        totalTests: results.totalTests,
        totalPassed: results.totalPassed,
        totalFailed: results.totalFailed,
        totalPending: results.totalPending,
        totalSkipped: results.totalSkipped,
      }, null, 2));
    }
  });
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
    testIsolation: true,
    defaultCommandTimeout: 10000,
    video: false,
    screenshotOnRunFailure: true,
    setupNodeEvents,
  },
  env: {
    stepDefinitions: ['tests/automation/e2e/cypress/steps/*.js'],
  },
});
