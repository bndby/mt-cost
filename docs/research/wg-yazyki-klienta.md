# Языки клиента World of Tanks

Снимок: 2026-10-02. Клиент игры здесь не запускался. Список языков интерфейса — поле `supported_languages` официальной страницы Steam приложения World of Tanks (Wargaming), appid `1407200`. Статья Game Center говорит только «много языков» и перечень не даёт. Вики и форумы не используются.

## Короткий ответ

Один список на клиент. Отдельные витрины Steam для NA (`1407590`), EU (`1407600`) и ASIA (`1407610`) не публикуют свою страницу (`success: false`), расхождения списков по Реалмам не видно.

Энциклопедия WG Public API (`wot/encyclopedia/info`, живой запрос 2026-10-02, `language=xx` → `INVALID_LANGUAGE`) принимает не все языки клиента. Для них интерфейс Оценки на выбранном Языке, имена из энциклопедии — на английском (`en`).

## Языки клиента

Источник: [https://store.steampowered.com/api/appdetails?appids=1407200&l=en](https://store.steampowered.com/api/appdetails?appids=1407200&l=en), поле `supported_languages`. Звёздочка в ответе Steam — полная озвучка, не отдельный язык интерфейса.

| Язык в ответе Steam | Имя в настройках | `language` энциклопедии |
| --- | --- | --- |
| English | English | `en` |
| French | Français | `fr` |
| Italian | Italiano | `en` |
| German | Deutsch | `de` |
| Czech | Čeština | `cs` |
| Dutch | Nederlands | `en` |
| Finnish | Suomi | `en` |
| Hungarian | Magyar | `en` |
| Japanese | 日本語 | `en` |
| Korean | 한국어 | `ko` |
| Polish | Polski | `pl` |
| Portuguese - Brazil | Português | `en` |
| Romanian | Română | `en` |
| Russian | Русский | `ru` |
| Spanish - Latin America | Español | `es` |
| Swedish | Svenska | `en` |
| Turkish | Türkçe | `tr` |
| Ukrainian | Українська | `en` |
| Traditional Chinese | 繁體中文 | `zh-tw` |
| Simplified Chinese | 简体中文 | `zh-cn` |

Живой API принимает ещё `th` и `vi`. В списке клиента Steam их нет, в настройках Оценки их нет.

## Что не перечисляет поддержка WG

[Game Center — Games: install, setup and troubleshoot](https://wargaming.net/support/en/products/wgc/article/21845/): пункт Game Language — «Our games are localized to many languages». Имен языков в статье нет. Выпадающий список внутри клиента на страницах WG не опубликован.

Справочник энциклопедии WG Public API задаёт другой набор: 13 кодов `en`, `ru`, `pl`, `de`, `fr`, `es`, `zh-cn`, `zh-tw`, `tr`, `cs`, `th`, `vi`, `ko`. Живая проверка `wot/encyclopedia/info` на EU 2026-10-02 приняла ровно их. `th` и `vi` в клиенте Steam нет, поэтому в настройках Оценки их нет. Языки клиента без кода энциклопедии остаются в настройках, а запрос имён идёт с `en`.
