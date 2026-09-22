# Этап 1: честный CI quality gate

Дата: 2026-09-22. Реализация выполнена поверх рабочей копии этапа 0 на commit
`6272e8a`. Файлы этапа 0 присутствуют локально, но не были отдельным интегрированным
commit в `main`. Во время работы локальный ref `origin/main` переместился на
дивергентную переписанную историю с commit `9c88759`; она не подмешивалась в рабочую
копию, поскольку содержит изменения последующих этапов. Checkout не переключался.

## Что изменено

- `scripts/strict-cucumber-dry-run.ts` запускает выбранный Cucumber-профиль в
  `--dry-run --strict`, всегда пишет JSON и отдельно проверяет статусы шагов.
  Это закрывает поведение Cucumber 10.9.0, возвращавшего exit 0 при `undefined`.
- npm-команды `test:pw:*` теперь явно являются строгими dry-run; добавлена команда
  `typecheck`. `tsconfig.json` включает automation и `scripts/**/*.ts`, поэтому
  AI-генератор также компилируется в CI.
- Static/Dry-run и Real API workflows запускаются на `pull_request` и `push` в
  `main`. Все workflows используют закреплённый Node.js и `npm ci`.
- Dry-run профили выполняются матрицей с `fail-fast: false`; JSON загружается с
  `if: always()` и `if-no-files-found: error`.
- Реальные API-наборы запускаются последовательно, но каждый — на заново поднятом
  mock-сервере. Readiness завершается ошибкой после 15 секунд. Код каждого набора
  записывается, после всех наборов возвращается общий ненулевой exit.
- JSON, Allure results, HTML и логи mock-сервера сохраняются после падения. Ошибка
  генерации Allure также превращается в ошибку job.
- Pages deployment вынесен в отдельный job с отдельными write-permissions и условием,
  запрещающим публикацию из `pull_request`.

## Проверки на закреплённой среде

Среда: Node.js 22.23.2, npm 10.9.8.

| Команда | Exit | Результат |
| --- | ---: | --- |
| `npm ci --offline` | 0 | 495 packages; audit: 0 vulnerabilities |
| `npm run typecheck` | 0 | automation и scripts скомпилированы |
| `npm run test:pw:dry-run` | 1 | 103 scenarios: 42 undefined / 61 skipped; JSON сохранён |
| `npm run test:pw:acceptance` | 0 | 24 scenarios skipped в dry-run; 0 undefined |
| `npm run test:pw:smoke` | 1 | 35 scenarios: 17 undefined / 18 skipped; JSON сохранён |
| `npm run test:pw:regression` | 1 | 78 scenarios: 42 undefined / 36 skipped; JSON сохранён |
| real `api-acceptance` | 0 | 14 passed; 43 steps passed |
| real `api-smoke` | 1 | 6 passed / 3 undefined; 14 passed / 6 undefined / 6 skipped steps |
| real `api-regression` | 1 | 4 passed / 15 undefined; 8 passed / 18 undefined / 30 skipped steps |
| Allure generation from final API run | 0 | `index.html` создан |
| YAML parse всех четырёх workflows | 0 | синтаксис прочитан Ruby/Psych |
| `git diff --check` | 0 | whitespace errors отсутствуют |

API-проверки выполнялись на отдельном порту 13004; mock перезапускался перед каждым
профилем и был остановлен после серии. Результаты писались в свежий игнорируемый
каталог `reports/stage1-pinned/`.

## Контрольная поломка

Временный `@API @Acceptance` сценарий ожидал HTTP 599 от успешного login-запроса,
который вернул 200. Реальный API-профиль завершился с exit 1: 15 scenarios,
14 passed / 1 failed; 45 steps, 44 passed / 1 failed. Несмотря на падение,
`reports/stage1-control/api-acceptance-broken.json` и Allure HTML были созданы.
Временный feature-файл удалён, затем штатный Acceptance повторно прошёл 14/14.

## Ограничения

- Красные strict Default/Smoke/Regression и реальные API Smoke/Regression — это
  известные отсутствующие шаги из baseline этапа 0. Они не скрыты и не исправлялись
  вне объёма этапа 1.
- GitHub Actions удалённо не запускались в этой задаче. Локально проверены YAML,
  команды, агрегация exit-кодов и отчёты; ветка ошибки readiness проверена ревью кода,
  но отдельный 15-секундный timeout в runner не симулировался.
- Системный Node.js 25.6.0 не использовался для финальных результатов; итоговая серия
  выполнена закреплённым Node.js 22.23.2 из среды этапа 0.
