# Этап 3: Playwright API — шаги, assertions и изоляция

Дата: 2026-09-27. Интегрированная база: `main` на commit
`e788f11aff3276e6e68e0fef1d67ee703de7c92f`. Рабочая ветка:
`codex/stage-3-api-isolation`.

Исторические доказательства этапов 0–2 не изменялись. Этапы 4–9 и major-миграция
Cucumber/Cypress не выполнялись.

## Сопоставление требований с исходной реализацией

До этапа request-контекст публиковался через `global`, а последний response и
`reviewId` были изменяемыми переменными модуля. Шаги одновременно использовали
`baseURL` контекста и абсолютные URL из `API_URL`. Wishlist-remove зависел от того,
что другой сценарий уже добавил hotel `123`; созданные отзывы не очищались. Проверки
списков успешно проходили на пустом результате, UPDATE проверял только тело PUT, а
DELETE — только статус `204`.

Реализация сопоставлена с контрактом этапа 2 в `docs/api-contract.md` и
`docs/api-contract.yaml`: review value errors остаются `422`, общий error envelope —
`{error: {code, message}}`, успешный DELETE — `204`, последующее чтение — `404`.

## Реализация

- `ApiWorld` владеет `APIRequestContext`, последним `APIResponse`, текущими
  review/hotel ID и реестрами созданных reviews/wishlist. Модульного и глобального
  изменяемого состояния API-сценариев больше нет.
- Единственный `baseURL` задаётся при создании контекста; все шаги и cleanup используют
  относительные пути.
- Wishlist-remove создаёт собственное предусловие. Каждый успешный POST review
  регистрирует ID до последующих assertions, поэтому After hook удаляет данные и после
  падения шага. Намеренно удалённый review снимается с регистрации.
- Cleanup проверяет фактические статусы и всегда освобождает request-контекст. Ошибка
  cleanup делает зелёный сценарий красным; при уже упавшем сценарии она добавляется как
  attachment и печатается отдельно, сохраняя исходное падение.
- Поиск, currency, details, reviews, login, wishlist и CRUD проверяют ожидаемые статусы,
  типы/структуру, конкретные значения и непустые результаты. Availability проверяет
  исключение занятых hotel ID, currency — точную цену hotel `1` по фиксированным курсам.
  Seed review list обязан содержать ровно ID `1,2,3`.
- UPDATE проверяется отдельным GET. После DELETE тот же URL читается снова и обязан
  вернуть `404` с контрактным error envelope.

## Границы изоляции

Поддерживается последовательное выполнение сценариев внутри одного процесса Cucumber
и параллельное выполнение только при отдельном экземпляре mock/отдельном порту на
worker. Между сценариями нет глобального reset: After hook удаляет только ресурсы,
созданные своим World. Это не разрушает данные другого сценария и сохраняет seed.

Один общий mock-процесс не предоставляет транзакций или ownership для wishlist и
next review ID. Поэтому `--parallel` против одного URL намеренно не заявлен как
поддерживаемый: для него нужны отдельные mock-инстансы или расширение контракта. Test-only
reset используется contract tests и для восстановления fixture, но не scenario hooks.

## Локальные проверки

Среда: macOS arm64, Node.js 22.23.2, npm 10.9.8. Mock для Cucumber запускался на
отдельном порту `13009` и перезапускался перед изолированными baseline-наборами.
Существующий `allure-results` не изменялся; диагностические JSON/Allure-файлы записаны
в игнорируемый `reports/stage3-local/`.

| Команда / профиль | Exit | Фактический результат |
| --- | ---: | --- |
| `npm run typecheck` | 0 | TypeScript automation и scripts скомпилированы |
| `npm run lint:api-contract` | 0 | OpenAPI valid; прежние 4 documented warnings |
| `npm run test:api:contract` | 0 | 10 passed, 0 failed/skipped |
| `npm run test:pw:dry-run` | 0 | 76 scenarios / 256 steps skipped; 0 undefined/ambiguous |
| `npm run test:pw:acceptance` | 0 | 24 scenarios / 83 steps skipped; 0 undefined/ambiguous |
| `npm run test:pw:smoke` | 0 | 21 scenarios / 81 steps skipped; 0 undefined/ambiguous |
| `npm run test:pw:regression` | 0 | 51 scenarios / 170 steps skipped; 0 undefined/ambiguous |
| real `api-all` | 0 | 39 scenarios / 127 steps passed |
| real `api-acceptance` | 0 | 14 scenarios / 49 steps passed |
| real `api-smoke` | 0 | 9 scenarios / 30 steps passed |
| real `api-regression` | 0 | 19 scenarios / 60 steps passed |
| real `api-all --order random:314159` | 0 | 39 scenarios / 127 steps passed |
| real `api-all --order random:271828` | 0 | 39 scenarios / 127 steps passed |
| 39 отдельных `feature:line` запусков | 0 | 39 passed, 0 failed; каждый pickle загружался отдельно |

Поскольку npm API scripts намеренно закреплены на `localhost:3001`, эквивалентные
реальные команды для диагностического порта выполнялись как
`API_URL=http://localhost:13009 npx --no-install cucumber-js --profile <profile>`.

## Контрольное падение и cleanup

В игнорируемом временном feature первый сценарий создал review, затем намеренно ожидал
HTTP `599` вместо фактического `201`. Общий прогон завершился exit `1`: 1 expected
failure, 40 passed. Следующий сценарий в том же процессе получил новый World/context,
прочитал ровно seed review ID `[1,2,3]`, а прямой HTTP-check после прогона подтвердил
те же ID. При `VERIFY_API_CONTEXT_DISPOSAL=1` оба контрольных After hooks приложили
подтверждение, что запрос после `dispose()` отклонён. Контрольный feature находится
только в ignored reports и не входит в рабочий набор.

## Исключённое покрытие и ограничения

Отдельная инвентаризация `@WIP` на текущем дереве: 31 развёрнутый сценарий / 163 шага,
все undefined без загрузки step definitions. Они исключены выражением `not @WIP` и не
считаются исправленными или прошедшими. Реальные UI/Cypress-тесты не запускались.

## Удалённые проверки draft PR #3

GitHub Actions проверил implementation commit
`b8b500838d97967751466ce2fd218deddc64aab5`:

- run `36327036381` (`Static and Dry-run Quality Gate`) завершился успешно: typecheck
  и четыре strict dry-run matrix jobs зелёные; четыре JSON-артефакта опубликованы;
- run `36327036458` (`Real API Tests - Mock Server`) завершился успешно: real API job,
  включая OpenAPI lint и contract tests, зелёный; API results и Allure report
  опубликованы;
- Pages job в real API workflow был `skipped`, как требуется для pull request.

Предупреждения runs относятся к объявленной GitHub миграции runtime используемых
actions с Node.js 20 и будущей смене образа `ubuntu-latest`; они не являются падениями
проверок этапа 3. После этого evidence-only изменения CI финального head проверяется
отдельно, чтобы не создавать бесконечную цепочку evidence commits. PR остаётся draft и
не сливается.
