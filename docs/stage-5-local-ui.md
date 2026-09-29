# Этап 5: минимальный локальный UI-стенд

Дата: 2026-09-29. Интегрированная база: `main@9a380c8`. Рабочая ветка:
`codex/stage-5-local-ui`.

## Соответствие UI-сценариев и контракта

| UI-сценарий | Нужное поведение стенда | Поддержка API |
| --- | --- | --- |
| Поиск города/дат/гостей | Отправить город и обе даты, показать доступные карточки; проверять 1–30 гостей | `GET /api/hotels` поддерживает city/dates и серверную availability; параметра гостей нет |
| Валюта и диапазон цены | Запросить цену в выбранной валюте и показать ответ | `GET /api/hotels` применяет fixed rate и min/max после conversion |
| Звёзды, Wi‑Fi, breakfast, sort | Сузить показанные карточки и отсортировать числа | ответ содержит `stars`, `amenities`, `price`; query filters/sort отсутствуют, поэтому это явная client-side обработка ответа |
| Вход | Проверить email/password, показать account | `POST /api/login` c фиксированными test credentials |
| Add/remove favourites | Менять кнопку и список избранного | `POST /api/wishlist`, `DELETE /api/wishlist/{id}`; server state in-memory |
| Язык, invalid/empty form | Изменить labels, показать доступную ошибку | language/contact не являются API-функциями; реализованы локально в рамках feature |

## Противоречия и сознательные границы

- Формулировки старых feature про Booking.com не означают, что их нужно открывать:
  стенд полностью local и не обращается к внешнему сайту.
- API не моделирует число гостей и capacity. UI валидирует допустимый диапазон
  `1..30`, но не выдаёт недостоверный результат availability per guest.
- API не имеет `GET /wishlist`, ownership, token verification или persistent store.
  В текущем browser session display user живёт в `sessionStorage`, а wishlist — до
  restart/reset mock process. Это учебная авторизация, не security model.
- State-transition feature с booking/checkout/cancel и AI draft `@WIP` не являются
  product requirements этапа 5. Они не переносились, `@WIP` не снимался.

## Реализация

- `mock-server/server.js` раздаёт `ui/` на том же origin после API routes; API не
  менялся и контракт сохраняет совместимость.
- `ui/index.html`, `ui/app.js`, `ui/styles.css` дают search, results, filters,
  language, login, favourites, contact validation, loading/empty/error states,
  keyboard-native controls, accessible labels and stable `data-testid`.
- Currency and availability never duplicate server rules: change currency and
  price range perform a fresh `GET /api/hotels`. Amenity/star filtering and price
  sorting are client-only and operate strictly on that response.
- `npm run ui:local` starts a child `mock-server/server.js`, polls declared
  `/health` for 10 s (configurable `UI_READY_TIMEOUT_MS`) and forwards SIGINT/SIGTERM.
  `npm run ui:start` is a simple foreground entrypoint where an external supervisor
  is preferred. Restarting it or `POST /api/test/reset` restores fixture state.

## Ручная браузерная проверка

Local process: `MOCK_PORT=13025 npm run ui:local`; readiness returned `200` from
`/health`. Chrome visited only `http://localhost:13025`; no Booking.com, external
service, or booking transaction was used.

| Действие | Наблюдаемый результат |
| --- | --- |
| Search Paris, 2026-08-01 to 2026-08-05, 2 guests | three available Paris cards; dates reached API |
| Select Free WiFi + Breakfast + 4 stars; select USD; lowest-price sort | one `Hotel Le Marais` card, `$198.08 USD`; filters/sort controls retain values |
| Login test account | local `/account` shown after `POST /api/login` |
| Search Rome; Save first; open Favourites; Remove | button changed Save → Remove, card appeared once, then empty-state `No saved stays yet.` appeared |

### Сохранённые screenshots

- [Стартовая локальная страница](stage-5-screenshots/home.png) — доступные labels,
  язык/currency selectors и search form.
- [Пустое избранное](stage-5-screenshots/favorites-empty.png) — локальный empty state.

Это статические browser screenshots стенда, сохранённые в репозитории как evidence.
Ручные интерактивные проверки из таблицы выше отдельно подтвердили фильтры/currency,
login и add/remove; screenshots не являются UI-автоматизацией.

### Границы проверок

- **Ручная browser-проверка:** выполнена локально в Chrome против `localhost:13025`.
- **Удалённый CI:** ещё не запускался для этого commit/PR; его результат будет
  зафиксирован после публикации draft PR.
- **UI-автоматизация:** не добавлялась и не запускалась. Это задача этапа 6;
  `@WIP` не изменялся.

## Verification

| Command | Exit | Result |
| --- | ---: | --- |
| `npm run typecheck` | 0 | TypeScript compiled |
| `npm run lint:api-contract` | 0 | OpenAPI valid; 4 pre-existing documented warnings |
| `npm run test:api:contract` | 0 | 10 passed |
| real `api-all` against `localhost:13025` | 0 | 39 scenarios; JSON reports 0 failed steps |
| `test:pw:dry-run` | 0 | 76 scenarios / 256 skipped steps; 0 undefined/ambiguous |
| `test:pw:acceptance` | 0 | 24 scenarios / 83 skipped steps; 0 undefined/ambiguous |
| `test:pw:smoke` | 0 | 21 scenarios / 81 skipped steps; 0 undefined/ambiguous |
| `test:pw:regression` | 0 | 51 scenarios / 170 skipped steps; 0 undefined/ambiguous |

The first sandboxed contract-test attempt could not bind its temporary loopback
listener (`EPERM`); the same unchanged command was then rerun with the local-listener
permission shown above and passed. No test describes old unexecuted checks as passed.
`@WIP` scenarios remain excluded.
