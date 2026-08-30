# Личные резервы: владение и `booster_id`

Исследование 2026-08-30. Вопрос: можно ли однозначно сопоставить запись владения личными резервами в Lesta Public API с `booster_id` энциклопедии и взять оттуда официальную цену в серебре или золоте для Оценки.

Источники: справочник Lesta Dev Room и его машиночитаемая схема, живой ответ `encyclopedia/boosters` на `api.tanki.su`. Вики, форумы, блоги и документация кластера Wargaming не используются.

- https://developers.lesta.ru/reference/all/wot/account/info/
- https://developers.lesta.ru/reference/all/wot/encyclopedia/boosters/
- https://developers.lesta.ru/api/methods/wot_account_info/
- https://developers.lesta.ru/api/methods/wot_encyclopedia_boosters/
- https://developers.lesta.ru/documentation/guide/getting-started/
- `https://api.tanki.su/wot/encyclopedia/boosters/?language=ru` (живой ответ, 2026-08-30)

Живой `private.boosters` не снимался: метод отдаёт поле только с `access_token`. Токен не изобретался.

## Ответ

**Нет: однозначный join владение ↔ каталог по первичным источникам Lesta не подтверждён.**

Каталог однозначен сам по себе. В живом `encyclopedia/boosters` блок `data` — словарь из 82 записей: ключ объекта совпадает с полем `booster_id` у всех 82. Официальная цена в золоте ненулевая у 43 записей; поле `price_credit` (стоимость в серебре) у всех 82 равно 0.

Владение этим ключом не подписано. В схеме `account/info` поле `private.boosters` имеет тип `block_header` (секция вложенных полей), не `associative array`. Вложенные поля — только `count`, `expiration_time`, `state`. Поля `booster_id` нет. Справочник не пишет, что ключ секции — идентификатор резерва. Без живого JSON с токеном форма (словарь / список / один объект) остаётся неизвестной.

Если бы владение оказалось словарём с ключом = `booster_id`, джойн был бы `ключ записи → data[ключ]` каталога. Схема этого не утверждает — в отличие от `private.personal_missions`, где явно сказано «ключ — идентификатор».

## Форма владения: `private.boosters`

Метод: `wot/account/info`. Extra `private.boosters` входит в допустимые значения параметра `extra` (по умолчанию extra-поля исключены).

- https://developers.lesta.ru/reference/all/wot/account/info/
- https://developers.lesta.ru/documentation/guide/getting-started/

Машиночитаемая схема того же метода (`type` у каждого поля):

| Путь | `type` в схеме | Текст описания |
| --- | --- | --- |
| `private.boosters` | `block_header` | «Личные резервы.» + «Дополнительное поле.» |
| `private.boosters.count` | `numeric` | «Количество личных резервов» |
| `private.boosters.expiration_time` | `timestamp` | «Время окончания действия» |
| `private.boosters.state` | `string` | «Статус личных резервов. Допустимые значения: ACTIVE — Активны; INACTIVE — Неактивны; USED — Использованы» |

- https://developers.lesta.ru/api/methods/wot_account_info/

`booster_id` в этой ветке схемы нет ни как поле, ни как описанный ключ.

Для сравнения в том же методе Lesta **умеет** называть словарь с ключом-идентификатором. `private.personal_missions`: тип `associative array`, текст «Ключ - идентификатор задачи, значение - статус». `private.garage`: тип `list of integers`. `private.rented`: тоже `block_header`, но среди вложенных полей есть `tank_id`. У `private.boosters` нет ни типа «словарь», ни поля-идентификатора.

- https://developers.lesta.ru/api/methods/wot_account_info/

Англоязычная схема того же метода (`?language=en`) не добавляет ключа: тип по-прежнему `block_header`, вложенные поля те же. Подпись секции там «Усилители», не «Личные резервы»; для Оценки каноническое имя — личные резервы (русская карточка метода).

Живой пример `private.boosters` в этой сессии недоступен. Руководство относит имущество к персональным данным: без `access_token` extra не проверить.

- https://developers.lesta.ru/documentation/guide/principles/

## Форма каталога: `wot/encyclopedia/boosters`

Метод публичный (токен не нужен). Описание: «Метод возвращает информацию о личных резервах.» Параметры запроса: `application_id`, `fields`, `language`. Фильтра по `booster_id` в параметрах нет — в отличие от `encyclopedia/vehicles`, где есть `tank_id`.

Поля ответа в схеме:

| Поле | Тип | Описание |
| --- | --- | --- |
| `booster_id` | numeric | Идентификатор личного резерва |
| `name` | string | Название личного резерва |
| `price_credit` | numeric | Стоимость в серебре |
| `price_gold` | numeric | Стоимость в золоте |
| `expires_at` | timestamp | Время окончания действия личного резерва в формате UTC |
| `lifetime` | numeric | Время действия личного резерва |
| `is_auto` | boolean | Флаг автоматической активации |
| `resource` | string | Ресурс: `credits`, `experience`, `crew_experience`, `free_experience` |
| `description` | string | Описание |
| `images.large` / `images.small` | string | URL изображений |

- https://developers.lesta.ru/reference/all/wot/encyclopedia/boosters/
- https://developers.lesta.ru/api/methods/wot_encyclopedia_boosters/

Схема **не** пишет, что `data` ключуется по `booster_id`. Общий формат ответа: `data` — `dict`, «формат зависит от запроса».

- https://developers.lesta.ru/documentation/guide/getting-started/

Английская схема уточняет единицу `lifetime`: «Booster lifetime in seconds».

- https://developers.lesta.ru/api/methods/wot_encyclopedia_boosters/?language=en

### Живой ответ 2026-08-30

`GET https://api.tanki.su/wot/encyclopedia/boosters/?language=ru` → `status: ok`, `meta.count: 82`. `data` — объект, не список. Все 82 ключа — десятичные строки; у каждой записи `str(booster_id) == ключ`. Дубликатов `booster_id` нет. Набор полей объекта совпадает со схемой: `booster_id`, `description`, `expires_at`, `images`, `is_auto`, `lifetime`, `name`, `price_credit`, `price_gold`, `resource`.

Примеры (не полный дамп):

| Ключ / `booster_id` | Название | `price_credit` | `price_gold` |
| --- | --- | --- | --- |
| 121003 | Дополнительное серебро за бой | 0 | 250 |
| 5033 | Дополнительный свободный опыт за бой | 0 | 10 |
| 9032 | Дополнительный свободный опыт за бой | 0 | 0 |

В снимке: `expires_at` у всех 82 — `null`; `is_auto` у всех — `false`; `lifetime` — 3600 / 7200 / 10800 / 14400 / 21600 (согласуется с «секунды» в английской схеме).

Значения `resource` в живом ответе шире enum схемы: кроме четырёх допустимых есть `free_xp_and_crew_xp` (2 записи) и `fl_experience` (1). На join по id это не влияет.

## Однозначен ли join владение ↔ каталог

**Каталог:** да, внутри себя. Ключ `data` = поле `booster_id`.

**Владение → каталог:** не доказано. Чтобы джойнить, нужна общая ось id. Схема владения её не называет. Возможные формы, которые схема **не** различает:

1. словарь «id → {count, expiration_time, state}» — тогда join = ключ владения к `booster_id` каталога;
2. список таких объектов без id — сопоставить нельзя;
3. один объект на всё поле — сопоставить нельзя.

Пункт 1 был бы join’ом. Lesta его не фиксирует. Переносить устройство API другого кластера нельзя: этот тикет закрывает только то, что явно сказано у Lesta плюс живой каталог.

## Есть ли ненулевая официальная цена

В снимке каталога 2026-08-30:

| Цена | Сколько из 82 |
| --- | --- |
| `price_gold` ≠ 0 | 43 |
| `price_credit` ≠ 0 | 0 |
| оба нули | 39 |
| оба ненулевые | 0 |

`price_credit` везде 0; ненулевая витрина — только золото, и не у всех id.

Какие id из каталога аккаунт может иметь, без живого `private.boosters` неизвестно. Даже при удачном join запись с нулевыми `price_credit` и `price_gold` не даёт официальной цены для Оценки.

Личные резервы с известным владением и ненулевой каталожной ценой относились бы к Прочему имуществу (не танк). Это следствие определения Имущества, не отдельное решение по `state`.

## Что схема говорит про `state` и срок

Только факты карточки, без решения «входит ли в Оценку».

`private.boosters.state` — строка, три значения:

- `ACTIVE` — «Активны»
- `INACTIVE` — «Неактивны»
- `USED` — «Использованы»

Других значений схема не перечисляет. Не сказано, остаётся ли `USED` в ответе, сколько таких записей и что значит «количество» (`count`) для каждого статуса.

Срок на владении: `expiration_time` (timestamp), «время окончания действия» — без единицы сверх типа и без правила «истёкшее = нет в ответе».

Срок в каталоге — другое поле: `expires_at` («время окончания действия личного резерва в формате UTC»). В снимке все `expires_at` = `null`. Рядом `lifetime` (длительность; английская схема — секунды). Связь `expiration_time` владения с `expires_at` / `lifetime` каталога схема не описывает.

- https://developers.lesta.ru/reference/all/wot/account/info/
- https://developers.lesta.ru/reference/all/wot/encyclopedia/boosters/

## Пробелы

1. Форма `private.boosters` (словарь / список / один объект) в схеме не типизирована; живого JSON нет.
2. Нет явной связи «запись владения ↔ `booster_id`».
3. Неизвестно, у каких id, которые аккаунт может иметь, ненулевая цена; в каталоге 39/82 без цены в серебре и в золоте.
4. Какие значения `state` считать Имуществом — отдельное решение, этот текст его не принимает.
5. Enum `resource` в схеме не покрывает все живые значения; на join по id не влияет.
