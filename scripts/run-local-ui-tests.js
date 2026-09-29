#!/usr/bin/env node
'use strict';

// Starts one private mock server for exactly one UI runner. This deliberately
// avoids PORT 3001 and avoids resetting a process that another API/UI suite owns.
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const runner = process.argv[2];
if (!['playwright', 'cypress'].includes(runner)) {
  throw new Error('Usage: node scripts/run-local-ui-tests.js <playwright|cypress>');
}

const port = Number(process.env.UI_TEST_PORT || (runner === 'playwright' ? 3106 : 3107));
const baseUrl = `http://127.0.0.1:${port}`;
const reportRoot = path.join('reports', 'ui', runner);
fs.mkdirSync(reportRoot, { recursive: true });
const log = fs.createWriteStream(path.join(reportRoot, 'mock.log'));
const server = spawn(process.execPath, ['mock-server/server.js'], {
  env: { ...process.env, MOCK_PORT: String(port) },
  stdio: ['ignore', 'pipe', 'pipe'],
});
server.stdout.pipe(log);
server.stderr.pipe(log);

let stopped = false;
function stopServer() {
  if (!stopped && server.exitCode === null) server.kill('SIGTERM');
  stopped = true;
}
process.on('SIGINT', () => { stopServer(); process.exitCode = 130; });
process.on('SIGTERM', () => { stopServer(); process.exitCode = 143; });

async function ready() {
  const deadline = Date.now() + Number(process.env.UI_READY_TIMEOUT_MS || 15_000);
  let lastError;
  while (Date.now() < deadline) {
    if (server.exitCode !== null) throw new Error(`Mock server exited before readiness; see ${reportRoot}/mock.log`);
    try {
      const response = await fetch(`${baseUrl}/health`);
      if (response.ok) return;
      lastError = new Error(`health returned ${response.status}`);
    } catch (error) { lastError = error; }
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  throw new Error(`Mock server was not ready within ${process.env.UI_READY_TIMEOUT_MS || 15_000}ms: ${lastError?.message}`);
}

function run(command, args, env) {
  return new Promise((resolve) => {
    const child = spawn(command, args, { env, stdio: 'inherit' });
    child.on('exit', (code, signal) => resolve(code ?? (signal ? 1 : 0)));
  });
}

function scenarioCount(resultPath, featurePath) {
  const features = JSON.parse(fs.readFileSync(resultPath, 'utf8'));
  return features
    .filter((feature) => !featurePath || feature.uri === featurePath)
    .reduce((count, feature) => count + (feature.elements || []).length, 0);
}

function verifyPlaywrightResult(resultPath) {
  const features = JSON.parse(fs.readFileSync(resultPath, 'utf8'));
  const scenarios = features.flatMap((feature) => feature.elements || []);
  const nonPassed = scenarios.flatMap((scenario) => scenario.steps || [])
    .filter((step) => step.result?.status !== 'passed');
  if (scenarios.length === 0 || nonPassed.length > 0) {
    throw new Error(`Playwright UI selection is invalid: ${scenarios.length} scenarios, ${nonPassed.length} non-passed steps.`);
  }
}

(async () => {
  try {
    await ready();
    const env = { ...process.env, BASE_URL: baseUrl, UI_ARTIFACT_DIR: reportRoot };
    const cucumberArgs = ['--no-install', 'cucumber-js', '--profile', 'ui-local', '--format', `json:${reportRoot}/cucumber.json`];
    if (process.env.UI_CUCUMBER_NAME) cucumberArgs.push('--name', process.env.UI_CUCUMBER_NAME);
    const selectedPath = path.join(reportRoot, 'selected-scenarios.json');
    const selectionExit = await run('npx', ['--no-install', 'cucumber-js', '--profile', 'ui-local', '--dry-run', '--format', `json:${selectedPath}`], env);
    if (selectionExit !== 0) throw new Error('Local UI tag selection does not have complete step matching.');
    const selectedScenarios = scenarioCount(selectedPath, process.env.UI_CYPRESS_SPEC);
    if (selectedScenarios === 0) throw new Error('Local UI tag selection is empty.');
    const cypressArgs = ['--no-install', 'cypress', 'run', '--config', `baseUrl=${baseUrl}`, '--env', 'tags=@LocalUI and not @WIP'];
    if (process.env.UI_CYPRESS_SPEC) cypressArgs.push('--spec', process.env.UI_CYPRESS_SPEC);
    let exit;
    if (runner === 'playwright') {
      exit = await run('npx', cucumberArgs, env);
      if (exit === 0) verifyPlaywrightResult(path.join(reportRoot, 'cucumber.json'));
    } else {
      exit = await run('npx', cypressArgs, env);
      if (exit === 0) {
        const result = JSON.parse(fs.readFileSync(path.join(reportRoot, 'cypress-results.json'), 'utf8'));
        if (result.totalFailed !== 0 || result.totalPassed !== selectedScenarios) {
          throw new Error(`Cypress UI selection mismatch: expected ${selectedScenarios} passed, got ${result.totalPassed} passed and ${result.totalFailed} failed.`);
        }
      }
    }
    fs.writeFileSync(path.join(reportRoot, 'status.txt'), `${runner}=${exit}\n`);
    process.exitCode = exit;
  } catch (error) {
    console.error(error.stack || error.message);
    fs.writeFileSync(path.join(reportRoot, 'status.txt'), `${runner}=1\n`);
    process.exitCode = 1;
  } finally {
    stopServer();
    if (server.exitCode === null) await new Promise((resolve) => server.once('exit', resolve));
    log.end();
  }
})();
