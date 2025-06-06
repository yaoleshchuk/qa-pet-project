# QA Pet Project — Real-World Testing Practice

This is a hands-on QA portfolio demonstrating modern testing practices across manual and automated workflows.  
The project includes Gherkin-based E2E test cases for Booking.com, run using both Playwright and Cypress, with full Page Object support, environment variable handling, and cross-browser automation.

---

## 📦 Project Structure

```
qa-pet-project/
├── .env.example                  # Template for secrets/config
├── .env                          # Local config (excluded from Git)
├── 01-open-site-tests/          # E2E UI tests (manual + automation)
│   ├── manual-tests/            # Gherkin feature files
│   ├── ui-tests/
│   │   ├── playwright/          # TS tests with Cucumber + POM + dotenv
│   │   └── cypress/             # JS tests with Cucumber + POM + cross-browser
├── 02-adtech-simulation/        # Mock AdTech test simulation
├── 03-ai-review-bot/            # AI bot for test review
├── 04-gherkin-api-sql/          # Gherkin + API + SQL examples
```

---

## 🔧 Tech Stack

- Manual Testing: Gherkin
- UI Automation: Playwright (TypeScript), Cypress (JavaScript)
- CI Ready: GitHub Actions
- Page Object Model + modular reusable steps
- Secure env config via `.env` and `dotenv`

---

## 🔑 Environment Variables

Defined in `.env` (ignored by git), sample in `.env.example`.

```env
BASE_URL=https://www.booking.com
BROWSER=chromium
TEST_USER_EMAIL=testuser@example.com
TEST_USER_PASSWORD=correct_password
DEFAULT_CITY=Paris
DEFAULT_CHECKIN=2025-07-01
DEFAULT_CHECKOUT=2025-07-05
DEFAULT_ADULTS=2
```

---

## 🚀 Quick Start

```bash
# Install dependencies (in Cypress/Playwright folder)
npm install

# Copy and edit env file
cp .env.example .env

# Run Playwright tests
npx playwright test

# Run Cypress tests
npx cypress open
```

---

## 👤 Author

**Yaroslav Oleshchuk**  
QA Engineer | AdTech Expert | Manual + Automation  
[LinkedIn](https://linkedin.com/in/yaoleshchuk)
