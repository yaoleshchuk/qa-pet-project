#!/usr/bin/env node
'use strict';

const path = require('path');
const { spawnSync } = require('child_process');

const profile = process.argv[2] || 'default';
const allowedProfiles = new Set(['default', 'acceptance', 'smoke', 'regression']);

if (!allowedProfiles.has(profile)) {
  console.error(`Unknown Cucumber profile: ${profile}`);
  process.exit(2);
}

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
  [cucumberBin, '--profile', profile, '--dry-run', '--force-exit', '--format', 'summary'],
  { cwd: path.join(__dirname, '..'), encoding: 'utf8' }
);

const output = `${result.stdout || ''}${result.stderr || ''}`;
process.stdout.write(output);

if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}

if (result.status !== 0 || /\bundefined\b/i.test(output)) {
  console.error(`Cucumber profile "${profile}" contains undefined steps or failed validation.`);
  process.exit(1);
}

console.log(`Cucumber profile "${profile}" has no undefined steps.`);
