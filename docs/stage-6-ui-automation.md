# Этап 6: реальные UI-тесты локального стенда

Дата: 2026-09-29. База: `main@8a92f5e`; ветка: `codex/stage-6-ui-automation`.

## Матрица существующих UI-сценариев

| Статус | Сценарии | Решение |
| --- | --- | --- |
| Исполняются на local UI | `booking.feature` (valid login, search/date availability, stars, numeric ascending sort, save), `search_filters.feature`, `decision_table_search_filters.feature`, `currency_switch.feature`, `language_switch.feature`, `invalid_login.feature`, `form_validation.feature`, valid login из `ep_login_credentials.feature` | Помечены `@LocalUI`; Playwright и Cypress запускают только `@LocalUI and not @WIP`. |
| Требовали исправления шагов/предусловий | Currency раньше менялась без результатов; удалённые Booking.com selectors и URL; двухэкранный `Continue` login | Currency получает воспроизводимый local search в Background; Page Objects работают с реальной local form. `Continue` остаётся заполнением первого поля, а фактический `Sign in` отправляет `POST /api/login`. |
| Не поддерживаются учебной моделью | `bva_search_boundaries.feature`, children BVA draft, booking/checkout/cancel state flow, server-side ownership и остальная wishlist state machine | Число гостей не участвует в capacity/availability; нет booking, checkout, cancellation, account ownership или server session. Эти сценарии не удалялись и не помечались `@WIP` ради результата; существующие drafts остаются drafts. |

## Реализация и изоляция

- `npm run test:ui:playwright` и `npm run test:ui:cypress` запускают собственный mock на `127.0.0.1:3106`/`3107`, ждут `/health` максимум 15 секунд и останавливают только дочерний процесс. `UI_TEST_PORT` позволяет выбрать другой порт.
- Перед каждым browser scenario reset выполняется только в выделенном mock данного runner; это изолирует in-memory wishlist, cookies/sessionStorage и не делает global reset сервера, используемого API- или другим UI-набором.
- Playwright создаёт `Page` после `BrowserContext` в Cucumber hook, не создаёт API fixture и сохраняет `failure.png` + `trace.zip` при падении в `reports/ui/playwright/`.
- Cypress использует собственный queued lifecycle (`Before` reset + очистка sessionStorage через `onBeforeLoad`) и сохраняет screenshots в `cypress/screenshots/`.
- Каждая карточка проверяется по фактически включённым stars/WiFi/breakfast, цены проверяются как числа в порядке сортировки, а favourites scoped к видимому favourites-container. Search проверяет введённые даты, URL и известную blocked availability Paris (`2026-07-01..05` исключает `Eiffel Boutique Hotel`).

## Проверки

| Команда | Exit | Результат |
| --- | ---: | --- |
| `npx --no-install tsc --noEmit` | 0 | TypeScript compiled |
| `npm run test:ui:playwright` | 0 | 22 scenarios, 124 passed steps |
| `npm run test:ui:cypress` | 0 | 22 selected `@LocalUI` scenarios passed; unsupported/draft scenarios are not selected |
| `UI_CYPRESS_SPEC=tests/manual/features/e2e/currency_switch.feature npm run test:ui:cypress` | 0 | 3/3 currency examples passed after fresh server response |
| temporary reversed ascending comparator + targeted Playwright sort | non-zero (expected) | Numeric-order assertion failed (195, 350 received vs ascending) |
| temporary omission of checkin/checkout + targeted Playwright date search | non-zero (expected) | Assertion failed because selected date query parameters were absent |

Temporary control mutations were restored before the final code; their diagnostic screenshots/traces are ignored under `reports/ui/playwright/`.

## CI и артефакты

`Real Local UI Tests` has two independent jobs. Both install locked dependencies, start their isolated mock via the UI runner, use readiness timeout/child cleanup, and upload diagnostics on failure. Playwright installs Chromium and uploads `reports/ui/playwright/` (including traces); Cypress uploads `reports/ui/cypress/` and `cypress/screenshots/`.

Local failures are retained at `reports/ui/playwright/<scenario>/failure.png` and `trace.zip`, and `cypress/screenshots/<feature>/...failed.png`. No request is made to Booking.com or another external UI.

## Limitations

The local tests prove only the teaching UI and mock contract. Guest capacity, booking lifecycle, payment, cancellation, server-side authorization/ownership and persistent session semantics remain deliberately outside this stage.
