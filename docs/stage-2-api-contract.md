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

## Удалённые проверки PR #2

GitHub Actions проверил review commit `e3fad20b680fe46ee08964a5e5a5175750af1d57`:

- run `35871698667` (`Static and Dry-run Quality Gate`) — typecheck и четыре strict
  dry-run jobs завершились успешно;
- run `35871698816` (`Real API Tests - Mock Server`) — real API job, включая новые
  `npm run lint:api-contract` и `npm run test:api:contract`, завершился успешно;
- Pages job в real API workflow был `skipped`, как и требуется для pull request.

После добавления этого evidence-only изменения проверки финального head должны быть
дожданы отдельно; результат родительского commit не подменяет результат нового SHA.

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

## Разбор зависимостей перед слиянием

Audit выполнен 2026-09-27 на Node.js 22.23.2/npm 10.9.8 отдельно для
`main@7cac7c5` и head PR, с одним и тем же актуальным advisory snapshot. До
исправления оба lockfile давали одинаковые `19` записей: `12 moderate`, `7 high`,
`0 critical`; production-only audit в обоих случаях давал одинаковые три
`moderate` по цепочке `express@4.22.2 -> body-parser@1.20.6/qs@6.15.3`.
Добавленный в PR `@redocly/cli@2.54.2` не добавил ни одной уязвимой цепочки.

Обычный `npm audit fix` без `--force` обновил только совместимые версии в lockfile:
`express 4.22.2 -> 4.22.3`, `body-parser 1.20.6 -> 1.20.8`, их `qs 6.15.3 ->
6.16.0`, `js-yaml 4.3.0 -> 4.3.2` и уязвимые экземпляры `brace-expansion` в
допустимых диапазонах. После этого `npm audit --omit=dev` сообщает `0`
уязвимостей; полный audit — `10 moderate`, `5 high`, `0 critical`.

Оставшиеся записи относятся к существовавшему test toolchain, но не считаются
безопасными только из-за `devDependency`:

- `cypress@13.17.0 -> extract-zip@2.0.1` — high path traversal/arbitrary write при
  распаковке специально подготовленного архива; путь исполняется при установке
  Cypress и важен для developer/CI host, но не достижим HTTP-запросом к mock-серверу;
- `@badeball/cypress-cucumber-preprocessor@20.1.2 -> mocha@10.8.2 ->
  serialize-javascript@6.0.2` — high RCE/DoS требует специально подготовленного
  сериализуемого объекта внутри тестового процесса; не входит в runtime mock-сервера;
- `@cucumber/cucumber@10.9.0 -> tmp@0.2.3` — high path traversal/symlink write
  затрагивает локальные/CI временные файлы при управляемых параметрах пути, но не API;
- связанные `esbuild`, `uuid`, `qs@6.14.2` и агрегирующие записи Cucumber/Cypress
  остаются moderate или наследуют severity вышеперечисленных цепочек.

Автоматический audit предлагает только breaking upgrades: Cypress `16.1.0`,
preprocessor `28.0.0` и Cucumber `13.2.1`. Они затрагивают Cypress-конфигурацию,
step integration и browser execution, поэтому требуют отдельной задачи миграции с
реальными Cypress-прогонами; это не безопасное lockfile-исправление этапа 2.

## Границы

- Это фиксированная учебная модель, не полный Booking.com API: нет persistence,
  конкурентного бронирования, timezone/time-of-day и внешних exchange rates.
- Wishlist сохранён в прежнем минимальном виде; его контракт не расширялся правилами
  reviews. World, Cypress, UI и работы этапов 3–9 не изменялись.
- Strict dry-run проверяет только matching включённых шагов. Ранее учтённые в этапе 1
  31 развёрнутый сценарий / 163 шага под `@WIP` остаются исключёнными и не объявляются
  покрытыми или исправленными.
- GitHub Actions не эмулировался локально; фактические удалённые runs приведены выше.
- Redocly recommended lint имеет 4 не блокирующих warnings: private-проект не объявляет
  license, сервер намеренно localhost, а `/health` и test-only `/api/test/reset` не
  имеют искусственных 4xx responses.
