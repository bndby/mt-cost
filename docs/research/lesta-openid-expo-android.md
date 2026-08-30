# Lesta OpenID в Expo на Android (без бэкенда)

Вопрос: как устроен вход Lesta OpenID для **автономного** (standalone) приложения и что из этого применимо к Expo / React Native на Android, когда своего сервера нет.

Термины — как в `CONTEXT.md`: **Игрок**, **Аккаунт**, **Lesta OpenID**. Пароль приложение не собирает.

Источники: [Lesta Dev Room](https://developers.lesta.ru/) (руководство и справочник `wot/auth/*`) и актуальная документация Expo AuthSession / WebBrowser / linking (через Context7 / docs.expo.dev). Дата съёмки: 2026-08-30.

## Короткий ответ

Вход — не OAuth2 authorization code. Метод [`wot/auth/login`](https://developers.lesta.ru/reference/all/wot/auth/login/) открывает страницу Lesta OpenID; после успеха Lesta **редиректит** игрока на `redirect_uri` и кладёт в параметры URL `access_token`, `expires_at`, `account_id`, `nickname`. Токен живёт **не больше двух недель**, продлевается [`wot/auth/prolongate`](https://developers.lesta.ru/reference/all/wot/auth/prolongate/) без повторного ввода пароля. Если в приложении есть вход через Lesta OpenID, **выход обязателен** ([`wot/auth/logout`](https://developers.lesta.ru/reference/all/wot/auth/logout/) и [правила access token](https://developers.lesta.ru/documentation/guide/principles/)).

Expo Android без бэкенда = **автономное приложение**: `application_id` живёт в клиенте и уходит в каждый запрос. Возврат в приложение — custom scheme или Android App Links; в Dev Room **нет поля** для регистрации `redirect_uri`. Принимает ли Lesta custom scheme (`myapp://…`), в публичных документах **не сказано** — это должен проверить тикет регистрации приложения.

## 1. Типы приложений и где живёт `application_id`

Источник: [Использование API — типы приложений](https://developers.lesta.ru/documentation/guide/principles/), [Начало работы](https://developers.lesta.ru/documentation/guide/getting-started/).

| | Серверное | Автономное |
| --- | --- | --- |
| Связь | сервер–сервер | клиент–сервер |
| IP | белый список, **макс. 5** адресов на `application_id`; иначе `INVALID_IP_ADDRESS` | разные IP, список не задаётся |
| Что проверяется | `application_id` **и** IP | только `application_id` |
| Квота | 20 запросов/с **на каждый** указанный IP | 10 запросов/с **с одного IP** |

Максимум **10 приложений** на кабинет. Тип и описание правятся в «Мои приложения», изменения сразу в силе.

Для этой спецификации (Expo Android, своего бэкенда нет) подходит **только автономное**. Серверное требует стабильных исходящих IP бэкенда — их нет.

`application_id` выдаётся при регистрации и **обязателен во всех методах API**, включая логин. Lesta просит не раскрывать ключ третьим лицам; у автономного приложения он всё равно оказывается в APK. Это модель «публичный клиентский идентификатор», а не секрет, который можно спрятать без сервера. Демо-доступ прекращён: живой ответ `api.tanki.su` на `application_id=demo` — `DEMO_APPLICATION_IS_BLOCKED` (проверено 2026-08-30).

## 2. Регистрация в Dev Room: что есть в форме

Источник: [Регистрация приложения](https://developers.lesta.ru/documentation/guide/getting-started/).

Шаги кабинета:

1. Войти аккаунтом Леста.
2. «Мои приложения» → «Добавить приложение».
3. **Тип** (серверное / автономное).
4. **Название** — его игрок увидит на странице «Сеансы» в личном кабинете.
5. После создания выдаётся `application_id`.

В опубликованной инструкции **нет** поля redirect URI, whitelist URL, package name или SHA-256. Для серверного типа дополнительно нужны IP. Спецификация не должна требовать «зарегистрировать redirect в Dev Room» — такого шага в гайде нет. Что спецификация **должна** потребовать — в конце файла.

## 3. Метод входа `wot/auth/login`

Источник: [Вход по OpenID](https://developers.lesta.ru/reference/all/wot/auth/login/), [персональные данные и access token](https://developers.lesta.ru/documentation/guide/principles/).

Аутентификация игрока — **Идентификатор Леста Игры (OpenID / Lesta OpenID)**. Пароль и email вводятся **на странице Lesta**, не в приложении. Это же требуют [условия использования](https://developers.lesta.ru/documentation/rules/agreement/): приложение не запрашивает email и пароль аккаунта Леста; вход только через Lesta ID.

Запрос к кластеру Мира танков (хост из default `redirect_uri` справочника и живого API):

```
https://api.tanki.su/wot/auth/login/?application_id=…&redirect_uri=…&display=page
```

Формат URI: `http(s)://<server>/<API_name>/<method block>/<method name>/?<get params>` — [Начало работы](https://developers.lesta.ru/documentation/guide/getting-started/). Параметры можно передать GET (в URL) или POST (в теле). Для открытия в браузере игрока это GET. Живой хост `https://api.tanki.su` отвечает JSON, заголовок `X-Api-Version: 2.77.1` (2026-08-30). В кабинете указан один realm: `ru` / СНГ.

### Параметры

| Поле | Обязателен | Смысл |
| --- | --- | --- |
| `application_id` | да | идентификатор приложения |
| `redirect_uri` | нет | куда вернуть игрока после аутентификации. По умолчанию в справочнике: `api.tanki.su/wot//blank/` (как на странице, со второй косой) |
| `expires_at` | нет | срок `access_token`: UNIX-время **или** дельта в секундах; **не больше двух недель** от «сейчас» |
| `nofollow` | нет | `0` (по умолчанию) — HTTP-редирект на страницу логина; `1` — редиректа нет, в JSON поле `data.location` с URL страницы входа. Мин. 0, макс. 1 |
| `display` | нет | вид формы для мобильных. В таблице справочника явно: `"page"` — страница, `"popup"` — всплывающее окно. Остальное в публичном HTML обрезано (`…`) |

Для Custom Tabs Android уместен `display=page`.

`nofollow=1` удобен, если сначала нужен JSON, а страницу входа открывает уже `WebBrowser`. Для прямого открытия в Custom Tabs достаточно GET без `nofollow`.

### Что приходит на `redirect_uri`

Успех:

- `status` = `ok`
- `access_token` — ключ ко всем методам, требующим аутентификации
- `expires_at` — конец жизни токена
- `account_id` — идентификатор аккаунта
- `nickname` — имя аккаунта

Ошибка:

- `status` = `error`
- `code`, `message`

Ошибки метода: `401 AUTH_CANCEL` (игрок отменил), `403 AUTH_EXPIRED` (время ожидания), `410 AUTH_ERROR`.

Это **не** обмен `code` на токен. Токен оказывается в query (или эквиваленте) `redirect_uri`. Expo `useAuthRequest` по умолчанию ждёт authorization code и часто обмен на сервере — к Lesta это не подходит. Ближе: `WebBrowser.openAuthSessionAsync` + разбор URL, либо implicit (`ResponseType.Token`) только если провайдер кладёт токен так, как ожидает AuthSession (часто fragment `#`). У Lesta в справочнике — «параметры к redirect_uri», то есть query. Надёжнее парсить URL самим (`Linking.parse` / `URLSearchParams`).

## 4. Срок `access_token` и продление

Источники: [принципы](https://developers.lesta.ru/documentation/guide/principles/), [Начало работы](https://developers.lesta.ru/documentation/guide/getting-started/), [Продление Access Token](https://developers.lesta.ru/reference/all/wot/auth/prolongate/).

- Максимум **две недели** с момента выдачи (`expires_at` на логине это же ограничивает).
- После «выхода» токен из‑за кеша может ещё **около 10 минут** считаться действительным.
- Не продлили — методы персональных данных отвечают ошибкой, игроку нужно снова пройти Lesta OpenID.
- Все запросы **с** `access_token` — только **HTTPS**. Токен и персональные данные третьим лицам передавать нельзя.

[`wot/auth/prolongate`](https://developers.lesta.ru/reference/all/wot/auth/prolongate/) выдаёт **новый** `access_token` по ещё действующему. Для случая, когда игрок всё ещё в приложении, а срок подходит к концу.

Параметры: `application_id`*, `access_token`*, `expires_at` (тот же лимит двух недель).

Ответ: `access_token`, `account_id`, `expires_at`.

Продление **без** участия игрока (пароль снова не нужен), пока текущий токен жив.

## 5. Обязательный выход

Источники: [принципы — access token](https://developers.lesta.ru/documentation/guide/principles/), [Выход](https://developers.lesta.ru/reference/all/wot/auth/logout/).

Если в приложении есть аутентификация через **Леста Open ID**, функция «выход» **обязательна**.

[`wot/auth/logout`](https://developers.lesta.ru/reference/all/wot/auth/logout/): `application_id`*, `access_token`*. После вызова токен перестаёт действовать (с оговоркой про ~10 минут кеша).

Игрок может сам снять сессию на странице «Сеансы» в личном кабинете — это тоже инвалидирует `access_token`. Название приложения из Dev Room как раз видно в этом списке.

На выходе из Android-приложения: вызвать `auth/logout`, забыть локальный токен.

## 6. Возврат в Android и ограничения Lesta на `redirect_uri`

### Что говорит Lesta

- `redirect_uri` описан как **URL**.
- Значение по умолчанию — HTTPS на `api.tanki.su` (`…/wot//blank/`).
- В форме регистрации **нет** whitelist redirect.
- Отдельного текста «custom scheme запрещён / разрешён» в руководстве и справочнике **нет**. Невалидное поле в общих ошибках — `INVALID_%FIELD%` ([Начало работы](https://developers.lesta.ru/documentation/guide/getting-started/)).

Без своего `application_id` empirically проверить `myapp://callback` нельзя (демо заблокирован). Это работа тикета регистрации, не этого файла.

### Что говорит Expo (Android)

Источники: [Authentication](https://docs.expo.dev/guides/authentication/), [WebBrowser](https://docs.expo.dev/versions/latest/sdk/webbrowser/), [Linking into your app](https://docs.expo.dev/linking/into-your-app/), [Android App Links](https://docs.expo.dev/linking/android-app-links/). SDK WebBrowser в docs — v57 на момент съёмки.

**Custom scheme**

- В `app.json` / `app.config.js`: `expo.scheme` (например `myapp`) → ссылки вида `myapp://…`.
- `AuthSession.makeRedirectUri({ scheme, path })` собирает URI под среду. Для development/production build это `scheme://path`; в Expo Go — `exp://…` (схему Expo Go кастомизировать нельзя).
- **Expo Go нельзя** использовать для проверки OAuth/OpenID: нужен development build (`npx expo run:android` / EAS). После смены `scheme` — `npx expo prebuild --clean` и пересборка.
- Если `scheme` не задан, Expo Prebuild берёт `android.package` как схему.

**`openAuthSessionAsync` на Android**

На Android **нет** нативного AuthSession. Полифилл: Chrome Custom Tabs + гонка с `Linking` listener. Редирект на custom scheme приходит как intent → событие `url`; если URL начинается с `returnUrl`, промис `{ type: 'success', url }`. Custom Tab лучше не уничтожать при уходе в фон (`useProxyActivity`, по умолчанию `true`).

`WebBrowser.openAuthSessionAsync(url, redirectUrl)`: `url` — страница логина; `redirectUrl` — префикс возврата. На Android это Custom Tabs + AppState + Linking.

Имеет смысл `WebBrowser.warmUpAsync()` до показа логина и `coolDownAsync()` после.

`maybeCompleteAuthSession()` — **только web**; на Android ничего не делает / «Not supported».

**Android App Links (`https://`)**

Нужны `android.intentFilters` с `autoVerify: true`, хост и путь, плюс `/.well-known/assetlinks.json` на **HTTPS-сайте** (package + SHA-256 подписи). Своего API-бэкенда это не требует — достаточно статики. Без установленного приложения custom scheme не откроет апк; App Links упадут на сайт.

### Что спецификация может опереть на факты, а что — нет

| Путь возврата | Expo | Lesta (документы) |
| --- | --- | --- |
| Custom scheme `scheme://…` | основной путь AuthSession / `openAuthSessionAsync` | не описан; default — https URL |
| App Links `https://домен/…` | отдельная настройка + хостинг `assetlinks.json` | форма URL совпадает с формулировкой «URL» и с default |
| Default `api.tanki.su/wot/…/blank/` | в приложение не вернёт | страница-заглушка API |

Пока регистрация не дала живой `application_id`, спецификация должна **зафиксировать проверку** обоих кандидатов (`scheme://` и `https://`), а не выбрать один как доказанный.

## 7. Последовательность входа и выхода (Expo Android, автономное)

1. Зарегистрировать **автономное** приложение, сохранить `application_id` в клиенте (не как «секрет сервера»).
2. Собрать development build со `scheme` (не Expo Go).
3. Собрать `redirect_uri` через `makeRedirectUri` (или явно native URI) и **проверить** его живым `wot/auth/login`.
4. Открыть `https://api.tanki.su/wot/auth/login/?application_id=…&redirect_uri=…&display=page` в `WebBrowser.openAuthSessionAsync` (или `location` после `nofollow=1`).
5. Игрок вводит логин/пароль **на странице Lesta OpenID**.
6. По `{ type: 'success', url }` разобрать `status`, `access_token`, `expires_at`, `account_id`, `nickname`. Хранить токен в защищённом хранилище устройства (Expo рекомендует `expo-secure-store`, не AsyncStorage).
7. Дальнейшие вызовы персональных данных: HTTPS, `application_id` + `access_token`. Квота автономного: 10 запросов/с с IP игрока.
8. Пока сессия нужна — `wot/auth/prolongate` до истечения двух недель.
9. Выход: `wot/auth/logout`, стереть локальный токен. Кнопка выхода в UI обязательна.

## 8. Что спецификация должна потребовать от регистрации в Dev Room

Это разблокирует тикет «зарегистрировать standalone-приложение»; сам кабинет здесь не заполняется.

Обязательные поля формы (по гайду):

1. **Тип:** автономное приложение (не серверное: нет белого списка IP и нет своего бэкенда).
2. **Название:** человекочитаемое — его увидит игрок в «Сеансы».

После создания, вне формы, но обязательно для спецификации:

3. Сохранить `application_id` для Android-клиента. Не публиковать как «секрет сервера»; не класть в открытые issue.
4. **Эмпирически** вызвать `wot/auth/login` с кандидатами `redirect_uri`:
   - custom scheme development build (`makeRedirectUri` / `scheme://…`);
   - при отказе Lesta (`INVALID_redirect_uri` или аналог) — HTTPS App Links (нужен домен и `assetlinks.json`, не API-бэкенд).
5. Зафиксировать рабочий `redirect_uri` в спецификации (не в Dev Room: поля там нет).
6. Заложить в спецификацию продукта: обязательный выход, HTTPS для запросов с токеном, запрет сбора пароля/email, лимит 10 запросов/с с IP.

Не требовать от регистрации: список redirect URI, package name, SHA-256 в кабинете Lesta — в опубликованной форме их нет.

## Источники

Lesta:

- [Кабинет разработчика](https://developers.lesta.ru/)
- [Начало работы](https://developers.lesta.ru/documentation/guide/getting-started/)
- [Использование API](https://developers.lesta.ru/documentation/guide/principles/)
- [Вход по OpenID (`wot/auth/login`)](https://developers.lesta.ru/reference/all/wot/auth/login/)
- [Продление Access Token (`wot/auth/prolongate`)](https://developers.lesta.ru/reference/all/wot/auth/prolongate/)
- [Выход (`wot/auth/logout`)](https://developers.lesta.ru/reference/all/wot/auth/logout/)
- [Условия использования](https://developers.lesta.ru/documentation/rules/agreement/)

Expo (docs.expo.dev, съёмка через Context7 / fetch, SDK WebBrowser v57):

- [Authentication in Expo](https://docs.expo.dev/guides/authentication/)
- [expo-web-browser](https://docs.expo.dev/versions/latest/sdk/webbrowser/)
- [expo-auth-session — `makeRedirectUri`](https://docs.expo.dev/versions/latest/sdk/auth-session/)
- [Linking into your app](https://docs.expo.dev/linking/into-your-app/)
- [Android App Links](https://docs.expo.dev/linking/android-app-links/)
