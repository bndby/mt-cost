# Реалмы и `application_id` у WG (World of Tanks Public API)

Вопрос: работает ли один `application_id` на всех трёх хостах WG Public API для World of Tanks — `api.worldoftanks.com` (NA), `api.worldoftanks.eu` (EU), `api.worldoftanks.asia` (ASIA) — или нужна отдельная регистрация/привязка на Реалм? Совпадают ли параметры `wot/auth/login`, `wot/auth/prolongate`, `wot/auth/logout` с тем, что уже задокументировано для Lesta?

В `.env` уже лежит рабочий `WG_APPLICATION_ID` (зарегистрирован вручную, вне этой карты) — используется ниже для живой проверки, значение в этот файл не выводится.

Термины — как в `CONTEXT.md`: **WG-аккаунт**, **WG OpenID**, **Реалм**. Источник глубины/структуры — `docs/research/lesta-openid-expo-android.md` (сам он не источник фактов о WG). Дата съёмки: 2026-09-07.

## Короткий ответ

Один `application_id` работает на всех трёх Реалмах без отдельной регистрации: [«Использование API»](https://developers.wargaming.net/documentation/guide/principles/) прямо говорит, что для **автономного** (standalone) приложения проверяется только `application_id`, IP и, тем более, Реалм не проверяются. Живая проверка подтверждает это эмпирически: один и тот же `WG_APPLICATION_ID` вернул `"status":"ok"` на `api.worldoftanks.com`, `api.worldoftanks.eu` и `api.worldoftanks.asia` — и на публичном методе (`wot/encyclopedia/info`), и на `wot/auth/login` (см. [§2](#2-один-application_id-на-три-реалма--подтверждено-вживую)).

Параметры `wot/auth/login`, `wot/auth/prolongate`, `wot/auth/logout` **совпадают** с тем, что задокументировано для Lesta — `redirect_uri`, `expires_at`, `access_token`, `account_id`, `nickname`, лимит токена в две недели, коды ошибок `401 AUTH_CANCEL` / `403 AUTH_EXPIRED` / `410 AUTH_ERROR`. Единственное отличие от Lesta — сам хост в `redirect_uri` по умолчанию меняется по выбранному Реалму (`api.worldoftanks.eu/wot//blank/` для EU, `api.worldoftanks.com/wot//blank/` для NA), но это ожидаемо и не меняет набор полей.

## 1. `application_id` и типы приложений

Источник: [«Использование API» — Application Identification / Application Types](https://developers.wargaming.net/documentation/guide/principles/), [«Начало работы» — Registering Application / Using application_id](https://developers.wargaming.net/documentation/guide/getting-started/).

| | Серверное (Server) | Автономное (Standalone) |
| --- | --- | --- |
| Связь | «server-to-server» | «client-to-server» |
| IP | максимум **5** авторизованных IP на `application_id`; иначе `INVALID_IP_ADDRESS` | разные IP, отдельно не проверяются |
| Что проверяется | `application_id` **и** IP | только `application_id` |
| Квота | 20 запросов/с | 10 запросов/с **с одного IP** |

Максимум **10 приложений** на кабинет (Developer Room). Тип и описание правятся на странице «My applications».

Про Реалм при регистрации в этом гайде **ничего не сказано** — ни как отдельное поле формы, ни как ограничение области действия `application_id`. Раздел «Registering Application» описывает только тип и название приложения; раздел «Application Types» относит область проверки строго к `application_id` (+ IP для серверного типа), не к Реалму.

Ограничение скорости по регионам увеличивается по заявке в один из трёх «Customer Service Center» (Europe, North America, Asia) — это про поддержку количества запросов, а не про то, что `application_id` надо регистрировать отдельно на Реалм ([«Использование API» — Limit Increase](https://developers.wargaming.net/documentation/guide/principles/)).

## 2. Один `application_id` на три Реалма — подтверждено вживую

Три хоста Реалмов и то, что справочник методов сам предлагает единый `application_id` для всех трёх, видно прямо в интерактивной консоли API Reference: страница метода даёт переключатель `eu / na / asia`, и при переключении Реалма меняется только целевой хост запроса — поле `application_id` не спрашивает Реалм и не сбрасывается:

- `eu` → `https://api.worldoftanks.eu/wot/auth/login/`
- `na` → `https://api.worldoftanks.com/wot/auth/login/`
- `asia` → `https://api.worldoftanks.asia/wot/auth/login/`

(получено 2026-09-07 из [`wot/auth/login`](https://developers.wargaming.net/reference/all/wot/auth/login/) через переключатель Реалма в API Reference).

Дальше — прямой эмпирический тест: один и тот же `WG_APPLICATION_ID` из `.env` (значение не публикуется) вызван против всех трёх хостов.

Публичный метод без авторизации, `wot/encyclopedia/info`:

```
GET https://api.worldoftanks.com/wot/encyclopedia/info/?application_id=<WG_APPLICATION_ID>
GET https://api.worldoftanks.eu/wot/encyclopedia/info/?application_id=<WG_APPLICATION_ID>
GET https://api.worldoftanks.asia/wot/encyclopedia/info/?application_id=<WG_APPLICATION_ID>
```

Все три ответили `"status":"ok"` (проверено 2026-09-07, ответы на разных языках интерфейса — `en` на NA/EU, `th` на ASIA, — но это локализация энциклопедии, не признак разных `application_id`).

`wot/auth/login` с `nofollow=1` (JSON вместо HTTP-редиректа):

```
GET https://api.worldoftanks.com/wot/auth/login/?application_id=<WG_APPLICATION_ID>&nofollow=1
GET https://api.worldoftanks.eu/wot/auth/login/?application_id=<WG_APPLICATION_ID>&nofollow=1
GET https://api.worldoftanks.asia/wot/auth/login/?application_id=<WG_APPLICATION_ID>&nofollow=1
```

Все три вернули `"status":"ok"` и `data.location` со страницей WG OpenID — каждая на своём домене Реалма: `na.wargaming.net/id/openid/…`, `eu.wargaming.net/id/openid/…`, `asia.wargaming.net/id/openid/…` (проверено 2026-09-07). Если бы `application_id` требовал отдельной привязки на Реалм, хотя бы один из трёх запросов вернул бы `INVALID_APPLICATION_ID` — ни один не вернул.

Итог: **один** `WG_APPLICATION_ID` действителен на всех трёх Реалмах одновременно, без отдельной регистрации или привязки. Каждый Реалм — это просто другой хост API и другой домен страницы WG OpenID (`na` / `eu` / `asia.wargaming.net`), но не другой ключ приложения.

## 3. `wot/auth/login`

Источник: [OpenID login (справочник)](https://developers.wargaming.net/reference/all/wot/auth/login/), [«Использование API» — Personal user data / access tokens](https://developers.wargaming.net/documentation/guide/principles/).

Аутентификация — **Wargaming.net ID (OpenID)**, тот же ID, что у World of Tanks, World of Tanks Blitz, World of Warships, World of Warplanes и WarGag.ru. Email и пароль вводятся не в приложении, а на странице WG (или через привязанную соцсеть); статус авторизации приходит на `redirect_uri`.

### Параметры

| Поле | Обязателен | Смысл |
| --- | --- | --- |
| `application_id` | да | идентификатор приложения |
| `display` | нет | `"page"` — страница, `"popup"` — всплывающее окно |
| `expires_at` | нет | срок `access_token`: UNIX-время либо дельта в секундах; **не больше двух недель** от текущего момента |
| `nofollow` | нет | `0` (по умолчанию) — HTTP-редирект; `1` — редиректа нет, JSON с `data.location`. Мин. 0, макс. 1 |
| `redirect_uri` | нет | URL для возврата после аутентификации. По умолчанию — `api.worldoftanks.eu/wot//blank/` для EU, `api.worldoftanks.com/wot//blank/` для NA (см. [§2](#2-один-application_id-на-три-реалма--подтверждено-вживую)) |

### Что приходит на `redirect_uri`

Успех: `status: ok`, `access_token`, `expires_at`, `account_id`, `nickname`.

Ошибка: `status: error`, `code`, `message`.

Ошибки метода: `401 AUTH_CANCEL` (отменено пользователем), `403 AUTH_EXPIRED` (истекло время ожидания), `410 AUTH_ERROR` (ошибка аутентификации).

Это **точное совпадение** по набору полей и по кодам ошибок с [`wot/auth/login` у Lesta](https://developers.lesta.ru/reference/all/wot/auth/login/): те же `status`/`access_token`/`expires_at`/`account_id`/`nickname` при успехе, те же `code`/`message` при ошибке, те же три кода ошибок метода.

## 4. `wot/auth/prolongate`

Источник: [Access Token extension (справочник)](https://developers.wargaming.net/reference/all/wot/auth/prolongate/), [«Использование API» — access tokens](https://developers.wargaming.net/documentation/guide/principles/).

«Method generates new access_token based on the current token» — используется, когда игрок ещё в приложении, а срок текущего `access_token` подходит к концу.

Параметры: `application_id`\*, `access_token`\*, `expires_at` (тот же лимит двух недель, необязателен).

Ответ: `access_token`, `account_id`, `expires_at`.

Продление проходит без повторного ввода пароля — то же самое, что у [`wot/auth/prolongate` у Lesta](https://developers.lesta.ru/reference/all/wot/auth/prolongate/), с идентичным набором параметров и полей ответа.

## 5. `wot/auth/logout`

Источник: [Log out (справочник)](https://developers.wargaming.net/reference/all/wot/auth/logout/), [«Использование API» — access tokens](https://developers.wargaming.net/documentation/guide/principles/).

«Method deletes user's access_token. After this method is called, access_token becomes invalid.»

Параметры: `application_id`\*, `access_token`\*. Ответ — пустой блок данных (только `status`).

[«Использование API»](https://developers.wargaming.net/documentation/guide/principles/) требует того же самого, что и у Lesta: если приложение аутентифицирует через WG OpenID, функция «выход» **обязательна**; игрок также может сам завершить сессию на странице «Sessions» в личном кабинете — это тоже инвалидирует `access_token`.

Набор параметров и требование обязательного выхода — точное совпадение с [`wot/auth/logout` у Lesta](https://developers.lesta.ru/reference/all/wot/auth/logout/).

## 6. Срок `access_token` и лимиты — совпадение с Lesta

Источник: [«Использование API»](https://developers.wargaming.net/documentation/guide/principles/), [«Начало работы»](https://developers.wargaming.net/documentation/guide/getting-started/).

- `access_token` действителен **две недели** с момента выдачи; из-за кеша выход может ещё ~10 минут считаться валидным.
- Все запросы с `access_token` — только по **HTTPS**; передавать токен и персональные данные третьим лицам запрещено.
- Автономное приложение: только `application_id` проверяется, лимит **10 запросов/с с одного IP**, без IP-whitelist.
- Серверное приложение (не подходит для клиента без бэкенда): whitelist до 5 IP на `application_id`, лимит 20 запросов/с на IP.

Это дословно те же цифры и правила, что в [Lesta-исследовании](../research/lesta-openid-expo-android.md) — с той лишь разницей, что у WG «своя» OpenID-страница на `na` / `eu` / `asia.wargaming.net` по выбранному Реалму, а у Lesta Реалма нет вовсе (один кластер ru/СНГ).

## Сопоставление полей: WG vs Lesta

| | WG (`wot/auth/*`) | Lesta (`wot/auth/*`) |
| --- | --- | --- |
| Хостов/кластеров | 3 (`api.worldoftanks.{com,eu,asia}`) | 1 (`api.tanki.su`) |
| `application_id` на кластер | один общий, без привязки к Реалму | один (Реалма нет) |
| `login` параметры | `application_id`\*, `display`, `expires_at`, `nofollow`, `redirect_uri` | те же поля |
| `login` успех → `redirect_uri` | `status`, `access_token`, `expires_at`, `account_id`, `nickname` | те же поля |
| `login` коды ошибок | `401 AUTH_CANCEL`, `403 AUTH_EXPIRED`, `410 AUTH_ERROR` | те же коды |
| `prolongate` параметры | `application_id`\*, `access_token`\*, `expires_at` | те же поля |
| `logout` параметры | `application_id`\*, `access_token`\* | те же поля |
| Срок `access_token` | максимум 2 недели | максимум 2 недели |
| Автономное приложение | только `application_id`, 10 запросов/с с одного IP, без IP-whitelist | то же |

## Источники

Wargaming (developers.wargaming.net):

- [Getting Started](https://developers.wargaming.net/documentation/guide/getting-started/)
- [Using API (Application Identification, Application Types, Personal user data, Limitations)](https://developers.wargaming.net/documentation/guide/principles/)
- [`wot/auth/login` — OpenID login](https://developers.wargaming.net/reference/all/wot/auth/login/)
- [`wot/auth/prolongate` — Access Token extension](https://developers.wargaming.net/reference/all/wot/auth/prolongate/)
- [`wot/auth/logout` — Log out](https://developers.wargaming.net/reference/all/wot/auth/logout/)

Живая проверка (2026-09-07), тот же `WG_APPLICATION_ID` из `.env`, на всех трёх хостах:

- `GET /wot/encyclopedia/info/?application_id=…` — публичный метод, `"status":"ok"` на `api.worldoftanks.com`, `api.worldoftanks.eu`, `api.worldoftanks.asia`.
- `GET /wot/auth/login/?application_id=…&nofollow=1` — `"status":"ok"` и `data.location` на страницу WG OpenID своего Реалма (`na` / `eu` / `asia.wargaming.net`) на всех трёх хостах.
