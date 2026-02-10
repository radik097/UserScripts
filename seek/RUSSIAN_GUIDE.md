# 🚀 Полное руководство по внедрению

**Дата создания:** 9 февраля 2026 г.  
**Статус:** ✅ Готово к использованию

---

## ✅ Что было создано

### 1. Структура GitHub Copilot инструкций

✅ **Главный индекс** (`.github/copilot-instructions.md`)
- Автоматически загружается GitHub Copilot
- Определяет приоритеты: path-specific > language-specific > repo-level
- Содержит ссылки на специализированные инструкции

✅ **Детальные инструкции для Userscripts** (`.github/instructions/seek-userscripts.instruction.md`)
- Правила стиля кода (ES2022+, IIFE, JSDoc)
- Требования безопасности (no eval, no innerHTML, no exfiltration)
- Стандарты производительности (debounce, cleanup)
- Шаблоны промптов для Copilot
- Примеры правильного/неправильного кода
- Антипаттерны

✅ **Инструкции для JavaScript** (`.github/instructions/js.instruction.md`)
- Общие стандарты JavaScript
- Fallback для файлов, не попадающих под userscript rules

### 2. Инструменты качества кода

✅ **ESLint** (`.eslintrc.js`)
- `eslint:recommended`
- `eslint-plugin-security` — детекция eval, unsafe regex
- Greasemonkey/Tampermonkey globals

✅ **Prettier** (настройки в `package.json`)
- 2-space indent
- Single quotes
- Trailing commas ES5

✅ **Jest** (тесты в `__tests__/`)
- jsdom для тестирования DOM
- Примеры тестов: parseSalary, debounce, DOM manipulation
- Цель: 80%+ coverage

✅ **EditorConfig** (`.editorconfig`)
- Консистентность форматирования между редакторами

### 3. CI/CD Pipeline

✅ **GitHub Actions** (`.github/workflows/ci.yml`)
- ESLint check (fail on errors)
- Prettier check (fail on formatting)
- Jest tests + coverage
- Markdownlint
- Security audit

✅ **PR Template** (`.github/PULL_REQUEST_TEMPLATE.md`)
- Чек-лист безопасности
- Чек-лист тестирования
- Чек-лист качества кода

### 4. Документация

✅ **README.md** — главная документация
✅ **CONTRIBUTING.md** — руководство для контрибьюторов
✅ **docs/QUICKSTART.md** — быстрый старт за 5 минут
✅ **docs/copilot-guide.md** — руководство по использованию Copilot
✅ **docs/architecture.md** — архитектура и диаграммы
✅ **docs/file-reference.md** — справочник по всем файлам
✅ **CHANGELOG.md** — история версий
✅ **LICENSE** — MIT License
✅ **PROJECT_SUMMARY.md** — краткая сводка проекта

### 5. VS Code Integration

✅ **Настройки** (`.vscode/settings.json`)
- Auto-format on save
- ESLint auto-fix
- Prettier как default formatter

✅ **Рекомендуемые расширения** (`.vscode/extensions.json`)
- ESLint
- Prettier
- GitHub Copilot
- Jest
- Markdownlint

### 6. Обновлённый Userscript

✅ **seek.user.js** — полностью переработанный шаблон
- Правильные metadata headers
- IIFE pattern
- JSDoc аннотации
- Debounced MutationObserver
- Cleanup функции
- Примеры логики (parseSalary)

---

## 🎯 Как использовать

### Для разработчика

#### 1. Установка зависимостей

```powershell
# В папке d:\UserScripts\seek
npm install
```

Это установит:
- ESLint + eslint-plugin-security
- Prettier
- Jest + jest-environment-jsdom
- @playwright/test (для E2E тестов)

#### 2. Проверка настройки

```powershell
# Запустить все проверки
npm run validate
```

Должно пройти:
- ✅ ESLint (может быть 0 ошибок)
- ✅ Prettier (формат правильный)
- ✅ Jest (пример тестов проходят)

#### 3. Работа с GitHub Copilot

**Откройте `seek.user.js` и попробуйте:**

```
Промпт в Copilot Chat:

Generate a function to highlight job listings with salary above $100,000:
- Parse salary from text (handle "$120k" and "$95,000" formats)
- Apply green background to high-salary jobs
- Use MutationObserver with 200ms debounce
- Include JSDoc and unit tests
```

**Copilot автоматически применит правила из `.github/instructions/seek-userscripts.instruction.md`:**
- Использует безопасные методы (textContent вместо innerHTML)
- Добавит debounce
- Создаст cleanup функции
- Предложит unit тесты

#### 4. Запуск тестов

```powershell
# Один раз
npm test

# Watch mode (автоматический перезапуск при изменениях)
npm run test:watch

# С coverage
npm run test:coverage
```

#### 5. Линтинг и форматирование

```powershell
# Проверка ошибок
npm run lint

# Автофикс
npm run lint:fix

# Форматирование
npm run format

# Проверка форматирования
npm run format:check
```

#### 6. Создание PR

1. Создайте ветку: `git checkout -b feature/my-feature`
2. Внесите изменения в `seek.user.js`
3. Добавьте тесты в `__tests__/seek.test.js`
4. Запустите: `npm run validate`
5. Commit: `git commit -m "feat: add my feature"`
6. Push: `git push origin feature/my-feature`
7. Создайте PR на GitHub — автоматически загрузится шаблон

---

### Для пользователя (установка userscript)

#### 1. Установите менеджер userscripts

Выберите один:
- [Violentmonkey](https://violentmonkey.github.io/) (рекомендуется)
- [Tampermonkey](https://www.tampermonkey.net/)
- [Greasemonkey](https://www.greasespot.net/) (только Firefox)

#### 2. Установите скрипт

**Вариант A:** Из репозитория
1. Откройте `seek.user.js` на GitHub
2. Нажмите "Raw"
3. Менеджер userscripts предложит установить

**Вариант B:** Вручную
1. Откройте менеджер userscripts
2. Создайте новый скрипт
3. Скопируйте содержимое `seek.user.js`
4. Сохраните

#### 3. Проверьте работу

1. Зайдите на [seek.com.au](https://www.seek.com.au)
2. Иконка менеджера должна показать "1 скрипт запущен"
3. Откройте консоль браузера (F12) — должно быть: `[Seek Enhanced] Userscript loaded`

---

## 📚 Шаблоны промптов для Copilot

### Генерация новой функции

```
Generate a Tampermonkey userscript for seek.com.au:
- Purpose: highlight job listings with "remote" in description
- Logic: search for keywords (remote, work from home, WFH, telecommute)
- UI: add green border-left to matching jobs
- Observer: MutationObserver with 200ms debounce
- Cleanup: disconnect on beforeunload
- Tests: unit tests for keyword matching function
- Security: @grant none, no data exfiltration, sanitize DOM
```

### Рефакторинг кода

```
Refactor the following userscript to follow seek-userscripts instructions:
[вставьте код]

Requirements:
- Remove global variables (use IIFE)
- Add proper cleanup (disconnect MutationObserver, remove listeners)
- Add JSDoc type annotations for all functions
- Replace any innerHTML usage with textContent/setAttribute
- Include Jest unit tests for parseSalary and filterJobs functions
- Ensure @grant none or minimal grants
```

### Добавление тестов

```
Add comprehensive Jest unit tests for this function:
[вставьте функцию]

Test cases to cover:
- Happy path (valid input)
- Edge cases (empty string, null, undefined)
- Invalid input (malformed data)
- Boundary values (min/max)
Include describe/test blocks and JSDoc.
```

### Исправление бага

```
Debug this userscript issue:
- Problem: MutationObserver fires too frequently
- Expected: Should debounce calls to 200ms
- Actual: Fires on every DOM mutation
- Code: [вставьте проблемный код]

Check:
- Is debounce function correct?
- Is debounce applied to observer callback?
- Are there memory leaks?
```

---

## 🔧 Настройка CI (если используете GitHub)

### 1. Включите GitHub Actions

В настройках репозитория:
1. Settings → Actions → General
2. Allow all actions and reusable workflows
3. Сохранить

### 2. Protected Branch Rules (опционально)

Settings → Branches → Add rule:
- Branch name pattern: `main`
- ✅ Require status checks before merge
- ✅ Require branches to be up to date
- Status checks: `validate` (из ci.yml)

Теперь PR не сможет быть замержен, если CI проверки не прошли.

---

## 🎓 Обучение команды

### Для новых разработчиков

1. **Прочитать:**
   - [docs/QUICKSTART.md](docs/QUICKSTART.md) — 5 минут
   - [CONTRIBUTING.md](CONTRIBUTING.md) — 15 минут
   - [.github/instructions/seek-userscripts.instruction.md](.github/instructions/seek-userscripts.instruction.md) — 10 минут

2. **Попробовать:**
   - Установить зависимости: `npm install`
   - Запустить тесты: `npm test`
   - Создать тестовую ветку
   - Использовать Copilot с шаблонами промптов

3. **Практика:**
   - Добавить маленькую функцию (например, highlight remote jobs)
   - Написать тесты
   - Создать PR

### Для опытных разработчиков

1. **Изучить архитектуру:**
   - [docs/architecture.md](docs/architecture.md)
   - [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md)

2. **Настроить среду:**
   - Установить рекомендуемые расширения VS Code
   - Настроить auto-format on save
   - Включить GitHub Copilot

3. **Ревью:**
   - Изучить примеры в `.github/instructions/seek-userscripts.instruction.md`
   - Посмотреть тесты в `__tests__/`

---

## 📊 Метрики успеха

После внедрения отслеживайте:

| Метрика | Цель | Как проверить |
|---------|------|---------------|
| **Покрытие тестами** | 80%+ | `npm run test:coverage` |
| **Ошибки ESLint** | 0 | `npm run lint` |
| **Нарушения форматирования** | 0 | `npm run format:check` |
| **CI проходит** | 100% PR | GitHub Actions status |
| **Время ревью PR** | < 1 день | GitHub Insights |
| **Security issues** | 0 | `npm audit` |

---

## 🔄 Регулярное обслуживание

### Еженедельно

```powershell
# Проверка безопасности
npm audit

# Обновление зависимостей (minor/patch)
npm update
```

### Ежемесячно

```powershell
# Проверка устаревших пакетов
npm outdated

# Запуск полной валидации
npm run validate
```

### Ежеквартально

1. **Ревью инструкций Copilot:**
   - Добавить новые примеры ошибок
   - Обновить антипаттерны
   - Улучшить шаблоны промптов

2. **Обновление документации:**
   - Проверить актуальность примеров
   - Добавить FAQ по частым вопросам

3. **Анализ метрик:**
   - Покрытие тестами
   - Количество багов
   - Время на ревью

---

## 🐛 Troubleshooting

### Copilot не применяет инструкции

**Проблема:** Copilot генерирует код не по стандартам

**Решение:**
1. Проверьте путь: `.github/copilot-instructions.md` существует
2. Откройте Copilot Chat → Settings (шестерёнка) → Active instructions
3. Должно быть: `seek-userscripts.instruction.md`
4. Если нет — добавьте в промпт: `Follow seek-userscripts instructions from .github/instructions/`

### ESLint ошибки

**Проблема:** `npm run lint` выдаёт ошибки

**Решение:**
```powershell
# Автофикс (исправляет ~80% проблем)
npm run lint:fix

# Для оставшихся — исправить вручную
# Или временно отключить правило в .eslintrc.js (не рекомендуется)
```

### Тесты не проходят

**Проблема:** `npm test` падает

**Решение:**
```powershell
# Запустить в watch mode для дебага
npm run test:watch

# Проверить конкретный файл
npm test -- __tests__/seek.test.js

# Verbose output
npm test -- --verbose
```

### CI падает на GitHub

**Проблема:** GitHub Actions показывает ошибку

**Решение:**
1. Локально запустить: `npm run validate`
2. Исправить ошибки
3. Commit и push
4. CI должен пройти

---

## ✅ Чек-лист готовности

Перед началом использования проверьте:

- [x] **Установлены зависимости** (`npm install` завершился успешно)
- [x] **Проходят тесты** (`npm test` — all passed)
- [x] **ESLint настроен** (`npm run lint` — no errors)
- [x] **Prettier работает** (`npm run format:check` — all files formatted)
- [x] **VS Code расширения установлены** (ESLint, Prettier, Copilot)
- [x] **GitHub Actions настроены** (если используете GitHub)
- [x] **Документация прочитана** (QUICKSTART, CONTRIBUTING, copilot-guide)

---

## 🎉 Готово!

Проект полностью настроен и готов к использованию!

### Следующие шаги:

1. **Попробуйте Copilot:**
   - Откройте `seek.user.js`
   - Используйте промпт из раздела "Шаблоны промптов"
   - Проверьте, что Copilot генерирует код по стандартам

2. **Создайте первую feature:**
   - Придумайте улучшение для seek.com.au
   - Используйте Copilot для генерации кода
   - Добавьте тесты
   - Создайте PR

3. **Изучите документацию:**
   - [docs/copilot-guide.md](docs/copilot-guide.md) — примеры использования
   - [docs/architecture.md](docs/architecture.md) — понимание архитектуры

---

## 📞 Поддержка

**Вопросы?** Смотрите:
- [docs/QUICKSTART.md](docs/QUICKSTART.md)
- [CONTRIBUTING.md](CONTRIBUTING.md)
- [docs/file-reference.md](docs/file-reference.md)

**Нашли баг?** Создайте issue на GitHub с:
- Описанием проблемы
- Шагами для воспроизведения
- Ожидаемым и фактическим поведением

---

**Успешного использования! 🚀**

**Дата создания:** 9 февраля 2026 г.  
**Версия:** 1.0.0  
**Статус:** ✅ Полностью готово
