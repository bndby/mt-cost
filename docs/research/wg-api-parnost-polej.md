# Поля WG Public API, которые читает Оценка

Снимок справочника 2026-09-09. Источник: [developers.wargaming.net](https://developers.wargaming.net). Хост — Реалм входа: `api.worldoftanks.com`, `api.worldoftanks.eu`, `api.worldoftanks.asia`.

Один `application_id` на все три хоста. Запросы с `access_token` — только HTTPS.

## `wot/account/info`

Параметры: `application_id`, `account_id`, `access_token`, `extra`, `fields`.

В `extra` для имущества: `private.boosters`, `private.garage`, `private.rented`.

Поля: `private.credits`, `private.gold`, `private.bonds`, `private.free_xp`, `private.premium_expires_at`, `private.garage`, `private.rented`, `private.boosters` (`count`, `expiration_time`, `state`).

## `wot/encyclopedia/vehicles`

Каталог, без токена. Поля: `tank_id`, `price_credit`, `price_gold`, `is_premium`, `is_gift`. Владения в этом методе нет.

## `wot/encyclopedia/boosters`

Каталог, без токена. Цена резерва — `price_gold` у конкретного `booster_id`. Плоской ставки на тип нет.

## `wot/clans/accountinfo`

Без токена. Клан-тег: `data[account_id].clan.tag`. Если игрока нет в клане, справочник не фиксирует форму пустого ответа; клиент считает отсутствие тега нормальным.
