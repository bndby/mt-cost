# Парность полей: WG (Wargaming) World of Tanks Public API vs Lesta

Исследование 2026-09-06/07. Источники: только WG Dev Room — [справочник API](https://developers.wargaming.net/reference/) и [руководства](https://developers.wargaming.net/documentation/guide/getting-started/). Вики, форумы и блоги не используются. Значения полей извлечены напрямую со страниц справочника (текст страницы), а не пересказаны по памяти.

Игра: World of Tanks (кластер Wargaming). Методы лежат в блоке `wot/`. Хост в примерах для реалма EU: `api.worldoftanks.eu`.

Проверяемая гипотеза (issue [#51](https://github.com/bndby/mt-cost/issues/51)): поля, которые код читает у Lesta (`docs/research/lesta-api-imushchestvo.md`, `src/adapters/lesta-http.ts`, issue [#25](https://github.com/bndby/mt-cost/issues/25)), совпадают поле-в-поле у WG.

## Ответ

**Да, полная парность.** По всем трём проверяемым методам и всем перечисленным в задаче полям название поля, тип и семантика у WG совпадают с Lesta буквально — включая полный список допустимых значений параметра `extra` у `account/info` и точное текстовое описание полей у `encyclopedia/vehicles` и `clans/accountinfo`. Расхождений в названиях, доступности или дополнительных/отсутствующих полях **не найдено** в рамках заявленного в задаче набора полей.

Единственное отличие — не в полях, а в оформлении справочника: язык описаний в WG Dev Room — английский (Lesta — русский), и заголовок метода `wot/clans/accountinfo` в WG называется «Clan member details» (у Lesta, по формулировке issue #25, — «Клан-тег аккаунта» в терминах задачи, но это ярлык раздела, не имя метода в URL — оба справочника используют один и тот же путь `wot/clans/accountinfo/`).

## Таблица: метод → поле → Lesta → WG

| Метод | Поле | Lesta (`docs/research/lesta-api-imushchestvo.md`, issue #25) | WG (эта проверка) | Совпадает? |
| --- | --- | --- | --- | --- |
| `wot/account/info` | `private.credits` | Серебро | Credits (numeric) | ✅ имя и тип совпадают |
| `wot/account/info` | `private.gold` | Золото | Gold (numeric) | ✅ |
| `wot/account/info` | `private.bonds` | Боны | Bonds (numeric) | ✅ |
| `wot/account/info` | `private.garage` | Техника в Ангаре, `list of integers`, доп. поле (`extra`) | Vehicles in the Garage, `list of integers`, "An extra field." | ✅ имя, тип, признак extra совпадают |
| `wot/account/info` | `private.rented` | `tank_id`, `expiration_time`, `compensation_credits`, `compensation_gold`, доп. поле | `private.rented.tank_id` (Rented vehicle ID), `.expiration_time` (Vehicle Rental expiration time), `.compensation_credits` (Rental compensation in credits), `.compensation_gold` (Rental compensation in gold), "An extra field." | ✅ все 4 подполя совпадают |
| `wot/account/info` | `extra` допустимые значения | `private.boosters`, `private.garage`, `private.rented` (+ `private.grouped_contacts`, `private.personal_missions` — не имущество) + `statistics.*` | `"private.boosters" "private.garage" "private.grouped_contacts" "private.personal_missions" "private.rented"` + тот же набор `statistics.*` | ✅ идентичный список |
| `wot/encyclopedia/vehicles` | `tank_id` | Идентификатор техники, numeric | Vehicle ID, numeric | ✅ |
| `wot/encyclopedia/vehicles` | `price_credit` | Стоимость в серебре, numeric | Cost in credits, numeric | ✅ |
| `wot/encyclopedia/vehicles` | `price_gold` | Стоимость в золоте, numeric | Cost in gold, numeric | ✅ |
| `wot/encyclopedia/vehicles` | `is_premium` / `is_gift` / `prices_xp` (сопутствующие поля из lesta-документа) | boolean / boolean / associative array | boolean ("Indicates if the vehicle is Premium vehicle") / boolean ("Indicates if the vehicle is a gift vehicle") / associative array ("List of research costs…") | ✅ |
| `wot/clans/accountinfo` | `clan.tag` | Клан-тег, доступен без `access_token`, только по `account_id` (issue #25) | Clan tag, string; метод требует только `application_id*` и `account_id*` — `access_token` в параметрах метода не значится | ✅ имя поля и отсутствие требования `access_token` совпадают |

## Метод 1: `wot/account/info`

Страница справочника называется «Player personal data» (в URL — `wot/account/info/`), метод описан как «Method returns player details.»

- https://developers.wargaming.net/reference/all/wot/account/info/

### Параметры

`application_id*`, `account_id*` («Player account ID. Maximum limit: 100.»), `access_token` («Access token for the private data of a user's account; can be received via the authorization method; valid within a stated time period»), `extra`, `fields`, `language`. Набор параметров и их назначение идентичны Lesta.

- https://developers.wargaming.net/reference/all/wot/account/info/

### `extra` — точный список допустимых значений (снято со страницы)

```
"private.boosters" "private.garage" "private.grouped_contacts" "private.personal_missions"
"private.rented" "statistics.epic" "statistics.fallout" "statistics.globalmap_absolute"
"statistics.globalmap_champion" "statistics.globalmap_middle" "statistics.random"
"statistics.ranked_10x10" "statistics.ranked_15x15" "statistics.ranked_battles"
"statistics.ranked_battles_current" "statistics.ranked_battles_previous"
"statistics.ranked_season_1" "statistics.ranked_season_2" "statistics.ranked_season_3"
```

Это **тот же набор**, который приводит `docs/research/lesta-api-imushchestvo.md` для Lesta (`private.boosters`, `private.garage`, `private.rented`, плюс не относящиеся к имуществу `private.grouped_contacts`, `private.personal_missions`).

- https://developers.wargaming.net/reference/all/wot/account/info/

### Поля `private` (снято со страницы, блок Response)

| Поле | Тип | Формулировка справочника WG |
| --- | --- | --- |
| `private.bonds` | numeric | Bonds |
| `private.credits` | numeric | Credits |
| `private.free_xp` | numeric | Free Experience |
| `private.garage` | list of integers | Vehicles in the Garage. *(An extra field.)* |
| `private.gold` | numeric | Gold |
| `private.is_premium` | boolean | Indicates if the account is Premium Account |
| `private.premium_expires_at` | timestamp | Premium Account expiration time |
| `private.rented.compensation_credits` | numeric | Rental compensation in credits *(под `private.rented`, extra field)* |
| `private.rented.compensation_gold` | numeric | Rental compensation in gold |
| `private.rented.expiration_time` | timestamp | Vehicle Rental expiration time |
| `private.rented.tank_id` | numeric | Rented vehicle ID |
| `private.boosters.count` / `.expiration_time` / `.state` | — | Personal Reserves (extra field), идентично Lesta |

Каждое из перечисленных в задаче полей (`private.credits`, `private.gold`, `private.bonds`, `private.garage`, `private.rented`) присутствует **по тому же имени, типу и с тем же статусом «дополнительное поле» (`extra`)**, что и на Lesta.

- https://developers.wargaming.net/reference/all/wot/account/info/

### Расхождения

Не найдено. Формулировки на WG на английском, семантически идентичны русским формулировкам Lesta. Других валют, кроме тех, что уже названы в lesta-документе (`credits`, `gold`, `bonds`, `free_xp`), в блоке `private` также нет.

## Метод 2: `wot/encyclopedia/vehicles`

Страница называется «Vehicles», метод описан как «Method returns list of available vehicles.»

- https://developers.wargaming.net/reference/all/wot/encyclopedia/vehicles/

### Поля ответа (снято со страницы, точные строки)

```
price_credit    numeric    Cost in credits
price_gold      numeric    Cost in gold
tank_id         numeric    Vehicle ID
is_premium      boolean    Indicates if the vehicle is Premium vehicle
is_gift         boolean    Indicates if the vehicle is a gift vehicle
prices_xp       associative array   List of research costs in form of pairs: parent vehicle ID / cost of research in XP
```

Это ровно те поля и типы, что в lesta-документе (`price_credit`, `price_gold`, `tank_id`, `is_premium`, `is_gift`, `prices_xp`). Совпадают и параметры запроса: `tank_id` («Vehicle ID. Maximum limit: 100.»), `fields`, `limit` (до 100 записей за раз, как у Lesta), `page_no`, `nation`, `tier`, `type`, `language`.

- https://developers.wargaming.net/reference/all/wot/encyclopedia/vehicles/

### Расхождения

Не найдено для проверяемых полей. Как и у Lesta, у WG в этом методе нет полей владения (склада) — только каталожные данные техники; владение отдаёт `account/info`. Метод не помечен как устаревший (в отличие от `encyclopedia/tanks`, который в задаче не проверяется).

## Метод 3: `wot/clans/accountinfo`

Заголовок страницы справочника — «Clan member details» (в URL — `wot/clans/accountinfo/`), метод описан как «Method returns detailed clan member information and brief clan details.»

- https://developers.wargaming.net/reference/all/wot/clans/accountinfo/

### Параметры

`application_id*`, `account_id*` («Account ID. Maximum limit: 100. Min value is 1.»), `fields`, `language`. **`access_token` среди параметров метода не значится** — подтверждает вывод issue #25 о том, что для клан-тега `access_token` не нужен, ни на Lesta, ни на WG.

- https://developers.wargaming.net/reference/all/wot/clans/accountinfo/

### Поле `clan.tag`

```
clan.tag    string    Clan tag
```

Совпадает по имени и типу с тем, что issue #25 фиксирует для Lesta (`data[account_id].clan.tag`). Структура ответа та же: верхнеуровневые `account_id`, `account_name`, `joined_at`, `role`, `role_i18n`, вложенный объект `clan` с `clan.clan_id`, `clan.tag`, `clan.name`, `clan.color`, `clan.members_count`, `clan.created_at`, `clan.emblems.*`.

- https://developers.wargaming.net/reference/all/wot/clans/accountinfo/

### Расхождения

Не найдено для `clan.tag`. Как и у Lesta, справочник WG не описывает явно поведение при отсутствии клана (что возвращается, если игрок не состоит в клане, — `null` по значению `account_id` или отсутствие ключа) — то есть оба справочника одинаково неполны в этом нюансе; это не расхождение между Lesta и WG, а общий пробел документации в обоих форках.

## Общий механизм (для полноты, как в lesta-документе)

- `access_token` выдаётся через OpenID-логин: `wot/auth/login/` — страница существует и называется «OpenID login», аналогично `wot/auth/login/` у Lesta.
  - https://developers.wargaming.net/reference/all/wot/auth/login/
- Руководство «Getting Started» описывает `extra` тем же языком, что и Lesta: «Several methods use extra input parameter. It is intended to list extra fields to be included in the response. Extra fields are excluded by default.» И требование HTTPS для `access_token`: «For security reasons, the requests with access_token should be sent via HTTPS.»
  - https://developers.wargaming.net/documentation/guide/getting-started/

## Вывод

Для полного набора полей, заявленного в issue [#51](https://github.com/bndby/mt-cost/issues/51) (`wot/account/info`: `private.credits`, `private.gold`, `private.bonds`, `private.garage`, `private.rented`; `wot/encyclopedia/vehicles`: `tank_id`, `price_credit`, `price_gold`; `wot/clans/accountinfo`: `clan.tag`), справочник WG подтверждает **полную поле-в-поле парность** с тем, что этот код уже читает у Lesta (`src/adapters/lesta-http.ts`) и с тем, что зафиксировано в `docs/research/lesta-api-imushchestvo.md` и issue [#25](https://github.com/bndby/mt-cost/issues/25). Адаптер для WG может использовать те же имена полей и ту же форму разбора ответа, что и `createHttpLesta`, меняя только базовый хост (`api.worldoftanks.<realm>` вместо `api.tanki.su`).
