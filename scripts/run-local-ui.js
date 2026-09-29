#!/usr/bin/env node
'use strict';

// Starts the single local UI/API process, waits for its declared health endpoint,
// and forwards Ctrl-C/SIGTERM so task-owned processes never remain behind.
const { spawn } = require('child_process');
const http = require('http');

const port = Number(process.env.MOCK_PORT || 3001);
const timeoutMs = Number(process.env.UI_READY_TIMEOUT_MS || 10000);
const child = spawn(process.execPath, ['mock-server/server.js'], {
  env: { ...process.env, MOCK_PORT: String(port) },
  stdio: 'inherit',
});
let stopping = false;

function stop(exitCode) {
  if (stopping) return;
  stopping = true;
  if (!child.killed) child.kill('SIGTERM');
  process.exitCode = exitCode;
}

function health() {
  return new Promise((resolve) => {
    const request = http.get(`http://127.0.0.1:${port}/health`, (response) => {
      response.resume();
      resolve(response.statusCode === 200);
    });
    request.on('error', () => resolve(false));
    request.setTimeout(500, () => { request.destroy(); resolve(false); });
  });
}

async function waitForReady() {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await health()) {
      console.log(`Local UI and mock API are ready at http://localhost:${port}`);
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 150));
  }
  console.error(`Local UI/API did not become ready within ${timeoutMs}ms.`);
  stop(1);
}

child.once('exit', (code, signal) => {
  if (!stopping) {
    console.error(`Local UI/API stopped before readiness (${signal || `exit ${code}`}).`);
    process.exitCode = code || 1;
  }
});
process.on('SIGINT', () => stop(0));
process.on('SIGTERM', () => stop(0));
waitForReady();
