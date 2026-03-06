module.exports = {
  default: {
    requireModule: ['ts-node/register'],
    require: [
      'booking - tests - example/automation/e2e/fixtures/world.ts',
      'booking - tests - example/automation/e2e/playwright/steps/*.ts',
      'booking - tests - example/automation/api/playwright/api.steps.ts',
    ],
    paths: ['booking - tests - example/manual/features/**/*.feature'],
    format: ['progress-bar', 'html:reports/cucumber-report.html'],
    formatOptions: { snippetInterface: 'async-await' },
    publishQuiet: true,
  },

  acceptance: {
    requireModule: ['ts-node/register'],
    require: [
      'booking - tests - example/automation/e2e/fixtures/world.ts',
      'booking - tests - example/automation/e2e/playwright/steps/*.ts',
      'booking - tests - example/automation/api/playwright/api.steps.ts',
    ],
    paths: ['booking - tests - example/manual/features/**/*.feature'],
    tags: '@Acceptance',
    format: ['progress-bar'],
    publishQuiet: true,
  },

  smoke: {
    requireModule: ['ts-node/register'],
    require: [
      'booking - tests - example/automation/e2e/fixtures/world.ts',
      'booking - tests - example/automation/e2e/playwright/steps/*.ts',
      'booking - tests - example/automation/api/playwright/api.steps.ts',
    ],
    paths: ['booking - tests - example/manual/features/**/*.feature'],
    tags: '@Smoke',
    format: ['progress-bar'],
    publishQuiet: true,
  },

  regression: {
    requireModule: ['ts-node/register'],
    require: [
      'booking - tests - example/automation/e2e/fixtures/world.ts',
      'booking - tests - example/automation/e2e/playwright/steps/*.ts',
      'booking - tests - example/automation/api/playwright/api.steps.ts',
    ],
    paths: ['booking - tests - example/manual/features/**/*.feature'],
    tags: '@Regression',
    format: ['progress-bar'],
    publishQuiet: true,
  },
};
