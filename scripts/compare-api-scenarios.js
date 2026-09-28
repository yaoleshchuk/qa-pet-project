#!/usr/bin/env node
'use strict';

const fs = require('node:fs');

function readReport(path) {
  let parsed;
  try {
    parsed = JSON.parse(fs.readFileSync(path, 'utf8'));
  } catch (error) {
    throw new Error(`Cannot read Cucumber JSON report ${path}: ${error.message}`);
  }
  if (!Array.isArray(parsed)) throw new Error(`Expected a Cucumber JSON array in ${path}`);
  return parsed;
}

function scenarios(report, source) {
  const items = [];
  for (const feature of report) {
    for (const scenario of feature.elements || []) {
      if (scenario.keyword !== 'Scenario' && scenario.keyword !== 'Scenario Outline') continue;
      const steps = (scenario.steps || []).filter((step) => !step.hidden);
      const statuses = steps.map((step) => step.result?.status);
      if (statuses.some((status) => status !== 'passed')) {
        throw new Error(`${source} did not pass ${feature.uri}: ${scenario.name} (${statuses.join(', ')})`);
      }
      items.push(`${feature.uri}\n${scenario.name}\n${steps.map((step) => `${step.keyword}${step.name}`).join('\n')}`);
    }
  }
  if (items.length === 0) throw new Error(`${source} report contains no executed scenarios`);
  return items.sort();
}

if (process.argv.length !== 4) {
  console.error('Usage: node scripts/compare-api-scenarios.js <playwright.json> <cypress.json>');
  process.exit(2);
}

try {
  const playwright = scenarios(readReport(process.argv[2]), 'Playwright');
  const cypress = scenarios(readReport(process.argv[3]), 'Cypress');
  const missingInCypress = playwright.filter((item) => !cypress.includes(item));
  const missingInPlaywright = cypress.filter((item) => !playwright.includes(item));
  if (missingInCypress.length || missingInPlaywright.length) {
    throw new Error(
      `Scenario identity mismatch: missing in Cypress=${missingInCypress.length}, missing in Playwright=${missingInPlaywright.length}`,
    );
  }
  console.log(`Scenario identity match: ${playwright.length} executed API scenarios in Playwright and Cypress.`);
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
