# Что Lesta Public API отдаёт как Имущество

Исследование 2026-08-30. Источники: только Lesta Dev Room — [руководства](https://developers.lesta.ru/documentation/) и [справочник API](https://developers.lesta.ru/reference/). Вики, форумы и блоги не используются.

Игра: Мир танков (кластер Lesta). Методы лежат в блоке `wot/`. Кластерный хост в примерах аутентификации: `api.tanki.su`.

## Ответ

При действующем `access_token` факт владения, достаточный для Оценки, отдаёт в основном **`wot/account/info`**: Серебро, Золото, боны, свободный опыт и (через `extra`) техника в Ангаре, аренда и личные резервы. Идентификатор танка — `tank_id`. Номинальные цены танков — **`wot/encyclopedia/vehicles`**: `price_credit`, `price_gold`, плюс флаги `is_premium` и `is_gift` (флаги не заменяют цену).

Оборудование и снаряжение имеют витрину цен (`encyclopedia/provisions`), личные резервы — тоже (`encyclopedia/boosters`). **Владения оборудованием, снаряжением, стилями, расходниками на складе и снарядами публичный API не отдаёт** — таких методов нет в справочнике Мира танков.

## Таблица: вид имущества → владение → цена → пробелы

| Вид имущества | Метод владения (нужен `access_token`) | Метод цены | Пробелы |
| --- | --- | --- | --- |
| Танк в Ангаре (`tank_id`) | `account/info` + `extra=private.garage` → `private.garage` (список id). Дубль: `tanks/stats` поле/`in_garage` | `encyclopedia/vehicles`: `price_credit`, `price_gold` | `account/tanks` **не** Ангар: поле `in_garage` снято. Для `is_gift` / нулевых цен каталог не говорит, как оценить. Установленные модули на конкретном танке аккаунта не отдаются. |
| Арендованный танк | `account/info` + `extra=private.rented`: `tank_id`, `expiration_time`, `compensation_credits`, `compensation_gold` | Компенсация аренды — там же; каталожная цена — `encyclopedia/vehicles` | Компенсация ≠ витринная цена. Документация не описывает форму объекта (один танк / словарь). |
| Серебро | `account/info` → `private.credits` | Само является ценой | Курс обмена в API нет (это не этот метод). |
| Золото | `account/info` → `private.gold` | Само является ценой | Рублёвый пакет золота API не отдаёт. |
| Боны | `account/info` → `private.bonds` | Нет | Нет поля цены бон и нет курса боны→серебро/золото. |
| Свободный опыт | `account/info` → `private.free_xp` | Нет | Не валюта Оценки; курса в API нет. |
| Личные резервы | `account/info` + `extra=private.boosters`: `count`, `expiration_time`, `state` | `encyclopedia/boosters`: `price_credit`, `price_gold` | В ответе владения не назван `booster_id` как ключ; справочник не связывает запись владения с каталогом явно. |
| Оборудование (`optionalDevice`) | Нет метода | `encyclopedia/provisions` (`type=optionalDevice`): `price_credit`, `price_gold` | Владение складом и «что стоит на танке» недоступны. Нет цены в бонах. |
| Снаряжение (`equipment`) | Нет метода | `encyclopedia/provisions` (`type=equipment`): `price_credit`, `price_gold` | То же. |
| Стили, камуфляжи, надписи, элементы внешнего вида | Нет метода | Нет метода | В справочнике Мира танков нет раздела витрины и нет инвентаря. |
| Расходники / снаряды на складе | Нет метода | Нет метода цены снарядов (есть только ТТХ `ammo`) | `default_profile.ammo` и `encyclopedia/vehicleprofile` — урон/пробитие, не цена и не запас. |
| Модули (орудие, башня, двигатель…) | Нет метода владения | `encyclopedia/modules`: `price_credit`; дерево: `vehicles.modules_tree.price_credit` / `price_xp` | Нет `price_gold` в актуальном `modules`. Устаревшие `tankengines` и т.п. ещё содержат `price_gold`. Неизвестно, какие модули куплены/исследованы у аккаунта. |
| Нашивки ранговых боёв | Нет метода владения | `encyclopedia/badges` — без цен | Не имущество для Оценки. |
| Премиум-аккаунт | `account/info`: `private.is_premium`, `private.premium_expires_at` | Нет | Срок есть, официальной цены пакета в Public API нет. |
| Клановые резервы | `stronghold/clanreserves` (обязательный `access_token`): `in_stock.amount` | Нет | Имущество клана, не аккаунта. |

## Как включаются private / extra

Персональные данные — «персональная информация игрока или клана игрока, доступная только авторизированным игрокам». В примерах руководства прямо названо **имущество**. Ключ — `access_token` (срок до двух недель, выдача через OpenID). Запросы с токеном — только HTTPS.

- https://developers.lesta.ru/documentation/guide/principles/
- https://developers.lesta.ru/documentation/guide/getting-started/
- https://developers.lesta.ru/reference/all/wot/auth/login/

`access_token` используется и для методов, которые без него публичны, но с токеном отдают расширенные поля.

Параметр `extra`: перечисление экстра-полей; **по умолчанию они исключены**. Список допустимых значений — в карточке метода.

- https://developers.lesta.ru/documentation/guide/getting-started/

У `account/info` допустимые extra, относящиеся к имуществу: `private.boosters`, `private.garage`, `private.rented` (также `private.grouped_contacts`, `private.personal_missions` — не имущество).

- https://developers.lesta.ru/reference/all/wot/account/info/

## Техника в Ангаре и идентификаторы

Идентификатор танка везде — `tank_id` (число).

### Канонический Ангар

`wot/account/info`, extra `private.garage`: поле `private.garage` — «Техника в Ангаре», тип `list of integers`, помечено как дополнительное.

- https://developers.lesta.ru/reference/all/wot/account/info/

Это единственное поле справочника, которое **называет список «техника в Ангаре»**, а не статистику.

### Фильтр и флаг в статистике

`wot/tanks/stats`:

- параметр `in_garage`: `1` — техника из Ангара, `0` — которой уже нет в Ангаре; обрабатывается **только** при действующем `access_token` для этого `account_id`; если параметр не указан — «вся техника»;
- поле ответа `in_garage` (boolean): «Присутствие техники в Ангаре»; тоже только с токеном.

- https://developers.lesta.ru/reference/all/wot/tanks/stats/

Метод описан как статистика «по каждой единице техники». Документация не утверждает, что танк без боёв попадёт в эту выборку. Для полного Ангара опираться на `private.garage`.

### `account/tanks` — не Ангар

`wot/account/tanks` возвращает `tank_id`, знак классности и счётчики боёв/побед. Параметр `access_token` есть, поля Ангара в ответе нет.

- https://developers.lesta.ru/reference/all/wot/account/tanks/

В апреле 2014 у «Техника игрока» поле `in_garage` **удалено**; указано пользоваться «Статистика по технике игрока».

- https://developers.lesta.ru/documentation/guide/deprecated-features/

## Серебро, Золото, боны и прочие валюты

Блок `private` метода `account/info` (при токене):

| Поле | Что это в справочнике |
| --- | --- |
| `private.credits` | Серебро |
| `private.gold` | Золото |
| `private.bonds` | Боны |
| `private.free_xp` | Свободный опыт |

Других валют (ивентовые жетоны, «кредитные боны» отдельным полем и т.д.) в карточке метода нет.

- https://developers.lesta.ru/reference/all/wot/account/info/

Курсов валют в Танкопедии нет: `encyclopedia/info` отдаёт версию клиента, языки, нации, типы техники, `tanks_updated_at` — не обмен.

- https://developers.lesta.ru/reference/all/wot/encyclopedia/info/
- Полный перечень методов Мира танков: https://developers.lesta.ru/reference/

## Личные резервы и аренда

### Личные резервы (владение)

`extra=private.boosters`. Поля: `count`, `expiration_time`, `state` (`ACTIVE` / `INACTIVE` / `USED`).

- https://developers.lesta.ru/reference/all/wot/account/info/

### Личные резервы (цены)

`wot/encyclopedia/boosters` (без токена): `booster_id`, `name`, `price_credit` («Стоимость в серебре»), `price_gold` («Стоимость в золоте»), `resource`, `lifetime`, `expires_at`, `is_auto`.

- https://developers.lesta.ru/reference/all/wot/encyclopedia/boosters/

Связь «запись в `private.boosters` ↔ `booster_id`» в тексте справочника не описана.

### Аренда

`extra=private.rented`: `tank_id`, `expiration_time`, `compensation_credits`, `compensation_gold`.

- https://developers.lesta.ru/reference/all/wot/account/info/

Компенсация — не каталожная цена танка.

## Оборудование, снаряжение, стили, расходники

### Витрина оборудования и снаряжения

`wot/encyclopedia/provisions` — «список доступного оборудования и снаряжения». Параметр `type`: `equipment` — снаряжение, `optionalDevice` — оборудование. Цены: `price_credit`, `price_gold`. Владения нет: нет `access_token`, нет склада.

- https://developers.lesta.ru/reference/all/wot/encyclopedia/provisions/

У техники есть только список совместимых id: `encyclopedia/vehicles.provisions`.

- https://developers.lesta.ru/reference/all/wot/encyclopedia/vehicles/

### Стили

В оглавлении справочника Мира танков нет методов стилей, камуфляжей, надписей, «2D/3D оформления». `encyclopedia/badges` — нашивки ранговых боёв: `badge_id`, имя, картинки; цен и владения нет.

- https://developers.lesta.ru/reference/
- https://developers.lesta.ru/reference/all/wot/encyclopedia/badges/

### Снаряды / расходники на складе

Характеристики снарядов: `default_profile.ammo` у `encyclopedia/vehicles` и блок `ammo` у `encyclopedia/vehicleprofile` (урон, пробитие, тип). Полей цены и количества на аккаунте нет.

- https://developers.lesta.ru/reference/all/wot/encyclopedia/vehicles/
- https://developers.lesta.ru/reference/all/wot/encyclopedia/vehicleprofile/

## Энциклопедия техники: хватает ли полей для номинальной цены танка

Актуальный метод: **`wot/encyclopedia/vehicles`** (не путать с устаревшим `encyclopedia/tanks`, где цен нет).

Поля, нужные Оценке:

| Поле | Тип | Формулировка справочника |
| --- | --- | --- |
| `tank_id` | numeric | Идентификатор техники |
| `price_credit` | numeric | Стоимость в серебре |
| `price_gold` | numeric | Стоимость в золоте |
| `is_premium` | boolean | Является ли техника премиум техникой |
| `is_gift` | boolean | Является ли техника подарочной |
| `prices_xp` | associative array | Стоимость **исследования** в опыте (не покупка за серебро/золото) |

- https://developers.lesta.ru/reference/all/wot/encyclopedia/vehicles/

**Для номинальной цены танка полей `price_credit` и `price_gold` достаточно там, где каталог заполняет хотя бы одно из них.** `is_premium` и `is_gift` — классификация, не сумма. Справочник не говорит:

- какое поле заполнено у премиум / прокачиваемой / подарочной техники;
- что делать, если оба цены нулевые или отсутствуют (типичный случай награды/`is_gift` — это уже вывод за пределами текста API);
- как соотнести аренду с каталожной ценой.

Устаревший `encyclopedia/tanks`: `is_premium` есть, `price_*` нет. Помечен «Метод устарел».

- https://developers.lesta.ru/reference/all/wot/encyclopedia/tanks/

`encyclopedia/vehicleprofiles` даёт `price_credit` **комплектации** (набор модулей), не цену владения танком.

- https://developers.lesta.ru/reference/all/wot/encyclopedia/vehicleprofiles/

## Модули (не танк в Ангаре)

`wot/encyclopedia/modules`: `price_credit` («Стоимость в серебре»), без `price_gold` в карточке. Владения модулями у аккаунта нет.

- https://developers.lesta.ru/reference/all/wot/encyclopedia/modules/

Устаревший `encyclopedia/tankengines` (и однотипные методы модулей) ещё содержит `price_credit` и `price_gold`. Помечен «Метод устарел».

- https://developers.lesta.ru/reference/all/wot/encyclopedia/tankengines/

`vehicles.modules_tree`: `price_credit`, `price_xp` — стоимость модуля в дереве исследования, не инвентарь.

## Что явно недоступно через публичный API

Полный список методов Мира танков на https://developers.lesta.ru/reference/ не содержит:

- склада оборудования / снаряжения / расходников / снарядов;
- стилей, камуфляжей, надписей, внешнего вида;
- курса боны ↔ серебро/золото и рублёвых пакетов золота;
- купленных или исследованных модулей аккаунта;
- экипажа как оцениваемого имущества;
- установленной на танк комплектации у конкретного аккаунта (есть только энциклопедийные профили по `tank_id` + id модулей, которые клиент должен знать сам).

Клановые резервы (`stronghold/clanreserves`) требуют `access_token`, отдают `in_stock.amount`, но это клан, не имущество аккаунта; цен нет.

- https://developers.lesta.ru/reference/all/wot/stronghold/clanreserves/

Поле `private` без токена в руководстве отнесено к персональным данным: другим игрокам такое не показывается.

## Практическая связка для Оценки

1. OpenID → `access_token` + `account_id`: https://developers.lesta.ru/reference/all/wot/auth/login/
2. `account/info` с токеном и `extra=private.garage,private.boosters,private.rented` → Серебро, Золото, боны, список `tank_id` Ангара, резервы, аренда.
3. `encyclopedia/vehicles` (пагинация `limit`/`page_no`, до 100 записей) → `price_credit` / `price_gold` по тем же `tank_id`.
4. Личные резервы: сопоставить владение с `encyclopedia/boosters`, если удастся однозначно сопоставить идентификаторы.
5. Оборудование, стили, склад расходников — **в этой спецификации Public API оценить нельзя**: нет владения и/или нет витрины.
