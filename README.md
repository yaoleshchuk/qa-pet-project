# 🧪 Booking UI Tests — Real-World QA Automation Project

This project showcases a complete E2E QA setup using **Gherkin**, **Cypress**, **Playwright**, and **GitHub Actions**, focused on the popular website **Booking.com**.

---

## 📁 Project Directory: `booking-ui-tests/`

A self-contained folder with everything you need:
- ✍️ **Manual test cases** written in Gherkin (Background, Outline, Examples)
- ⚙️ **Cypress automation** (JS, Cucumber, Page Object, `.env`)
- 🧭 **Playwright automation** (TS, Cucumber, Page Object, `.env`)
- ✅ Shared Gherkin source — no duplication
- 🧪 Multi-tag test strategy: `@Acceptance`, `@Smoke`, `@Regression`
- 🏷️ Prioritized: `# Priority: High|Medium|Low`
- 🔐 Configurable with `.env` and `.env.example`

---

## 🚦 CI/CD — Quality Gates with GitHub Actions

All tests are fully integrated into a CI flow that includes:

### ✅ Manual Workflow Trigger
Run tests on demand via the GitHub UI.
- Choose between `acceptance`, `smoke`, or `regression`
- Mocks test results, always green
- Allure report generated for demo purposes

🔗 `.github/workflows/manual-quality-gate.yml`

---

### 🔁 Auto Trigger on `main` Push
Every push to `main` runs the **@acceptance** tests.
- Ensures critical flows always stay green
- Lightweight, stable CI signal

🔗 `.github/workflows/on-main-acceptance.yml`

---

### 🌙 Nightly Full Run
Scheduled to run every day at **01:00 CET**
- Simulates full regression run with "detected" bugs
- Mocks failing tests to show potential issues
- Allure report included

🔗 `.github/workflows/nightly-full-run.yml`

---

## 🛠 Usage Instructions

```bash
# Install dependencies
npm install

# Run Cypress
npx cypress open

# Run Playwright
npx playwright test

# Setup environment variables
cp .env.example .env
```

---

## 🙌 Author

Crafted by **Yaroslav Oleshchuk**  
Senior QA Engineer | AdTech Specialist | Automation Addict  
[LinkedIn](https://linkedin.com/in/yaoleshchuk)

