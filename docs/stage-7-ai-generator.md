# Этап 7: проверяемый генератор Gherkin

Дата: 2026-10-12. База работы: `main@29d325f`.

## Что изменено

- Новые результаты генератора сохраняются только в
  `tests/manual/features/drafts/api` или `tests/manual/features/drafts/e2e`.
  Они получают `@WIP`, `@GeneratedDraft` и обязательный тип `@API`/`@E2E`.
  Генератор не присваивает `@LocalUI`.
- Перед созданием файла ответ проверяется parser-ом Gherkin. Затем `validate-generated-draft.js`
  запускает Cucumber исключительно с `--dry-run`: явный tag expression выбирает именно
  проверяемый `@WIP` draft, а отсутствие сценариев/шагов, undefined и ambiguous — ошибки.
  Не загружается браузер и ни один step definition не выполняется.
- Имя нормализуется, пустое получает `generated_feature`, повторное имя получает суффикс;
  создание использует exclusive write и не может выйти за каталог drafts. При неуспешной
  проверке новый файл удаляется, существующие файлы не меняются.
- Prompt реального сохранённого Claude provider использует тот же model `claude-opus-4-7`;
  он получает API-контракт либо ограничения локального UI и exact available step wording.
  Примеры используют фиксированные dates, не зависящие от текущего года. В этом этапе
  внешний AI API **не вызывался**.

## Локальная проверка

В Node `22.23.2` / npm `10.9.8`, после `npm ci --offline`:

| Команда | Exit | Результат |
| --- | ---: | --- |
| `npm run test:ai-generator` | 0 | 6 проверок: tag/profile isolation; валидный mock draft; empty/truncated/provider error без записи; коллизия без overwrite; malformed/undefined/ambiguous/zero-selection rejected; symbolic-link path rejected |
| `node node_modules/typescript/bin/tsc --noEmit` | 0 | TypeScript генератора и automation |
| strict dry-run `default` / `acceptance` / `smoke` / `regression` | 0 | 76 / 24 / 21 / 51 selected scenarios; 0 undefined, 0 ambiguous |

Mock режим работает без `ANTHROPIC_API_KEY`. Тест валидного черновика подтвердил tags
и matching; временные черновики тестов удалены. Это не тест реального provider и не
доказательство семантической правильности результата.

## Удалённая проверка и CI

Quality gate `Static and Dry-run Quality Gate` запускает `npm run test:ai-generator`
после typecheck; этим проверяется generator mock workflow на каждом pull request.
На draft PR #7 для head `210617e8d7cb86771840355649435a64a48b7650` завершились:

| Workflow / check | Result |
| --- | --- |
| Typecheck automation and generator | pass, 33s |
| Strict dry-run: default / acceptance / smoke / regression | pass, 21s / 19s / 19s / 18s |
| Real API suites / Cypress API shared suite | pass, 47s / 1m03s |
| Playwright UI / Cypress UI | pass, 58s / 1m35s |
| Publish latest Allure report to Pages | skipped as expected for a pull request |

This remote result verifies the current CI workflow, including the mock generator
test; it does not call the external Claude provider. A later documentation-only head
must be checked independently before this PR is ready to merge.

### Финальное ревью 2026-10-28

Review обнаружил и исправил два пробела: Cucumber profile больше не задаёт glob paths,
поэтому CLI validator проверяет только переданный draft; lexical path checks дополнены
realpath/lstat проверками для directory и file symlinks. Test suite теперь доказывает
actual ambiguous match, а также `@WIP` isolation обычных profiles и явный opt-in matching.
Внешний AI API не вызывался.

## Перевод черновика

1. Проверить смысл относительно API-контракта или реальной поддерживаемой модели UI.
2. Реализовать/подтвердить шаги и assertions, не добавляя фиктивных steps.
3. Выполнить соответствующий сценарий против локального mock/UI.
4. Переместить file в рабочий каталог, удалить `@WIP` и `@GeneratedDraft`; `@LocalUI`
   добавить только после подтверждения поддержки.
5. Запустить затронутый обычный набор. Обычные profiles по-прежнему исключают `@WIP`.
