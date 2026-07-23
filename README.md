# QA Portfolio — Booking.com Test Suite

[![Acceptance Tests](https://github.com/yaoleshchuk/qa-pet-project/actions/workflows/on-main-acceptance.yml/badge.svg)](https://github.com/yaoleshchuk/qa-pet-project/actions/workflows/on-main-acceptance.yml)
[![Nightly Full Run](https://github.com/yaoleshchuk/qa-pet-project/actions/workflows/nightly-full-run.yml/badge.svg)](https://github.com/yaoleshchuk/qa-pet-project/actions/workflows/nightly-full-run.yml)
[![Manual Quality Gate](https://github.com/yaoleshchuk/qa-pet-project/actions/workflows/manual-quality-gate.yml/badge.svg)](https://github.com/yaoleshchuk/qa-pet-project/actions/workflows/manual-quality-gate.yml)
[![API Mock Tests](https://github.com/yaoleshchuk/qa-pet-project/actions/workflows/api-mock-tests.yml/badge.svg)](https://github.com/yaoleshchuk/qa-pet-project/actions/workflows/api-mock-tests.yml)

A portfolio-focused **QA automation project** modelled on [Booking.com](https://booking.com), using Gherkin BDD, Playwright (TypeScript), Cypress (JavaScript), and GitHub Actions CI/CD.

> **Execution model:** the mock API suite is deterministic and runs for real.
> UI suites are primarily specifications and step-contract checks against a
> live third-party website. Experimental scenarios remain visible under `@WIP`
> but are deliberately excluded from quality gates.

---

## Tech Stack

| Layer | Tool | Language |
|-------|------|----------|
| Test design & specification | **Gherkin / Cucumber** | — |
| E2E & API automation | **Playwright** | TypeScript |
| E2E & API automation | **Cypress** | JavaScript |
| DB-level validation | **SQL** | PostgreSQL |
| Lightweight API checks | **cURL** | Bash |
| CI/CD quality gates | **GitHub Actions** | YAML |

---

## Project Structure

```
scripts/
└── ai-generate-feature.ts           # AI feature generator (Claude API)

tests/
├── manual/
│   └── features/
│       ├── api/                     # 11 API feature files + AI-generated
│       │   ├── 01_login_success.feature
│       │   ├── 02_login_failure.feature
│       │   ├── 03_search_city.feature
│       │   ├── 04_search_dates.feature
│       │   ├── 05_price_filter.feature
│       │   ├── 06_currency_conversion.feature
│       │   ├── 07_add_to_wishlist.feature
│       │   ├── 08_remove_from_wishlist.feature
│       │   ├── 09_view_details.feature
│       │   ├── 10_get_reviews.feature
│       │   ├── 11_hotel_review_crud.feature   ← Full CRUD lifecycle
│       │   └── ai_reviews_ep.feature          ← 🤖 AI-generated (EP)
│       └── e2e/                     # 10 UI feature files + AI-generated
│           ├── booking.feature
│           ├── language_switch.feature
│           ├── currency_switch.feature
│           ├── search_filters.feature
│           ├── invalid_login.feature
│           ├── form_validation.feature
│           ├── bva_search_boundaries.feature  ← Boundary Value Analysis
│           ├── ep_login_credentials.feature   ← Equivalence Partitioning
│           ├── decision_table_search_filters.feature ← Decision Table
│           ├── state_transition_booking_flow.feature ← State Transition
│           ├── ai_price_filter_currency_switch.feature ← 🤖 AI-generated (Decision Table, WIP)
│           ├── ai_wishlist_state_transition.feature    ← 🤖 AI-generated (State Transition, WIP)
│           └── ai_guest_count_bva.feature              ← 🤖 AI-generated (BVA, WIP)
└── automation/
    ├── api/
    │   ├── playwright/              # Playwright API step definitions (TS)
    │   ├── cypress/                 # Cypress API step definitions (JS)
    │   ├── curl/                    # 10 cURL scripts with response validation
    │   └── sql/                     # 10 SQL queries (JOINs, CTEs, window fns)
    └── e2e/
        ├── playwright/
        │   ├── pages/               # Page Object Model (TypeScript)
        │   └── steps/               # Step definitions (TypeScript)
        ├── cypress/
        │   ├── pages/               # Page Object Model (JavaScript)
        │   └── steps/               # Step definitions (JavaScript)
        └── fixtures/
            └── world.ts             # Playwright browser/request lifecycle
```

---

## Test Design Techniques

This project demonstrates six core ISTQB test design techniques:

| Technique | Feature file | Coverage |
|-----------|-------------|----------|
| **Boundary Value Analysis** | `bva_search_boundaries.feature` | Guest count (0–31), stay duration |
| **Equivalence Partitioning** | `ep_login_credentials.feature` | Email format classes, password classes |
| **Decision Table** | `decision_table_search_filters.feature` | Filter combinations → expected outcomes |
| **State Transition** | `state_transition_booking_flow.feature` | Full booking lifecycle state machine |
| **Scenario Outline / Pairwise** | `booking.feature`, `invalid_login.feature` | Multi-city search, multi-credential sets |
| **Error Guessing** | `02_login_failure.feature`, `form_validation.feature` | Invalid inputs, empty fields |

---

## Test Suites & Tags

| Suite | Tag | When | Scope |
|-------|-----|------|-------|
| **Acceptance** | `@Acceptance` | Every push to `main` | Core happy paths |
| **Smoke** | `@Smoke` | Nightly (sequential after Acceptance) | Key critical flows |
| **Regression** | `@Regression` | Nightly (sequential after Smoke) | Full coverage |
| **Work In Progress** | `@WIP` | Never in CI (excluded) | Features in development |

---

## API Coverage

| # | Endpoint | Method | Test type |
|---|----------|--------|-----------|
| 01 | `/api/login` | POST | Auth success, token present |
| 02 | `/api/login` | POST | Auth failure, 401 response |
| 03 | `/api/hotels?city=` | GET | City search, result set validation |
| 04 | `/api/hotels?city=&checkin=&checkout=` | GET | Date-filtered availability |
| 05 | `/api/hotels?min_price=&max_price=` | GET | Price range filter |
| 06 | `/api/hotels?currency=` | GET | Currency conversion (USD/EUR/GBP) |
| 07 | `/api/wishlist` | POST | Create wishlist entry |
| 08 | `/api/wishlist/{id}` | DELETE | Remove wishlist entry |
| 09 | `/api/hotel/{id}` | GET | Hotel detail completeness |
| 10 | `/api/hotel/{id}/reviews` | GET | Review list with user & rating |
| 11 | `/api/hotel/{id}/reviews/{id}` | POST/GET/PUT/DELETE | Full CRUD lifecycle |

---

## Getting Started

### Prerequisites

- Node.js 20 LTS
- npm ≥ 9

### Setup

```bash
git clone https://github.com/yaoleshchuk/qa-pet-project.git
cd qa-pet-project
npm ci
npx playwright install chromium --with-deps
```

### Configure environment

```bash
cp .env.example .env
```

Edit `.env` with your test credentials (use a dedicated test account):

```env
BASE_URL=https://www.booking.com
API_URL=https://www.booking.com
TEST_USER_EMAIL=your@email.com
TEST_USER_PASSWORD=yourpassword
```

---

## Running Tests

### Playwright + Cucumber (dry-run — step validation)

```bash
# Validate suite structure without a browser (fast, used in CI).
# The command exits non-zero if any non-WIP step is undefined.
npm run test:pw:dry-run

# Run by suite (dry-run)
npm run test:pw:acceptance
npm run test:pw:smoke
npm run test:pw:regression
```

### API Tests against Mock Server (real execution + Allure)

```bash
# 1. Start the mock API server (Express, port 3001)
npm run mock:start

# 2. In a separate terminal — run tests by suite
npm run test:api:all          # all implemented @API scenarios
npm run test:api:acceptance   # @API + @Acceptance
npm run test:api:smoke        # @API + @Smoke
npm run test:api:regression   # @API + @Regression

# 3. Generate & open the Allure HTML report
npm run allure:generate
npm run allure:open
```

> The mock server simulates all Booking.com API endpoints with realistic seed
> data, enabling fully deterministic test results without network access.

### Cypress

These commands exercise the live UI and are intentionally non-blocking for CI:

```bash
# Interactive runner
npm run test:cypress:open

# Headless
npm run test:cypress:run
npm run test:cypress:acceptance
npm run test:cypress:smoke
```

### cURL scripts (lightweight API smoke checks)

```bash
# Run a single script
BASE_URL=http://localhost:3001 bash tests/automation/api/curl/01_login_success.sh

# Run all scripts
for f in tests/automation/api/curl/*.sh; do
  BASE_URL=http://localhost:3001 bash "$f" && echo
done
```

---

## CI/CD (GitHub Actions)

| Workflow | Trigger | Jobs |
|----------|---------|------|
| [`on-main-acceptance.yml`](.github/workflows/on-main-acceptance.yml) | Push to `main` | `@Acceptance` dry-run |
| [`manual-quality-gate.yml`](.github/workflows/manual-quality-gate.yml) | Manual dispatch | Selectable suite (acceptance / smoke / regression) |
| [`nightly-full-run.yml`](.github/workflows/nightly-full-run.yml) | Daily 00:00 UTC | All three suites sequentially (dry-run) |
| [`api-mock-tests.yml`](.github/workflows/api-mock-tests.yml) | Push to `main`, daily 01:30 UTC, manual dispatch | Real API tests against mock server → Allure report → GitHub Pages |

The dry-run workflows type-check the TypeScript suite and fail on undefined
non-WIP steps without opening a browser. The mock-server workflow runs API
tests for real, fails on test errors, and publishes an Allure HTML report to
GitHub Pages.

> **To enable GitHub Pages**: go to *Settings → Pages → Source* and set it to **GitHub Actions**.

---

## Allure Reports

API tests produce a full **Allure HTML report** automatically on every CI run.

### Live report

> 📊 **[View latest Allure report →](https://yaoleshchuk.github.io/qa-pet-project/)**

The report is published to **GitHub Pages** after every push to `main` and every
nightly run via the [`api-mock-tests.yml`](.github/workflows/api-mock-tests.yml)
workflow. It includes:

- ✅ Pass / ❌ Fail / ⚠️ Broken status per test
- Full step-by-step execution log for each scenario
- Tags, feature grouping, and suite breakdown
- Duration timeline and statistics

### How it works

```
Mock server starts (Express, port 3001)
        ↓
Cucumber runs API tests against mock server
        ↓
allure-cucumberjs writes results to allure-results/
        ↓
allure generate → allure-report/ (HTML)
        ↓
GitHub Pages deploys report → live URL
```

### Run locally

```bash
# Terminal 1 — start mock server
npm run mock:start

# Terminal 2 — run tests and generate report
npm run test:api:acceptance
npm run test:api:smoke
npm run test:api:regression
npm run allure:generate
npm run allure:open        # opens browser automatically
```

---

## SQL Queries

Located in `tests/automation/api/sql/`. Each query matches a specific test scenario and uses advanced SQL to validate data at the database layer:

- Window functions: `RANK()`, `ROW_NUMBER()`, `LAG()`, `PERCENT_RANK()`
- CTEs (Common Table Expressions) for multi-step logic
- `PERCENTILE_CONT` for statistical assertions on review ratings
- `STRING_AGG` for amenity list validation
- Conditional aggregation with `SUM(CASE WHEN … END)`
- Date overlap logic for availability validation

---

## AI Feature Generator

An interactive CLI tool that uses the **Claude API** to generate draft Gherkin `.feature` files from a plain-English description.

### How it works

```
You describe what to test
        ↓
CLI asks: test type, tags, test design technique
        ↓
Claude API generates a draft Gherkin feature tagged @WIP
        ↓
File is saved to tests/manual/features/{e2e|api}/ for review and automation
```

### Setup

Add your Anthropic API key to `.env`:

```env
ANTHROPIC_API_KEY=sk-ant-...
```

Get a key at [console.anthropic.com](https://console.anthropic.com).

### Usage

```bash
npm run ai:generate
```

Example session:

```
╔══════════════════════════════════════╗
║   AI Feature File Generator  🤖       ║
╚══════════════════════════════════════╝

? Describe the feature to test: hotel price filter with currency switch
? Test type (e2e / api): (e2e) e2e
? Tags (e.g. @Smoke @Regression): (@ Smoke @Regression)
  Techniques: 0) none  1) BVA  2) EP  3) Decision Table  4) State Transition  5) Error Guessing
? Test design technique (0–5): (0) 3

  ⏳  Calling Claude API…

  ✅  Feature file generated!
     → tests/manual/features/e2e/decision_table_hotel_price_filter_with_currency_switch.feature
```

Generated files always start with `@WIP`. Remove the tag only after the steps
are implemented and the relevant dry-run profile passes.

---

Built with ☕ by [Yaroslav Oleshchuk](https://linkedin.com/in/yaoleshchuk)
