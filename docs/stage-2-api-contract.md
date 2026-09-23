# Этап 2: API-контракт и mock-сервер

Дата: 2026-09-23. Исходная интегрированная база: `main` на commit
`7cac7c598559a907926c1289741a5eb751925658`. Рабочая ветка:
`codex/stage-2-api-contract`.

Исторические результаты этапов 0 и 1 в `baseline-stage-0.md`, `stage-1-ci.md` и
`stage-1-integration.md` не изменялись.

## Сопоставление с исходным кодом

До этапа уже существовали seed reviews, базовый CRUD, POST-проверки rating `1..5` и
comment `1..500`, символы трёх валют и сброс памяти при рестарте процесса. При этом
PUT принимал любые значения, review не связывался с hotel из URL, DELETE всегда
возвращал `204`, даты игнорировались, а currency меняла только символ.

Принятые решения зафиксированы в [api-contract.md](api-contract.md) и
[api-contract.yaml](api-contract.yaml):

- `400` означает ошибку структуры/типа/синтаксиса запроса; `422` — допустимо
  разобранные данные, нарушающие value/business rule;
- POST требует rating и comment, PUT является частичным и требует хотя бы одно поле;
  оба используют одну валидацию, отклоняют лишние поля и нормализуют comment через trim;
- неизвестный hotel и отсутствующий/чужой review дают `404`; повторный DELETE — `404`;
- реальные ISO-даты образуют полуоткрытый stay `[checkin, checkout)`, который
  сопоставляется с двумя фиксированными интервалами занятости;
- EUR seed price умножается на фиксированные курсы `EUR=1`, `USD=1.10`, `GBP=0.85`,
  округляется до двух знаков, затем к нему применяется price filter;
- `POST /api/test/reset` восстанавливает reviews, wishlist и next review ID.

Существующие Gherkin-сценарии для семантически неверного rating/comment переведены с
ожидания `400` на контрактный `422`; assertions не удалялись и не ослаблялись.

## Ревью draft PR #2

Повторное ревью выполнено относительно актуального remote `main` на том же commit
`7cac7c5`; remote head PR перед исправлениями был `bd21059`. Существенные замечания и
исправления остались в границах этапа 2:

- OpenAPI recommended lint требовал operation summaries и явного объявления
  публичной модели; добавлены `summary` и root `security: []`;
- OpenAPI разрешал только uppercase currency codes, а сервер принимал lowercase;
  сервер приведён к документированному регистрозависимому поведению;
- integer seed prices не доказывали округление; цена hotel `1` стала `180.07` EUR,
  а тест проверяет точные `198.08` USD и `153.06` GBP;
- negative coverage расширен unknown fields, 501-char comment, PUT type/range,
  foreign GET/PUT/DELETE, malformed/reversed price range и lowercase currency;
- Redocly CLI 2.54.2 закреплён в lockfile, OpenAPI lint включён рядом с contract-test
  в real API CI job.

Contract-test обращается к приложению только по HTTP и не импортирует rates, seed,
validation helpers или функции расчёта ожидаемых значений. Две временные контрольные
мутации не вошли в commit: замена review `422` на `400` дала exit 1 и 2 failed tests;
инверсия availability filtering дала exit 1 и 1 failed test. После возврата исходного
поведения финальный contract-test снова прошёл 10/10.

## Проверки на закреплённой среде

Среда: macOS arm64, Node.js 22.23.2, npm 10.9.8.

| Команда / профиль | Exit | Фактический результат |
| --- | ---: | --- |
| `npm ci` | 0 | 498 packages; audit: 19 vulnerabilities (12 moderate, 7 high) |
| `npm run lint:api-contract` | 0 | Redocly: valid OpenAPI; 4 documented warnings |
| `npm run typecheck` | 0 | TypeScript automation и scripts скомпилированы |
| `npm run test:api:contract` | 0 | 10 passed, 0 failed/skipped |
| `npm run test:pw:dry-run` | 0 | 76 scenarios skipped; 0 undefined / ambiguous |
| `npm run test:pw:acceptance` | 0 | 24 scenarios skipped; 0 undefined / ambiguous |
| `npm run test:pw:smoke` | 0 | 21 scenarios skipped; 0 undefined / ambiguous |
| `npm run test:pw:regression` | 0 | 51 scenarios skipped; 0 undefined / ambiguous |
| real `api-acceptance` | 0 | 14 scenarios / 43 steps passed |
| real `api-smoke` | 0 | 9 scenarios / 26 steps passed |
| real `api-regression` | 0 | 19 scenarios / 56 steps passed |

Чистая установка сначала была запущена системными Node.js 25.6.0/npm 11.8.0 и
корректно не использована как доказательство: npm показал engine warning, а sandbox
запретил запись в пользовательский Cypress cache. Затем через nvm установлена и
проверена закреплённая версия, checksum дистрибутива совпал, и `npm ci` завершился.
Изменение зависимостей и исправление npm audit не входят в этап 2.

Contract-test сначала подтвердил ограничение sandbox `listen EPERM`; фактический
набор выполнен с разрешённым loopback. Финальные прогоны после ревью запускались на
отдельном порту `13008`; перед каждым профильным запуском mock перезапускался и после
него останавливался. JSON, Allure results и mock logs сохранены в новом игнорируемом
`reports/stage2-review-final/`, без смешивания с историческими результатами.

## Что именно проверяет новый contract-test

- граничные валидные rating/comment и нормализацию comment;
- различие `400` и `422`, включая malformed JSON;
- частичный PUT, общую валидацию и отсутствие мутации после отказа;
- неизвестный hotel и чужой review;
- первый и повторный DELETE;
- неверные/неполные даты и обратный интервал;
- изменение выдачи при пересечении занятости и граничный соседний интервал;
- точные числовые цены в EUR/USD/GBP и filtering в валюте ответа;
- восстановление seed и детерминированного next ID через reset.

## Границы

- Это фиксированная учебная модель, не полный Booking.com API: нет persistence,
  конкурентного бронирования, timezone/time-of-day и внешних exchange rates.
- Wishlist сохранён в прежнем минимальном виде; его контракт не расширялся правилами
  reviews. World, Cypress, UI и работы этапов 3–9 не изменялись.
- Strict dry-run проверяет только matching включённых шагов. Ранее учтённые в этапе 1
  31 развёрнутый сценарий / 163 шага под `@WIP` остаются исключёнными и не объявляются
  покрытыми или исправленными.
- GitHub Actions локально не исполнялся; workflow дополнен командой contract-test,
  а после ревью также OpenAPI lint. Удалённые результаты фиксируются отдельно после
  выполнения checks актуального head PR.
- Redocly recommended lint имеет 4 не блокирующих warnings: private-проект не объявляет
  license, сервер намеренно localhost, а `/health` и test-only `/api/test/reset` не
  имеют искусственных 4xx responses.
