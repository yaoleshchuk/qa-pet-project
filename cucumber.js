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

  // Draft matching is deliberately opt-in. It parses one generated @WIP draft
  // and loads step definitions in --dry-run mode; no step or browser executes.
  'draft-api-matching': {
    requireModule: ['ts-node/register'],
    require: [
      'tests/automation/api/playwright/world-api.ts',
      'tests/automation/api/playwright/api.steps.ts',
      'tests/generator/ambiguous.steps.ts',
    ],
    tags: '@WIP and @GeneratedDraft and @API',
    format: ['summary'],
  },

  'draft-e2e-matching': {
    requireModule: ['ts-node/register'],
    require: [
      'tests/automation/e2e/fixtures/world.ts',
      'tests/automation/e2e/playwright/steps/*.ts',
    ],
    tags: '@WIP and @GeneratedDraft and @E2E',
    format: ['summary'],
  },

  // ─── Real-execution profiles (run against mock API server, emit Allure) ─────

  'api-all': {
    requireModule: ['ts-node/register'],
    require: [
      'tests/automation/api/playwright/world-api.ts',
      'tests/automation/api/playwright/api.steps.ts',
    ],
    paths: ['tests/manual/features/api/**/*.feature'],
    tags: '@API and not @WIP',
    format: ['progress-bar', 'allure-cucumberjs/reporter'],
    formatOptions: {
      snippetInterface: 'async-await',
      resultsDir: process.env.ALLURE_RESULTS_DIR || 'allure-results',
    },
  },

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
      resultsDir: process.env.ALLURE_RESULTS_DIR || 'allure-results',
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
      resultsDir: process.env.ALLURE_RESULTS_DIR || 'allure-results',
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
      resultsDir: process.env.ALLURE_RESULTS_DIR || 'allure-results',
    },
  },

  // ─── Real local UI execution (the strict profiles above remain dry-runs) ──
  'ui-local': {
    requireModule: ['ts-node/register'],
    require: [
      'tests/automation/e2e/fixtures/world.ts',
      'tests/automation/e2e/playwright/steps/*.ts',
    ],
    paths: ['tests/manual/features/e2e/**/*.feature'],
    tags: '@LocalUI and not @WIP',
    format: ['progress-bar', 'summary'],
    formatOptions: { snippetInterface: 'async-await' },
  },
};
