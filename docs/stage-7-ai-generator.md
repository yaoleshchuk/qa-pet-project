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
| `npm run test:ai-generator` | 0 | 4 проверки: валидный mock draft, empty/truncated/provider error без записи, коллизия без overwrite, malformed/undefined/zero-selection rejected |
| `node node_modules/typescript/bin/tsc --noEmit` | 0 | TypeScript генератора и automation |
| strict dry-run `default` / `acceptance` / `smoke` / `regression` | 0 | 76 / 24 / 21 / 51 selected scenarios; 0 undefined, 0 ambiguous |

Mock режим работает без `ANTHROPIC_API_KEY`. Тест валидного черновика подтвердил tags
и matching; временные черновики тестов удалены. Это не тест реального provider и не
доказательство семантической правильности результата.

## Удалённая проверка и CI

Планируемый quality gate `Static and Dry-run Quality Gate` теперь запускает
`npm run test:ai-generator` после typecheck; этим проверяется generator mock workflow
на каждом pull request. На момент фиксации этого evidence удалённые проверки **не
запускались**: обычный HTTPS push не смог получить credential (`Device not configured`),
а указанный isolated `GH_CONFIG_DIR` не содержал GitHub host configuration. Поэтому
draft PR, remote head и CI result отсутствуют и не заявляются как успешные. Внешний
AI-вызов Claude также не выполнялся.

## Перевод черновика

1. Проверить смысл относительно API-контракта или реальной поддерживаемой модели UI.
2. Реализовать/подтвердить шаги и assertions, не добавляя фиктивных steps.
3. Выполнить соответствующий сценарий против локального mock/UI.
4. Переместить file в рабочий каталог, удалить `@WIP` и `@GeneratedDraft`; `@LocalUI`
   добавить только после подтверждения поддержки.
5. Запустить затронутый обычный набор. Обычные profiles по-прежнему исключают `@WIP`.
