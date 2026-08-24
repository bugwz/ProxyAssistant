<div align="center">

<img src="../src/images/logo-128.png" width="80" height="80" alt="Помощник прокси">

# Помощник прокси

[![Расширение Chrome](https://img.shields.io/badge/Chrome-Extension-blue?logo=google-chrome)](https://chromewebstore.google.com/detail/%E4%BB%A3%E7%90%86%E5%8A%A9%E6%89%8B/mfemgikpcpndehimgkjghpcofjcgdhdk)
[![Расширение Firefox](https://img.shields.io/badge/Firefox-Extension-orange?logo=firefox)](https://addons.mozilla.org/zh-CN/firefox/addon/proxyassistant)
[![Manifest V3](https://img.shields.io/badge/Manifest-V3-green)](https://developer.chrome.com/docs/extensions/mv3/intro/)
[![Многоязычный](https://img.shields.io/badge/Многоязычный-yellow)](README-ru.md)

Управление прокси в Chrome, Firefox и Edge

[简体中文](../README.md) | [繁體中文](README-zh-TW.md) | [English](README-en.md) | [日本語](README-ja.md) | [Français](README-fr.md) | [Deutsch](README-de.md) | [Español](README-es.md) | [Português](README-pt.md) | [**Русский**](README-ru.md) | [한국어](README-ko.md)

</div>

Помощник прокси управляет прокси HTTP, HTTPS, SOCKS4 и SOCKS5 внутри браузера. Расширение предлагает отключённый, ручной и автоматический режимы и объединяет узлы, сценарии, правила маршрутизации, подписки, синхронизацию и диагностику на одной странице настроек.

Chrome, Firefox и Edge используют Manifest V3. Edge работает с тем же пакетом Chromium, что и Chrome. Проект написан на нативном JavaScript и jQuery с использованием API браузерных расширений.

![Настройки](https://raw.githubusercontent.com/bugwz/ProxyAssistant-assets/refs/heads/20260125113629/assets/screenshots/main/settings.png)

## Возможности

### Узлы и режимы работы

- Управление узлами HTTP, HTTPS, SOCKS4 и SOCKS5.
- Настройка адреса, порта, имени пользователя, пароля, цвета и состояния.
- Переключение отключённого, ручного и автоматического режимов во всплывающем окне.
- Использование выбранного узла и адресов обхода в ручном режиме.
- Создание PAC-скрипта из прокси-адресов узлов в автоматическом режиме с прямым подключением или отказом как резервной политикой.
- Проверка одного или всех узлов с отображением задержки или ошибки.

### Сценарии прокси

- Хранение узлов разных сетевых сред в отдельных сценариях.
- Переключение текущего сценария в настройках или во всплывающем окне.
- Добавление, переименование, удаление и сортировка сценариев, перенос узлов.
- Выбор прокси по умолчанию и автоматическая активация по дням и времени.

### Подписки на правила

- Централизованное управление подписками для нескольких узлов.
- Поддержка AutoProxy, Switchy Legacy, Switchy Omega и PAC.
- Просмотр исходных данных, результата разбора, правил прокси и прямого подключения.
- Инверсия правил и обновление вручную либо каждые 1 минуту, 6 часов, 12 часов, 1 день или 5 дней.
- Фоновое обновление подписок расширением.

### Конфигурация, синхронизация и диагностика

- Импорт и экспорт JSON с выбором подписок и их кэша.
- Передача и получение конфигурации между устройствами через встроенную синхронизацию браузера.
- Передача и получение конфигурации через GitHub Gist с поддержкой расписания.
- Разбиение данных встроенной синхронизации на блоки по 7 KB и отображение квоты.
- Проверка управления прокси, состояния PAC и конфликтов расширений.
- Фильтрация, обновление, копирование и очистка журналов по уровню.

### Настройки интерфейса

- Светлая, тёмная и автоматически переключаемая по времени темы.
- Редактирование цветов пользовательской темы через JSON.
- Поддержка упрощённого и традиционного китайского, английского, японского, французского, немецкого, испанского, португальского, русского и корейского.
> Поля аутентификации SOCKS5 отключены, поскольку API прокси Chrome не поддерживает имя пользователя и пароль для SOCKS5.

![Светлая тема](https://raw.githubusercontent.com/bugwz/ProxyAssistant-assets/refs/heads/20260125113629/assets/screenshots/main/theme-light.png)

![Тёмная тема](https://raw.githubusercontent.com/bugwz/ProxyAssistant-assets/refs/heads/20260125113629/assets/screenshots/main/theme-dark.png)

## Установка

### Установка пакета выпуска

Обычные пользователи могут установить расширение непосредственно из магазина:

- [Chrome Web Store](https://chromewebstore.google.com/detail/%E4%BB%A3%E7%90%86%E5%8A%A9%E6%89%8B/mfemgikpcpndehimgkjghpcofjcgdhdk) для Chrome и Edge, если в Edge разрешены расширения Chrome.
- [Firefox Add-ons](https://addons.mozilla.org/zh-CN/firefox/addon/proxyassistant) для Firefox.

Соответствующий пакет также можно скачать в [GitHub Releases](https://github.com/bugwz/ProxyAssistant/releases):

- Chrome, Edge и другие браузеры Chromium используют `ProxyAssistant_<версия>_chrome.zip`.
- Сборки Firefox содержат `ProxyAssistant_<версия>_firefox.zip` и `ProxyAssistant_<версия>_firefox.xpi`.

Для Chrome или Edge распакуйте ZIP, включите режим разработчика на странице расширений и загрузите папку. Процесс выпуска создаёт Firefox XPI как артефакт сборки; прямая установка зависит от политики подписи Firefox. Поэтому обычным пользователям рекомендуется Firefox Add-ons.

### Сборка из исходного кода

В репозитории хранятся отдельные Manifest для Chrome и Firefox. Рекомендуется сначала создать каталог или пакет нужного браузера, чтобы не редактировать `src/manifest.json` напрямую.

```bash
npm ci
make build VERSION=dev
```

Для Chrome или Edge распакуйте `build/ProxyAssistant_dev_chrome.zip`. Для разработки Firefox распакуйте его ZIP, откройте `about:debugging`, выберите «Этот Firefox» и временную загрузку дополнения, затем укажите `manifest.json`. Для создания XPI нужен `web-ext`. Без `web-ext` файлы ZIP и TAR.GZ для Firefox всё равно создаются, но XPI пропускается.

## Использование

1. Откройте Помощник прокси с панели браузера.
2. Добавьте в настройках узел с протоколом, адресом и портом.
3. При необходимости добавьте учётные данные и правила маршрутизации.
4. Выберите отключённый, ручной или автоматический режим.
5. В ручном режиме выберите узел, а в автоматическом доверьте маршрутизацию PAC-скрипту.

Типичные настройки:

- Всегда использовать один прокси: выберите ручной режим и нужный узел.
- Использовать прокси для отдельных сайтов: добавьте их в адреса прокси и выберите автоматический режим.
- Оставить отдельные сайты прямыми: добавьте их в исключения или используйте прямые правила подписки.
- Разделить офис, дом и другие сети: создайте сценарии и переключайте их во всплывающем окне.

## Данные и разрешения

Расширение запрашивает следующие разрешения:

| Permission | Назначение |
| --- | --- |
| `proxy` | Чтение и изменение настроек прокси браузера |
| `storage` | Хранение локальной конфигурации и встроенная синхронизация |
| `webRequest`, `webRequestAuthProvider` | Ответ на запросы аутентификации прокси |
| `alarms` | Планирование подписок, сценариев и синхронизации |
| `<all_urls>` | Создание правил для веб-запросов и чтение текущего сайта |


По умолчанию конфигурация хранится в `chrome.storage.local`. Имена пользователей и пароли прокси входят в конфигурацию и включаются в экспортируемые файлы и отправляемые данные синхронизации. Токен GitHub и ID Gist исключаются. Защищайте экспортированные файлы и проверьте требования безопасности перед включением синхронизации.

Получение удалённых данных заменяет локальную рабочую конфигурацию, но сохраняет локальные параметры подключения и расписание синхронизации. При необходимости заранее экспортируйте резервную копию.

[Политика конфиденциальности](https://sites.google.com/view/proxy-assistant/privacy-policy)

## Разработка

### Требования

- Node.js 20, как в GitHub Actions
- npm
- Chrome, Firefox или Edge для браузерных проверок
- `web-ext`, только для создания Firefox XPI

Установка зависимостей:

```bash
npm ci
```

### Тесты

```bash
npm test                    # Все тесты Jest
npm run test:unit           # Модульные тесты
npm run test:integration    # Интеграционные тесты
npm run test:e2e            # Сквозные тесты
npm run test:watch          # Режим наблюдения
npm run test:coverage       # Тесты покрытия
```

Доступны команды Makefile:

```bash
make test
make test_unit
make test_integration
make test_e2e
make test_nocache
```

### Сборка

```bash
make build VERSION=dev
```

Скрипт очищает `build/`, выбирает Manifest браузера и создаёт:

```text
build/
├── ProxyAssistant_dev_chrome.zip
├── ProxyAssistant_dev_chrome.tar.gz
├── ProxyAssistant_dev_firefox.zip
├── ProxyAssistant_dev_firefox.tar.gz
└── ProxyAssistant_dev_firefox.xpi
```

Без `web-ext` последний файл не создаётся.

### Структура проекта

```text
ProxyAssistant/
├── src/
│   ├── _locales/             # Ресурсы локализации браузера
│   ├── css/                  # Стили настроек и окна
│   ├── images/               # Значки расширения
│   ├── js/                   # Логика страниц, прокси, хранилища, синхронизации и фона
│   ├── main.html             # Страница настроек
│   ├── popup.html            # Окно расширения
│   ├── manifest_chrome.json  # Chrome Manifest V3
│   └── manifest_firefox.json # Firefox Manifest V3
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── script/build.sh           # Скрипт упаковки Chrome и Firefox
├── readme/                   # README на других языках
├── release/                  # Примечания к выпускам
├── Makefile
└── package.json
```

Основные модули:

| Файл | Назначение |
| --- | --- |
| `src/js/worker.js` | Применение прокси, PAC, аутентификация, задачи и сообщения |
| `src/js/main.js` | Инициализация настроек и координация модулей |
| `src/js/popup.js` | Переключение режимов, сценариев и узлов |
| `src/js/proxy.js` | Формы, списки и тесты узлов |
| `src/js/scenarios.js` | Сценарии и правила времени |
| `src/js/subscription.js` | Управление, разбор и расписание подписок |
| `src/js/config.js` | Формат, миграция, импорт и экспорт |
| `src/js/storage.js` | Локальный кэш и сохранение |
| `src/js/sync.js` | Встроенная синхронизация и GitHub Gist |
| `src/js/detection.js` | Диагностика управления прокси и PAC |

Правила кода и тестов приведены в [AGENTS.md](../AGENTS.md).

## Примечания о браузерах

- Chrome использует Service Worker Manifest V3.
- Firefox использует background script Manifest V3; текущий Manifest требует Firefox 142 или новее.
- Edge использует пакет Chrome из Chrome Web Store или распакованной папки. Отдельные Manifest и автоматические цели остаются Chrome и Firefox.
- Несколько активных прокси- или VPN-расширений могут конфликтовать; используйте страницу состояния для диагностики.

## Обратная связь и вклад

Сообщайте о проблемах и предложениях через [GitHub Issues](https://github.com/bugwz/ProxyAssistant/issues). Запускайте связанные тесты и по возможности проверяйте прокси в Chrome, Firefox и Edge.

## Лицензия

Проект использует [лицензию MIT](../LICENSE).
