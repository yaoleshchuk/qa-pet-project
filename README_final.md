# 🧪 QA Pet Project — Booking UI Testing

This repository demonstrates a real-world QA setup built from scratch using **Gherkin**, **Cypress**, **Playwright**, and **GitHub Actions CI/CD** — all centered around testing a public website: **Booking.com**.

---

## 🔍 What’s Inside `01-open-site-tests/`

> A complete E2E testing setup for Booking.com with:
- ✅ **Manual test cases** written in clean Gherkin syntax with Backgrounds and Scenario Outlines
- 🧪 **Cypress automation** using Cucumber, Page Object Model, and regex-powered reusable step definitions
- 🧭 **Playwright automation** with the same Gherkin source and mirrored test coverage
- 🌍 Multi-language & currency switch coverage
- 🔐 Login form validation
- 🧠 Form field testing
- 🧩 Advanced filters and dynamic search results

### ✨ Test Design Features
- Full support for `Background`, `Scenario Outline`, and `Examples`
- Tagged scenarios: `@Acceptance`, `@Smoke`, `@Regression`
- Priorities: `High`, `Medium`, `Low`
- `.env` file support to secure test data and auth credentials
- Organized by roles: **features**, **steps**, **pages**
- DRY structure: no Gherkin duplication between manual & automation

---

## 🚦 CI/CD — Quality Gates (GitHub Actions)

A modern, layered testing flow powered by **GitHub Actions**, designed with visibility and control in mind:

### 🔘 Manual Quality Gate
Run any group of tests manually by selecting the tag (`acceptance`, `smoke`, `regression`) from the UI.

📁 File: `.github/workflows/manual-quality-gate.yml`

> ✅ Always green — tests are mocked to simulate successful runs  
> 📊 Allure report is generated and archived (mocked)

---

### 🔁 Auto-Run on Main Push
Whenever code is merged into `main`, **only the `@acceptance` tests** are triggered automatically.

📁 File: `.github/workflows/on-main-acceptance.yml`

> 🎯 Fast validation of the most critical flows  
> 🔐 Report archived, no flaky test risk (mocked pass)

---

### 🌙 Nightly Full Test Suite
Runs every night at **01:00 CET**. Executes:
- ✅ Acceptance tests
- ✅ Smoke tests
- ❌ Regression tests (mocked to simulate bugs)

📁 File: `.github/workflows/nightly-full-run.yml`

> 🔎 This flow simulates bug detection  
> 🛠️ Artifacts show issues in `regression` suite

---

## ⚙️ Usage & Setup

1. Clone the repo
2. Create `.env` file from `.env.example`
3. Run locally with:
```bash
npx cypress open
# or
npx playwright test
```

> No test will fail without env setup — default mocks are used in CI.

---

## ✍️ Author

Built by **Yaroslav Oleshchuk** — QA engineer, traveler, and automation enthusiast.  
Let's break some UIs and ship great products 🚀
