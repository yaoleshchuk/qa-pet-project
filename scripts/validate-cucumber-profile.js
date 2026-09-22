#!/usr/bin/env node
'use strict';

const path = require('path');
const fs = require('fs');
const { spawnSync } = require('child_process');

const profile = process.argv[2] || 'default';
const reportPath = process.argv[3] || path.join('reports', `dry-run-${profile}.json`);
const allowedProfiles = new Set(['default', 'acceptance', 'smoke', 'regression']);

if (!allowedProfiles.has(profile)) {
  console.error(`Unknown Cucumber profile: ${profile}`);
  process.exit(2);
}

fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.rmSync(reportPath, { force: true });

const cucumberBin = path.join(
  __dirname,
  '..',
  'node_modules',
  '@cucumber',
  'cucumber',
  'bin',
  'cucumber.js'
);

const result = spawnSync(
  process.execPath,
  [
    cucumberBin,
    '--profile', profile,
    '--dry-run',
    '--strict',
    '--force-exit',
    '--format', 'summary',
    '--format', `json:${reportPath}`,
  ],
  { cwd: path.join(__dirname, '..'), encoding: 'utf8' }
);

const output = `${result.stdout || ''}${result.stderr || ''}`;
process.stdout.write(output);

if (result.error) {
  console.error(result.error.message);
  process.exit(2);
}

if (!fs.existsSync(reportPath)) {
  console.error(`Cucumber did not create the expected report: ${reportPath}`);
  process.exit(result.status || 2);
}

let features;
try {
  features = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
} catch (error) {
  console.error(`Unable to read Cucumber report ${reportPath}: ${error.message}`);
  process.exit(2);
}

const statuses = features.flatMap(feature =>
  (feature.elements || []).flatMap(scenario =>
    (scenario.steps || []).map(step => step.result?.status || 'unknown')
  )
);
const undefinedSteps = statuses.filter(status => status === 'undefined').length;
const ambiguousSteps = statuses.filter(status => status === 'ambiguous').length;

console.log(
  `Strict dry-run (${profile}): ${undefinedSteps} undefined, ${ambiguousSteps} ambiguous; report: ${reportPath}`
);

if (result.status !== 0) {
  process.exit(result.status || 1);
}

if (undefinedSteps > 0 || ambiguousSteps > 0) {
  console.error('Strict dry-run failed because not every included step has exactly one matching definition.');
  process.exit(1);
}
