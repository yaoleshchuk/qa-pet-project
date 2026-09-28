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
Для отказавшего assertion Cypress использует одноразовый `fail`-handler с синхронным
loopback DELETE: очередь Cypress отменяет обычные queued commands после failure,
поэтому этот путь нужен именно для гарантии cleanup данных сценария.

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

Дополнительные проверки выполнены на чистом task-owned mock `localhost:13021`.
Временные control-features существовали только в ignored `reports/`/временной копии
и не добавлялись в общий набор или в репозиторий.

| Проверка | Playwright | Cypress | Результат |
| --- | ---: | ---: | --- |
| Контрольная ошибка ответа (`expected 599`) | 1 | 2 | оба runner-а обнаружили реальные `401` и `201`, а не приняли ошибочный expected status |
| Cleanup после намеренно упавшего create-review assertion | 1 | 2 | последующий `GET /api/hotel/321/reviews` содержит только seed IDs `1,2,3` |
| Самостоятельный общий сценарий `Get full info about hotel` | 0 | 0 | по одному passed scenario в каждом runner-е |
| Переставленный порядок `reviews → details` | 0 | 0 | по два passed scenario в каждом runner-е |

Финальный общий прогон выполнялся на новом чистом task-owned mock
`localhost:13022`: Playwright — 39/127, Cypress — 39/39, identity comparison — 39.
`npx --no-install tsc --noEmit` завершился с exit 0. На Apple Silicon Cypress 13.17.0
печатал нефатальное предупреждение о x86 helper `term-size` и очистке предыдущих
results; реальные API runs завершились exit 0.

CI получает отдельный Cypress API job: он запускает общий Playwright/Cypress набор
на local mock, сравнивает identities и сохраняет JSON, mock log и screenshots при
падении. Remote result добавляется только после CI актуального draft PR head.

`@WIP` и UI остаются исключёнными: они не заявляются как Cypress API coverage.
