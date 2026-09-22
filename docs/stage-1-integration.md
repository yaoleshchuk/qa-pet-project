# Этап 1: интеграционная проверка перед PR

Дата: 2026-09-22. Проверяемая база PR: `origin/main` на commit
`9c88759b25e2a45baefe19ed9f1a851881ce1ae8`.

Историческая baseline этапа 0 на `6272e8a` сохранена без подмены результатов в
[baseline-stage-0.md](baseline-stage-0.md). Историческая первая проверка этапа 1
сохранена в [stage-1-ci.md](stage-1-ci.md). Этот документ содержит отдельные
результаты после переноса недостающих улучшений поверх актуального `main`.

## Состав интеграции

- Сохранён существующий `scripts/validate-cucumber-profile.js`; текстовый поиск
  `undefined` заменён чтением Cucumber JSON. Validator запускает `--strict`, пишет
  отдельный JSON для каждого профиля и падает при `undefined` или `ambiguous`.
- PR и nightly запускают четыре dry-run профиля независимо с `fail-fast: false`,
  поэтому один красный профиль не скрывает остальные. Артефакт обязателен даже при
  падении.
- Реальные API-наборы перезапускают mock перед каждым профилем, завершают readiness
  ошибкой после 15 секунд, записывают каждый exit и возвращают общий gate после всех
  выбранных наборов.
- JSON, Allure results, HTML и логи mock сохраняются после падения. Pages имеет
  отдельные write-permissions и не запускается для `pull_request`.
- Node.js 22.23.2 и npm 10.9.x закреплены в `.nvmrc`, `package.json`, lockfile и CI.
  Typecheck включает automation и `scripts/**/*.ts`. Неиспользуемая в этих jobs
  загрузка Cypress binary отключена; npm-пакет Cypress по-прежнему устанавливается.

## Результаты на закреплённой среде

Среда: Node.js 22.23.2, npm 10.9.8.

| Команда / профиль | Exit | Фактический результат |
| --- | ---: | --- |
| `npm ci --offline` | 0 | 497 packages; audit: 0 vulnerabilities |
| `npm run typecheck` | 0 | automation и scripts скомпилированы |
| `npm run test:pw:dry-run` | 0 | 76 scenarios skipped; 0 undefined / ambiguous |
| `npm run test:pw:acceptance` | 0 | 24 scenarios skipped; 0 undefined / ambiguous |
| `npm run test:pw:smoke` | 0 | 21 scenarios skipped; 0 undefined / ambiguous |
| `npm run test:pw:regression` | 0 | 51 scenarios skipped; 0 undefined / ambiguous |
| real `api-acceptance` | 0 | 14 scenarios / 43 steps passed |
| real `api-smoke` | 0 | 9 scenarios / 26 steps passed |
| real `api-regression` | 0 | 19 scenarios / 56 steps passed |
| Allure generation from real API run | 0 | HTML `index.html` создан |

API-проверки выполнялись на отдельном порту 13005; mock перезапускался перед каждым
профилем и был остановлен после серии. Результаты сохранены в свежем игнорируемом
каталоге `reports/stage1-current/`.

## Исключённое покрытие `@WIP`

Отдельный Cucumber dry-run только по `@WIP`, без загрузки step definitions, обнаружил
**31 развёрнутый сценарий и 163 шага** в четырёх feature-файлах:

- `ai_guest_count_bva.feature` — 10 сценариев;
- `ai_price_filter_currency_switch.feature` — 9 сценариев;
- `ai_wishlist_state_transition.feature` — 8 сценариев;
- `state_transition_booking_flow.feature` — 4 сценария.

Все 31 сценарий исключены выражением `not @WIP`. Их отсутствие в основных dry-run
не является доказательством реализованных шагов или работающего UI.

## Контрольные поломки

- Временный включённый Acceptance-сценарий с отсутствующим step definition дал
  exit 1: 1 undefined, JSON создан. Файл удалён; штатный Acceptance повторно дал
  exit 0 и 0 undefined.
- Временный API Acceptance-сценарий ожидал HTTP 599 вместо фактического 200 и дал
  exit 1: 14 passed / 1 failed. JSON и Allure HTML созданы. Файл удалён; штатный
  API Acceptance до контрольной поломки прошёл 14/14.

## Ограничения

- Удалённые GitHub Actions на момент подготовки документа ещё не запускались и не
  отмечаются пройденными.
- Отдельный 15-секундный readiness timeout в GitHub runner не симулировался; ветка
  ошибки проверена по workflow-коду.
- Зелёные результаты не распространяются на `@WIP` и не подтверждают реальные
  браузерные сценарии. Реальные UI/Cypress-тесты не запускались.
