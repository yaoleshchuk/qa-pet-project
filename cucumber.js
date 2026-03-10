module.exports = {
  // ─── Dry-run profiles (CI gate — validates step matching without a browser) ─

  default: {
    requireModule: ['ts-node/register'],
    require: [
      'tests/automation/e2e/fixtures/world.ts',
      'tests/automation/e2e/playwright/steps/*.ts',
      'tests/automation/api/playwright/api.steps.ts',
    ],
    paths: ['tests/manual/features/**/*.feature'],
    tags: 'not @WIP',
    format: ['progress-bar', 'html:reports/cucumber-report.html'],
    formatOptions: { snippetInterface: 'async-await' },
  },

  acceptance: {
    requireModule: ['ts-node/register'],
    require: [
      'tests/automation/e2e/fixtures/world.ts',
      'tests/automation/e2e/playwright/steps/*.ts',
      'tests/automation/api/playwright/api.steps.ts',
    ],
    paths: ['tests/manual/features/**/*.feature'],
    tags: '@Acceptance and not @WIP',
    format: ['progress-bar'],
  },

  smoke: {
    requireModule: ['ts-node/register'],
    require: [
      'tests/automation/e2e/fixtures/world.ts',
      'tests/automation/e2e/playwright/steps/*.ts',
      'tests/automation/api/playwright/api.steps.ts',
    ],
    paths: ['tests/manual/features/**/*.feature'],
    tags: '@Smoke and not @WIP',
    format: ['progress-bar'],
  },

  regression: {
    requireModule: ['ts-node/register'],
    require: [
      'tests/automation/e2e/fixtures/world.ts',
      'tests/automation/e2e/playwright/steps/*.ts',
      'tests/automation/api/playwright/api.steps.ts',
    ],
    paths: ['tests/manual/features/**/*.feature'],
    tags: '@Regression and not @WIP',
    format: ['progress-bar'],
  },

  // ─── Real-execution profiles (run against mock API server, emit Allure) ─────

  'api-acceptance': {
    requireModule: ['ts-node/register'],
    require: [
      'tests/automation/api/playwright/world-api.ts',
      'tests/automation/api/playwright/api.steps.ts',
    ],
    paths: ['tests/manual/features/api/**/*.feature'],
    tags: '@API and @Acceptance and not @WIP',
    format: ['progress-bar', 'allure-cucumberjs/reporter'],
    formatOptions: {
      snippetInterface: 'async-await',
      resultsDir: 'allure-results',
    },
  },

  'api-smoke': {
    requireModule: ['ts-node/register'],
    require: [
      'tests/automation/api/playwright/world-api.ts',
      'tests/automation/api/playwright/api.steps.ts',
    ],
    paths: ['tests/manual/features/api/**/*.feature'],
    tags: '@API and @Smoke and not @WIP',
    format: ['progress-bar', 'allure-cucumberjs/reporter'],
    formatOptions: {
      snippetInterface: 'async-await',
      resultsDir: 'allure-results',
    },
  },

  'api-regression': {
    requireModule: ['ts-node/register'],
    require: [
      'tests/automation/api/playwright/world-api.ts',
      'tests/automation/api/playwright/api.steps.ts',
    ],
    paths: ['tests/manual/features/api/**/*.feature'],
    tags: '@API and @Regression and not @WIP',
    format: ['progress-bar', 'allure-cucumberjs/reporter'],
    formatOptions: {
      snippetInterface: 'async-await',
      resultsDir: 'allure-results',
    },
  },
};
