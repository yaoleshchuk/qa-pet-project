# Этап 8: отчётность, cURL и документация

Дата: 2026-10-28. База: `main@d4ed016`. Ветка: `codex/stage-8-reporting-docs`.

## Изменения

- README содержит проверяемую матрицу покрытия. Она разделяет real API/UI, strict
  dry-run, `@WIP`, модельные исключения и SQL и не складывает реализации одного
  Gherkin-набора как уникальные сценарии.
- `scripts/run-api-suite.js` удаляет только свой ignored каталог
  `reports/api/latest/`, требует текущие непустые Cucumber JSON и Allure results.
  `allure:generate` также отказывается строить HTML без текущих results.
- CI добавляет Allure formatter, когда добавляет JSON formatter: иначе CLI formatter
  заменяет профильный список и Allure results не появляются. UI-runner очищает только
  свой `reports/ui/<runner>/` перед запуском, исключая stale Cypress totals.
- CI также требует хотя бы один текущий `*-result.json` перед генерацией Allure HTML:
  заранее созданный пустой results directory не может дать зелёный report step.
- Десять cURL scripts используют local mock по умолчанию, HTTP status, Node JSON parse,
  5/15-second curl timeouts, reset и cleanup wishlist. Bash 3-compatible syntax не
  требует `jq` или Python.
- SQL объявлен учебным: DB harness, DB connection и executable SQL tests отсутствуют.

## Локальная проверка (macOS arm64)

Node `22.23.2`, npm `10.9.8`:

| Команда | Exit | Результат |
| --- | ---: | --- |
| `npm run typecheck` | 0 | TypeScript compiled. |
| `npm run test:pw:dry-run` | 0 | 76 scenarios / 259 skipped steps; 0 undefined, 0 ambiguous. |
| `npm run test:pw:acceptance` | 0 | 24 / 83 skipped; 0 undefined, 0 ambiguous. |
| `npm run test:pw:smoke` | 0 | 21 / 81 skipped; 0 undefined, 0 ambiguous. |
| `npm run test:pw:regression` | 0 | 51 / 173 skipped; 0 undefined, 0 ambiguous. |
| ten `tests/automation/api/curl/*.sh` against task-owned mock | 0 | 10/10 passed. |
| `npm run test:api:acceptance` | 0 | 14 scenarios / 49 steps passed; current JSON and Allure results produced. |
| `npm run allure:generate` | 0 | HTML produced only from `reports/api/latest/allure-results/`. |
| `npm run test:curl:smoke` | 0 | 10/10 passed on a private mock at `127.0.0.1:3218`; health failed after child shutdown. |

## Чистая временная копия

В новой temporary copy, созданной из Git archive plus текущий stage diff, без `.env`,
с отдельными `npm_config_cache` и `PLAYWRIGHT_BROWSERS_PATH`: `npm ci`,
`npx --no-install playwright install chromium`, `npm run typecheck` и
`npm run test:pw:dry-run` завершились с exit 0. Chromium установлен в временный
каталог, не из существующего browser cache.

Проверена macOS. Linux не запускался локально; cURL использует переносимый Bash 3
синтаксис и стандартные curl/Node options, но это compatibility claim, не второй
фактический platform run.

## Linux CI и изоляция cURL

До этого этапа Linux CI не запускал cURL-набор. Workflow `api-mock-tests.yml` теперь
запускает `npm run test:curl:smoke` после contract checks в `ubuntu-latest`. Runner
создаёт свой mock на `127.0.0.1:3218`, передаёт scripts единственный opt-in marker,
ждёт readiness и завершает только дочерний PID. Сами scripts отказываются работать без
`CURL_DEDICATED_MOCK=1`; поэтому их reset/wishlist cleanup не может затронуть mock,
которым владеет API/UI runner. Удалённый Linux результат будет добавлен только после
успешного push и CI актуального SHA.

Runner additionally waits for its child process's own listen message before accepting
`/health`; a foreign process returning 200 on the same port is not sufficient.
Адресная macOS-проверка заняла 3218 отдельным task-owned mock, добавила wishlist 321,
затем запустила cURL runner: он завершился `1` с `EADDRINUSE`/"exited before readiness",
а wishlist остался `{"wishlist":[321]}`. Следовательно, cURL scripts не запускались и
не отправили reset чужому процессу.

### Удалённый результат

На draft PR #8 для `a2cb6163e7305e160c2e7bf2dff492be976c1393` GitHub Actions
`Real API suites against local mock` завершился success за 38 s на `ubuntu-latest`.
Его log подтверждает `npm run test:curl:smoke`, private mock на 3218 и десять
последовательных строк PASS: login success, login rejection, city search, dated search,
price filter, USD/EUR/GBP, wishlist add/remove, hotel details и reviews. Это фактический
Linux run, не compatibility claim. В том же head прошли Cypress API (58 s), Playwright
UI (50 s), Cypress UI (1m37s), typecheck (28 s) и все четыре strict dry-run profiles
(17–25 s). Pages skipped ожидаемо для PR.

## Публикация и границы

Не выполнялись внешний AI API, этап 9, DB harness и major audit migration. Для
публикации использован изолированный profile
`/Users/yaroslav/.config/gh-qa-pet-personal`; вне task sandbox тот же `gh`, API и
credential helper подтвердили доступ, после чего обычный HTTPS push создал draft PR #8.
SSH remote, global helper и рабочие credentials не менялись. Локальные результаты выше
не являются CI evidence. Исторические evidence предыдущих этапов не изменялись.

## Почему Acceptance содержит 49 видимых шагов

Текущий JSON `api-acceptance` содержит 14 scenario instances, 49 не-hidden Gherkin
steps и 28 hidden passed hook entries (один Before и один After на scenario), то есть
77 JSON entries. Cucumber summary поэтому показывает 49 steps. Исторические 43 были
сняты до расширения принятых CRUD/assertion steps; это не изменение счётчика или
ослабление assertions, а шесть добавленных видимых шагов в актуальных feature files.
