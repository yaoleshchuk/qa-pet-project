# QA Pet Project

A complete QA automation showcase using **Gherkin BDD**, **Cypress**, **Playwright**, and **GitHub Actions**, focused on [Booking.com](https://booking.com).

---

## Tech Stack

| Tool | Purpose |
|------|---------|
| **Gherkin / Cucumber** | BDD feature files — single source of truth for all test scenarios |
| **Cypress** | E2E and API tests (JavaScript) |
| **Playwright** | E2E and API tests (TypeScript) |
| **GitHub Actions** | CI/CD quality gates |

---

## Project Structure

```
booking - tests - example/
├── manual/features/
│   ├── api/             # 10 API feature files
│   └── e2e/             # 6 UI feature files
└── automation/
    ├── api/
    │   ├── cypress/     # Cypress API step definitions
    │   ├── playwright/  # Playwright API step definitions
    │   ├── curl/        # cURL API scripts (bash)
    │   └── sql/         # SQL query examples
    └── e2e/
        ├── cypress/     # Page Objects + step definitions (JS)
        ├── playwright/  # Page Objects + step definitions (TS)
        └── fixtures/    # Playwright world (browser setup/teardown)
```

---

## Getting Started

### Prerequisites

- Node.js >= 20
- npm >= 9

### Setup

```bash
git clone https://github.com/yaoleshchuk/qa-pet-project.git
cd qa-pet-project
npm install
npx playwright install chromium --with-deps
```

### Configure environment

```bash
cp "booking - tests - example/automation/e2e/.env.example" .env
```

Edit `.env`:

```env
BASE_URL=https://www.booking.com
API_URL=https://www.booking.com
TEST_USER_EMAIL=your@email.com
TEST_USER_PASSWORD=yourpassword
DEFAULT_CITY=London
DEFAULT_CHECKIN=2025-06-01
DEFAULT_CHECKOUT=2025-06-05
DEFAULT_ADULTS=2
```

---

## Running Tests

### Playwright + Cucumber

```bash
# Validate test suite structure (dry-run, no browser needed)
npm run test:pw:dry-run

# Run by suite
npm run test:pw:acceptance
npm run test:pw:smoke
npm run test:pw:regression
```

### Cypress

```bash
# Open interactive runner
npm run test:cypress:open

# Run headless
npm run test:cypress:run
npm run test:cypress:acceptance
npm run test:cypress:smoke
```

---

## Test Suites

| Suite | Tag | Priority | Description |
|-------|-----|----------|-------------|
| Acceptance | `@Acceptance` | High | Core happy paths — run on every merge |
| Smoke | `@Smoke` | Medium | Key flows — run daily |
| Regression | `@Regression` | Low | Full coverage — run nightly |

---

## CI/CD (GitHub Actions)

| Workflow | Trigger | Runs |
|----------|---------|------|
| `on-main-acceptance.yml` | Push to `main` | `@Acceptance` suite |
| `manual-quality-gate.yml` | Manual dispatch | Any suite (selectable) |
| `nightly-full-run.yml` | Daily 01:00 CET | All suites sequentially |

---

## Coverage

- **E2E**: Login, hotel search, filters, sorting, currency/language switch, wishlist
- **API**: Auth, search by city/dates/price, currency, wishlist CRUD, hotel details, reviews
- **SQL**: DB-level query examples for test data validation
- **cURL**: Raw HTTP scripts for lightweight API checks

---

Built with love by Yaroslav Oleshchuk — [LinkedIn](https://linkedin.com/in/yaoleshchuk)
