# Этап 4: Cypress API

Дата: 2026-09-28. Интегрированная база: `main@81021e9`.

`cypress.api.config.js` запускает только shared API Gherkin и разрешает только
loopback URL; API-команды не открывают Booking.com. Обычный Cypress config теперь
выбирает только UI-features. Общий набор — `@API and not @WIP`: 39 scenarios / 127
steps. `scripts/compare-api-scenarios.js` сравнивает URI, развернутый scenario name
и шаги из Cucumber JSON, а также отклоняет непрошедший шаг.

До этапа Cypress не match-ил parameterized URL, проверял только `@loginResponse`,
смешивал API/UI discovery и не имел CRUD/negative steps, prerequisite или cleanup.
Теперь state scenario-local в Cypress hook context; reviews/wishlist адресно
очищаются в `After`, а UPDATE/DELETE подтверждаются отдельным GET в shared feature.

## Локальные результаты

Среда: Node.js 22.23.2 / npm 10.9.8. Рабочая папка воспроизводимо блокировала
`npm ci --offline` на `idealTree buildDeps`; в чистой временной копии та же locked
установка выполнилась за 3 s (498 packages, 0 audit findings). Task-owned mocks
использовали порты 13012--13015 и были остановлены shell traps.

| Проверка | Exit | Результат |
| --- | ---: | --- |
| real Playwright `api-all` | 0 | 39 scenarios / 127 steps passed |
| real Cypress all API | 0 | 39 scenarios passed |
| identity comparison | 0 | identical 39 executed scenarios |
| Cypress `ai_reviews_ep.feature` | 0 | 15 passed |

CI получает отдельный Cypress API job: он запускает общий Playwright/Cypress набор
на local mock, сравнивает identities и сохраняет JSON, mock log и screenshots при
падении. Remote result добавляется только после CI актуального draft PR head.

`@WIP` и UI остаются исключёнными: они не заявляются как Cypress API coverage.
