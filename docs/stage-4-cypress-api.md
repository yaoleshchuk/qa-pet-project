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

Финальное ревью усилило comparator: он сравнивает кратность identity, поэтому
дубликат, пропуск или лишний развернутый `Scenario Outline`/Examples теперь дают
ошибку, как и непрошедший status, включая hidden Before/After hook, либо пустой JSON. CI перед каждым API comparison
явно очищает `reports/cypress-api`, так что JSON от старого запуска не может сделать
текущий job зелёным.
Адресные synthetic JSON controls финального ревью подтвердили exit 1 для missing
duplicate, empty report и failed hidden `After`; сохранённые отчёты реального набора
по-прежнему совпали для 39 scenarios.

CI получает отдельный Cypress API job: он запускает общий Playwright/Cypress набор
на local mock, сравнивает identities и сохраняет JSON, mock log и screenshots при
падении.

## Удалённые результаты

Draft PR [#4](https://github.com/yaoleshchuk/qa-pet-project/pull/4). На implementation
head `27c61b3d1afa3306637f9ff3fceb259927de5fa7` оба workflow завершились success:

| Workflow | Run | Результат |
| --- | --- | --- |
| Static and Dry-run Quality Gate | [36479637359](https://github.com/yaoleshchuk/qa-pet-project/actions/runs/36479637359) | success |
| Real API Tests - Mock Server | [36479637528](https://github.com/yaoleshchuk/qa-pet-project/actions/runs/36479637528) | success; `Real API suites` — 32 s, `Cypress API shared suite against local mock` — 1 m 1 s |

Предыдущий head `54e193b` имел ожидаемо зафиксированную CI-конфигурационную ошибку:
`CYPRESS_INSTALL_BINARY: 1` интерпретировался как запрос binary Cypress v1 и получил
404. Минимальное исправление в `27c61b3` убрало это version override; зависимости не
мигрировались. Локальные и удалённые результаты выше приведены раздельно.

`@WIP` и UI остаются исключёнными: они не заявляются как Cypress API coverage.
