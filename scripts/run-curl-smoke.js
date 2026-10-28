#!/usr/bin/env node
'use strict';

// cURL checks mutate /api/test/reset and wishlist.  They therefore own this
// private mock process and never share a server with API/UI runners.
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const port = Number(process.env.CURL_TEST_PORT || 3218);
const baseUrl = `http://127.0.0.1:${port}`;
const scripts = fs.readdirSync(path.join('tests', 'automation', 'api', 'curl'))
  .filter((name) => /^\d\d_.*\.sh$/.test(name)).sort();
const server = spawn(process.execPath, ['mock-server/server.js'], {
  env: { ...process.env, MOCK_PORT: String(port) }, stdio: ['ignore', 'pipe', 'pipe'],
});
let ownsPort = false;
server.stdout.on('data', (chunk) => {
  process.stdout.write(chunk);
  if (chunk.toString().includes(`Mock API server listening on http://0.0.0.0:${port}`)) ownsPort = true;
});
server.stderr.on('data', (chunk) => process.stderr.write(chunk));

function stop() { if (server.exitCode === null) server.kill('SIGTERM'); }
process.on('SIGINT', stop); process.on('SIGTERM', stop);
async function ready() {
  const deadline = Date.now() + 15_000;
  while (Date.now() < deadline) {
    if (server.exitCode !== null) throw new Error('Dedicated cURL mock exited before readiness');
    // A foreign process can return 200 on this port.  Health is valid only
    // after this child confirmed its own listen(), so reset never reaches it.
    try { if (ownsPort && (await fetch(`${baseUrl}/health`)).ok) return; } catch (_) { /* retry */ }
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  throw new Error('Dedicated cURL mock was not ready within 15000ms');
}
function run(script) {
  return new Promise((resolve) => {
    const child = spawn('bash', [path.join('tests', 'automation', 'api', 'curl', script)], {
      stdio: 'inherit', env: { ...process.env, BASE_URL: baseUrl, CURL_DEDICATED_MOCK: '1' },
    });
    child.on('exit', (code) => resolve(code || 0));
  });
}
(async () => {
  try {
    await ready();
    if (scripts.length !== 10) throw new Error(`Expected 10 cURL checks, found ${scripts.length}`);
    for (const script of scripts) if (await run(script) !== 0) process.exitCode = 1;
  } catch (error) { console.error(error.message); process.exitCode = 1; }
  finally { stop(); if (server.exitCode === null) await new Promise((resolve) => server.once('exit', resolve)); }
})();
