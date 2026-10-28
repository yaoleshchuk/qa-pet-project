#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const { spawnSync } = require('node:child_process');
const input = 'reports/api/latest/allure-results';
const output = 'reports/api/latest/allure-report';
if (!fs.existsSync(input) || fs.readdirSync(input).length === 0) {
  console.error(`No current Allure results in ${input}; run a real API suite first.`);
  process.exit(1);
}
const result = spawnSync('npx', ['--no-install', 'allure', 'generate', input, '--clean', '-o', output], { stdio: 'inherit' });
if (result.error) throw result.error;
process.exit(result.status || 0);
