#!/usr/bin/env node
'use strict';

// A real API run owns a new result directory.  This prevents a previous
// Allure/JSON result from making a later empty or failed run look successful.
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const suite = process.argv[2];
if (!['all', 'acceptance', 'smoke', 'regression'].includes(suite)) {
  console.error('Usage: node scripts/run-api-suite.js <all|acceptance|smoke|regression>');
  process.exit(2);
}

const root = path.join('reports', 'api', 'latest');
fs.rmSync(root, { recursive: true, force: true });
fs.mkdirSync(root, { recursive: true });
const report = path.join(root, 'cucumber.json');
const result = spawnSync(process.execPath, [
  path.join('node_modules', '@cucumber', 'cucumber', 'bin', 'cucumber.js'),
  '--profile', `api-${suite}`,
  '--format', 'summary',
  '--format', `json:${report}`,
  '--format', 'allure-cucumberjs/reporter',
  '--format-options', JSON.stringify({ resultsDir: path.join(root, 'allure-results') }),
], { stdio: 'inherit', env: { ...process.env, API_URL: process.env.API_URL || 'http://127.0.0.1:3001' } });

if (result.error) throw result.error;
if (!fs.existsSync(report)) {
  console.error(`Cucumber did not create the current report: ${report}`);
  process.exit(result.status || 2);
}
const features = JSON.parse(fs.readFileSync(report, 'utf8'));
const scenarios = features.flatMap((feature) => feature.elements || []);
const statuses = scenarios.flatMap((scenario) => (scenario.steps || []).map((step) => step.result?.status || 'unknown'));
console.log(`API ${suite}: ${scenarios.length} scenarios; ${statuses.join(', ') || 'no steps'}; report: ${report}`);
if (scenarios.length === 0 || statuses.length === 0 || statuses.some((status) => status !== 'passed')) process.exit(1);
const allureResults = path.join(root, 'allure-results');
if (!fs.existsSync(allureResults) || fs.readdirSync(allureResults).length === 0) {
  console.error(`Allure did not create current results: ${allureResults}`);
  process.exit(1);
}
process.exit(result.status || 0);
