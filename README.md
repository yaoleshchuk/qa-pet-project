# QA Pet Project

This project showcases a complete E2E QA setup using **Gherkin**, **Cypress**, **Playwright**, and **GitHub Actions**, focused on the popular website **Booking.com**

---

## ✅ Main Module: `booking - tests - example`

End-to-end tests for [Booking.com](https://booking.com) using **Gherkin** syntax and modern automation tools.

### ✍ Manual Tests
- All written in **Gherkin** syntax: Scenario, Background, Scenario Outline with parameters
- Tests organized by **test suite** (Acceptance / Smoke / Regression)
- Each test has **priority** (High / Medium / Low) and **ID**
- Covers both `e2e` and `API` flows
- Stored under `/tests/manual/`

### ⚙️ Automation Support

| Tool        | Description                                 |
|-------------|---------------------------------------------|
| **Cypress** | Cross-browser UI tests with reusable steps and selectors |
| **Playwright** | PageObject-based UI tests + API support + `.env` |
| `.env`      | All test data, credentials, and config       |

📦 Automation structure:
```
/tests/
├── manual/                 # Single source of truth for Gherkin features
├── automation/
│   ├── e2e/
│   │   ├── cypress/        # Cypress UI automation
│   │   │   ├── steps/
│   │   │   ├── pages/
│   │   ├── playwright/     # Playwright UI + API automation
│   │   │   ├── steps/
│   │   │   ├── pages/
│   │   │   ├── utils.ts
│   ├── api/                # API automation
```

---

## 🔐 `.env` usage

Environment variables are stored in `.env` (excluded from Git).

Example:
```env
BASE_URL=https://booking.com
TEST_EMAIL=test@example.com
TEST_PASSWORD=12345678
```

Used inside Playwright and Cypress to avoid hardcoded secrets.

---

## 🧪 Quality Gates (GitHub Actions)

CI/CD setup simulates a professional QA workflow:

### ✅ Manual Trigger:
Run **any test suite** (Acceptance / Smoke / Regression) via workflow dispatch

### 🔁 On Merge to `main`:
Auto-run **Acceptance** tests

### 🕐 Daily Scheduled Run:
Auto-run **all tests** (Acceptance + Smoke + Regression) at 01:00 CET

🎯 Allure reports integrated. Acceptance tests are mocked to always pass. Full runs catch simulated failures.

---

## 🚀 Coming Soon

- Full mock AdTech app for simulation
- Test case review bot powered by AI
- SQL & curl-based API checks with coverage

---

Built with ♥ by Yaroslav Oleshchuk
[LinkedIn](https://linkedin.com/in/yaoleshchuk)
