# Этап 6: реальные UI-тесты локального стенда

Дата: 2026-09-29. База: `main@8a92f5e`; ветка: `codex/stage-6-ui-automation`.

## Матрица существующих UI-сценариев

| Статус | Сценарии | Решение |
| --- | --- | --- |
| Исполняются на local UI | `booking.feature` (7: valid login, 3 Examples search/date availability, stars, numeric ascending sort, save), `currency_switch.feature` (3 Examples), `decision_table_search_filters.feature` (4), valid login из `ep_login_credentials.feature` (1), `form_validation.feature` (1), `invalid_login.feature` (2 Examples), `language_switch.feature` (3 Examples), `search_filters.feature` (1) | Итого 22. Помечены `@LocalUI`; Playwright и Cypress запускают только `@LocalUI and not @WIP`. |
| Требовали исправления шагов/предусловий | Currency раньше менялась без результатов; удалённые Booking.com selectors и URL; двухэкранный `Continue` login | Currency получает воспроизводимый local search в Background; Page Objects работают с реальной local form. `Continue` остаётся заполнением первого поля, а фактический `Sign in` отправляет `POST /api/login`. |
| Не поддерживаются учебной моделью | `bva_search_boundaries.feature`, children BVA draft, booking/checkout/cancel state flow, server-side ownership и остальная wishlist state machine | Число гостей не участвует в capacity/availability; нет booking, checkout, cancellation, account ownership или server session. Эти сценарии не удалялись и не помечались `@WIP` ради результата; существующие drafts остаются drafts. |

## Реализация и изоляция

- `npm run test:ui:playwright` и `npm run test:ui:cypress` запускают собственный mock на `127.0.0.1:3106`/`3107`, ждут `/health` максимум 15 секунд и останавливают только дочерний процесс. `UI_TEST_PORT` позволяет выбрать другой порт.
- Перед каждым browser scenario reset выполняется только в выделенном mock данного runner; это изолирует in-memory wishlist, cookies/sessionStorage и не делает global reset сервера, используемого API- или другим UI-набором.
- Playwright создаёт `Page` после `BrowserContext` в Cucumber hook, не создаёт API fixture и сохраняет `failure.png` + `trace.zip` при падении в `reports/ui/playwright/`.
- Cypress использует собственный queued lifecycle (`Before` reset + очистка sessionStorage через `onBeforeLoad`) и сохраняет screenshots в `cypress/screenshots/`.
- Cypress `testIsolation: true` закреплён явно; Playwright создаёт новый BrowserContext/Page на каждый scenario.
- Перед Cypress run тот же Cucumber tag selection записывается как manifest; Cypress записывает свои totals. Runner завершится ошибкой при пустом selection, failed test или если число passed не равно manifest. Поэтому WIP/исключённые сценарии учитываются отдельно как pending, но не могут создать ложный зелёный результат.
- Каждая карточка проверяется по фактически включённым stars/WiFi/breakfast, цены проверяются как числа в порядке сортировки, а favourites scoped к видимому favourites-container. Search проверяет введённые даты, URL и известную blocked availability Paris (`2026-07-01..05` исключает `Eiffel Boutique Hotel`).

## Проверки

| Команда | Exit | Результат |
| --- | ---: | --- |
| `npx --no-install tsc --noEmit` | 0 | TypeScript compiled |
| `npm run test:ui:playwright` | 0 | 22 scenarios, 124 passed steps |
| `npm run test:ui:cypress` | 0 | 22 selected `@LocalUI` scenarios passed; Cypress manifest/totals require exactly 22 passed |
| `UI_CYPRESS_SPEC=tests/manual/features/e2e/currency_switch.feature npm run test:ui:cypress` | 0 | 3/3 currency examples passed after fresh server response |
| temporary reversed ascending comparator + targeted Playwright sort | non-zero (expected) | Numeric-order assertion failed (195, 350 received vs ascending) |
| temporary omission of checkin/checkout + targeted Playwright date search | non-zero (expected) | Assertion failed because selected date query parameters were absent |

Temporary control mutations were restored before the final code; their diagnostic screenshots/traces are ignored under `reports/ui/playwright/`.

### Финальное ревью

- Tag manifest содержит ровно 22 исполняемых instances: `booking 7`, `currency 3`, `decision table 4`, `EP valid 1`, `form 1`, `invalid login 2`, `language 3`, `search filters 1`. Playwright и Cypress используют это же выражение и набор, включая все строки Examples.
- Cypress full run: `totalTests: 68`, `totalPassed: 22`, `totalFailed: 0`, `totalPending: 46`. Из pending: 31 существующий `@WIP` (AI drafts и booking state flow) и 15 non-WIP исключений модели (9 BVA guests/dates + 6 invalid EP credentials). Runner сверяет `totalPassed` с manifest и завершает run ошибкой при любом mismatch.
- Targeted normal sort Playwright после control restore: 1 scenario / 4 passed steps. Control sort и date runs ранее дошли до самих assertions и сохранили непустые `failure.png` и `trace.zip`; это не readiness/launch timeout.

## CI и артефакты

`Real Local UI Tests` has two independent jobs. Both install locked dependencies, start their isolated mock via the UI runner, use readiness timeout/child cleanup, and upload diagnostics on failure. Playwright installs Chromium and uploads `reports/ui/playwright/` (including traces); Cypress uploads `reports/ui/cypress/` and `cypress/screenshots/`.

Local failures are retained at `reports/ui/playwright/<scenario>/failure.png` and `trace.zip`, and `cypress/screenshots/<feature>/...failed.png`. No request is made to Booking.com or another external UI.

## Limitations

The local tests prove only the teaching UI and mock contract. Guest capacity, booking lifecycle, payment, cancellation, server-side authorization/ownership and persistent session semantics remain deliberately outside this stage.
