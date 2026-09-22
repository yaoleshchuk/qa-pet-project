# Working on qa-pet-project

## Scope and handoff

- Read `docs/improvement-plan.md` and the relevant code before starting an accepted stage.
- Implement only the stage requested by the user. Track completed work and evidence in the plan.
- Read `docs/baseline-stage-0.md` for known failures; do not describe an unexecuted check as passed.
- Keep fixes and their verification in one task. Prefer one focused branch/PR per stage; start dependent work from the integrated previous stage.
- Do not weaken assertions, remove scenarios, add skips, or suppress failures merely to obtain a green run. Draft AI scenarios may use `@WIP` only as part of the agreed generator workflow.

## Environment and layout

- Node.js version: `.nvmrc`; npm version: `package.json`. Use `nvm install && nvm use` or an equivalent version manager, then `npm ci`.
- `tests/manual/features/{api,e2e}`: shared Gherkin specifications.
- `tests/automation/api/playwright`: API steps and API-only hooks.
- `tests/automation/e2e/{fixtures,playwright}`: browser hooks and Page Objects.
- `tests/automation/{api,e2e}/cypress`: Cypress implementations.
- `mock-server/server.js`: local, in-memory API; restarts reset state.
- `scripts/ai-generate-feature.ts`: optional Anthropic-backed generator; use mock mode when a real API call is not necessary.
- `cucumber.js`, `cypress.config.js`, `.github/workflows`: suite selection and execution.

## Current verification commands

```bash
npx --no-install tsc --noEmit
npm run test:pw:dry-run
npm run test:pw:acceptance
npm run test:pw:smoke
npm run test:pw:regression
```

The four `test:pw:*` commands above are **dry-runs**, not browser execution.
Current `tsconfig.json` includes automation TypeScript and `scripts/`, including
the AI generator.

For real API execution, start `npm run mock:start` in a separate terminal,
check `curl --fail http://localhost:3001/health`, then run:

```bash
npm run test:api:acceptance
npm run test:api:smoke
npm run test:api:regression
```

To select a different local port, use `MOCK_PORT=<port>` for the server and
`API_URL=http://localhost:<port> npx --no-install cucumber-js --profile api-acceptance`.
The npm API scripts currently hardcode port 3001. Do not silently use an unrelated
server already occupying that port. Stop only processes started for your task.

- Restart the mock server before a suite when collecting an isolated baseline.
- Never send mock API scenarios to Booking.com. Browser scenarios currently default to that external site; a local UI target is planned in stage 5.
- Keep per-run logs/reports under ignored `reports/`; keep concise evidence and limitations in `docs/`.
- Preserve existing Allure results by using a fresh results directory for diagnostic runs.
- For changed behavior, use meaningful tests that would fail on the original bug. Run relevant checks and report exit codes, scenario counts, and blockers.
- Do not claim SQL examples are database integration tests: this repository currently has no test database harness.
