# Курс золота по Реалмам

Снимок: 2026-10-01. Источник — гостевой GraphQL Премиум магазина Wargaming, операция `GetProducts`, `category: gold`, `title_code` из настроек страницы. Вики, форумы и пересчёт валют не используются.

## Короткий ответ

Страна и реалм гостевой сессии задаёт IP, cookie страны их не меняет. Прямой адрес этой машины — **NL** / `eu`. NA и ASIA сняты через публичные HTTP-прокси; страна выхода сверена запросом `https://ipwho.is/` до витрины.

| Реалм Оценки | Выход | JWT `country` / `game_realm` | Титул | Крупнейший пакет только из золота |
| --- | --- | --- | --- | --- |
| EU | эта машина, NL | NL / eu | `eu.wot` | `permanent_gold30500`: **30 500 золота за 99,99 EUR** |
| NA | США, Los Angeles и Dallas, каталоги совпали | US / us | `us.wot` | `permanent_gold25000`: **25 000 золота за 99,99 USD** |
| ASIA | Китай, Shenzhen и Shijiazhuang, каталоги совпали | CN / sg | `sg.wot` | `ps_p_51`: **25 000 золота за 625 CNY** |

У всех трёх: `amount == original_amount`, `discount.pct == 0`, `applied_promotions` пуст. Титулы витрины — `us.wot` и `sg.wot`, не `na.wot` / `asia.wot`. Юань здесь — валюта китайской страны на азиатском титуле `sg.wot`, не отдельный китайский издательский сервер.

## EU, пакеты только из золота

Страница: [https://wargaming.net/shop/wot/gold/](https://wargaming.net/shop/wot/gold/). Запрос: `POST https://shop-graphql.wargaming.net/<md5>/` с гостевым `Authorization: Bearer` из cookie `wgnps_shop_jwt`. В JWT этой сессии: `country: NL`, `game_realm: eu`. Настройки страницы: `COUNTRY: NL`, `TITLES` включает `eu.wot`.

| Золото | Код | EUR | Скидка |
| --- | --- | --- | --- |
| 30 500 | `permanent_gold30500` | 99,99 | нет |
| 14 500 | `permanent_gold14500` | 49,99 | нет |
| 10 000 | `permanent_gold10000` | 35,79 | нет |
| 8 000 | `permanent_gold8000` | 29,12 | нет |
| 5 000 | `permanent_gold5000` | 18,86 | нет |
| 2 500 | `permanent_gold2500` | 9,95 | нет |
| 1 000 | `permanent_gold1000` | 4,25 | нет |
| 500 | `permanent_gold500` | 2,25 | нет |

Курс у пакетов не один: 99,99 / 30 500 меньше, чем 2,25 / 500. Курс золота берёт крупнейший, `permanent_gold30500`.

Не входят: комплекты со скидкой на той же витрине (`Fort Knox`, `Jackpot!`, `Care Package`, `Million Credit Bundle`, `Lieutenant's Pay` — у всех непустой `applied_promotions` и `amount` ниже `original_amount`) и `any_amount_gold` (`price_type: VARIABLE`).

`title_code` чужого Реалма с JWT этой страны отвечает `invalid_title`. Подмена `storefront` отвечает `STOREFRONT_NOT_FOUND`.

## NA, пакеты только из золота

Тот же URL и тот же `GetProducts`, `category: gold`. Два выхода в США: Los Angeles и Dallas. В обоих JWT: `country: US`, `game_realm: us`. Настройки страницы: `COUNTRY: US`, титул `us.wot`. Валюта цен — **USD**. Списки пакетов и цены совпали.

| Золото | Код | USD | Скидка |
| --- | --- | --- | --- |
| 25 000 | `permanent_gold25000` | 99,99 | нет |
| 12 000 | `permanent_gold12000` | 51,69 | нет |
| 6 500 | `permanent_gold6500` | 29,79 | нет |
| 3 000 | `permanent_gold3000` | 14,79 | нет |
| 1 250 | `permanent_gold1250` | 6,69 | нет |

Курс золота NA берёт крупнейший, `permanent_gold25000`: 99,99 / 25 000 USD за 1 золото.

Не входят те же типы, что на EU: комплекты со скидкой (`Fort Knox` 122,50 при базе 175,00; `Jackpot!`; `Care Package`; `Million Credit Bundle`; `Lieutenant's Pay`) и `any_amount_gold` (`VARIABLE`).

## ASIA, пакеты только из золота

Два независимых выхода в Китае: Shenzhen и Shijiazhuang. Оба JWT: `country: CN`, `game_realm: sg`, титул `sg.wot`, валюта **CNY**. Списки пакетов и цены совпали.

| Золото | Код | CNY | Скидка |
| --- | --- | --- | --- |
| 25 000 | `ps_p_51` | 625 | нет |
| 12 500 | `ps_p_109` | 321 | нет |
| 6 500 | `ps_p_49` | 171 | нет |
| 4 800 | `ps_p_108` | 127 | нет |
| 3 000 | `ps_p_48` | 81 | нет |
| 2 200 | `ps_p_107` | 60 | нет |
| 1 250 | `ps_p_47` | 35 | нет |

Имена пакетов на витрине — «25,000 Gold» и дальше по таблице; код не содержит число золота, число взято из `name`. Курс золота ASIA берёт крупнейший, `ps_p_51`: 625 / 25 000 CNY за 1 золото.

Не входят: `Million Credit Bundle`, `Fort Knox`, `Jackpot!`, `Care Package`, `Lieutenant Pay` (у всех непустой `applied_promotions` и `amount` ниже `original_amount`) и `ps_p_1285_web` («Any amount of Gold», `VARIABLE`).
