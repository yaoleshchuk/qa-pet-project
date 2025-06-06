# QA Pet Project 🧪

This repository demonstrates modern QA practices using manual and automated testing for a public website (Booking.com clone).

---

## 📁 Project Structure

```
qa-pet-project/
├── features/                      # All Gherkin test cases (manual + automation source of truth)
│   ├── booking.feature
│   ├── language_switch.feature
│   └── ...
│
├── tests/
│   ├── playwright/
│   │   ├── steps/                # Cucumber step definitions for Playwright
│   │   └── pages/                # Page Object classes
│   │
│   └── cypress/
│       ├── steps/                # Step definitions for Cypress
│       └── pages/                # Page Object functions
│
├── .env.example                   # Environment variables (use `.env` in local)
└── README.md
```

---

## 🧪 Test Types

- ✅ Manual scenarios in Gherkin syntax
- ⚙️ Cypress automation with Cucumber
- 🧭 Playwright automation with Cucumber
- 🔁 Parameterized `Scenario Outline` examples
- 🎯 Tagged by `@Acceptance`, `@Smoke`, `@Regression`
- ⏱️ Priority labels: `High`, `Medium`, `Low`

---

## 🚀 Getting Started

### Setup Cypress
```bash
npm install
npx cypress open
```

### Setup Playwright
```bash
npm install
npx playwright install
npx playwright test
```

### .env Configuration

Create a `.env` file like this:
```env
BASE_URL=https://www.booking.com
TEST_EMAIL=your@email.com
TEST_PASSWORD=yourpassword
```

---

## 🌍 Author

Created by **Yaroslav Oleshchuk** — QA Engineer, Traveler, and AI Enthusiast  
