# Какое ещё имущество имеет цену и владение

Дельта 2026-08-31 к `docs/research/lesta-api-imushchestvo.md` (2026-08-30) и [issue #2](https://github.com/bndby/mt-cost/issues/2). Источники: справочник и руководства Lesta Dev Room, портал и Центр поддержки Lesta. Вики, форумы и блоги не используются. Перечень методов и полей из того документа здесь не повторяется.

Вопрос: какое имущество **кроме** танков в Ангаре, серебра, золота и бон на счету одновременно (а) проверяется как владение при `access_token` и (б) имеет официальную цену в серебре, золоте или бонах.

## Ответ

**Ни одного вида Прочего имущества, которое Оценка уже могла бы взять как Имущество.**

Единственный кандидат с обоими условиями в Public API — **личные резервы**: владение через `wot/account/info` + `extra=private.boosters`, цена через `wot/encyclopedia/boosters` (`price_credit`, `price_gold`). Карточка владения по-прежнему не называет `booster_id` и не описывает join с каталогом. Без этого join резервы не являются Имуществом Оценки: количество есть, однозначной цены на единицу в спецификации API нет.

Справочник Мира танков с 2026-08-30 **не изменился** в части склада и витрин: новых extra-полей владения нет, методов склада оборудования, снаряжения, стилей, расходников и снарядов нет. То, что 30 августа было без владения, без владения и сейчас.

Текущая Оценка (`src/adapters/lesta-http.ts`, `src/packages/player-session/lib/valuation.ts`) запрашивает `extra=private.garage,private.rented` и считает танки по каталогу плюс серебро и золото на счету. Личные резервы не запрашиваются и не входят в сумму.

## Что сверилось сейчас (без пересказа среза 2026-08-30)

Оглавление справочника Мира танков на 2026-08-31: те же блоки Аккаунты / Аутентификация / Укрепрайоны / Глобальная карта / Танкопедия / Рейтинги / Техника игрока / Кланы. В Танкопедии по-прежнему нет склада, стилей, камуфляжей, надписей, снарядов как лотов.

- https://developers.lesta.ru/reference/

`account/info`: параметр `extra` для имущества — те же пять значений `private.*`: `boosters`, `garage`, `grouped_contacts`, `personal_missions`, `rented`. Новых extra нет.

- https://developers.lesta.ru/reference/all/wot/account/info/

`encyclopedia/info` по-прежнему без курсов валют и без витрины.

- https://developers.lesta.ru/reference/all/wot/encyclopedia/info/

## Единственный кандидат: личные резервы

**(а) Владение.** `extra=private.boosters`. Поля ответа: `count`, `expiration_time`, `state` (`ACTIVE` / `INACTIVE` / `USED`). Поля `booster_id` в карточке владения нет. Для сравнения: у `private.personal_missions` справочник явно пишет «Ключ — идентификатор задачи»; у резервов такой фразы нет.

- https://developers.lesta.ru/reference/all/wot/account/info/

**(б) Официальная цена.** `wot/encyclopedia/boosters` (без `access_token`): `booster_id`, `price_credit` («Стоимость в серебре»), `price_gold` («Стоимость в золоте»). Цены в бонах в карточке нет.

- https://developers.lesta.ru/reference/all/wot/encyclopedia/boosters/

Премиум магазин продаёт «бустеры» как наборы личных резервов **за реальные деньги**, не за серебро/золото/боны. Это не цена (б).

- https://lesta.ru/support/ru/products/mt/article/10540/

Во внутриигровом магазине личные резервы стоят в категории «Обслуживание» рядом с оборудованием и снаряжением. Чисел в серебре/золоте статья не публикует; для Оценки остаётся только Танкопедия `encyclopedia/boosters`.

- https://lesta.ru/support/ru/products/mt/article/15023/

**Почему это ещё не Имущество Оценки.** Нужны оба: запись владения *и* цена той же единицы. Справочник не связывает объект в `private.boosters` с `booster_id` каталога. Текущий клиент extra резервов не запрашивает.

## Что Оценка уже берёт — не «ещё имущество»

Аренда (`extra=private.rented`): `tank_id`, `expiration_time`, `compensation_credits`, `compensation_gold`. Это танк, не Прочее имущество. Клиент уже включает `tank_id` аренды в список танков и оценивает его каталогом `encyclopedia/vehicles`, не компенсацией. Компенсация — не витринная цена танка.

- https://developers.lesta.ru/reference/all/wot/account/info/
- https://developers.lesta.ru/reference/all/wot/encyclopedia/vehicles/

Дубль Ангара через `tanks/stats` (`in_garage`) и тот факт, что `account/tanks` Ангаром не является, к этому вопросу не добавляют нового вида имущества.

- https://developers.lesta.ru/reference/all/wot/tanks/stats/
- https://developers.lesta.ru/reference/all/wot/account/tanks/

## Что по-прежнему без владения

| Вид | Цена в справочнике / на портале | Владение при `access_token` |
| --- | --- | --- |
| Оборудование (`optionalDevice`) | `encyclopedia/provisions`: `price_credit`, `price_gold`; `access_token` нет | Нет метода |
| Снаряжение (`equipment`) | То же | Нет метода |
| Модули | `encyclopedia/modules`: только `price_credit`. Устаревший `encyclopedia/tankengines` ещё даёт `price_gold`. Дерево: `vehicles.modules_tree.price_credit` / `price_xp` | Нет метода купленных/исследованных модулей аккаунта |
| Комплектация техники | `encyclopedia/vehicleprofiles.price_credit` — цена комплектации, не владения | Нет установленной комплектации аккаунта |
| Стили, камуфляжи, надписи, внешний вид | В оглавлении `wot/` методов нет. Внутриигровой магазин выделяет категорию «Внешний вид» | Нет метода |
| Расходники и снаряды на складе | Цены снарядов в Танкопедии нет (`ammo` — урон/пробитие) | Нет метода |
| Товары за боны (усовершенствованное оборудование, особая техника, инструкции, внешний вид) | Категория внутриигрового магазина; в Public API витрины в бонах нет | Нет метода склада |

Источники таблицы:

- https://developers.lesta.ru/reference/all/wot/encyclopedia/provisions/
- https://developers.lesta.ru/reference/all/wot/encyclopedia/modules/
- https://developers.lesta.ru/reference/all/wot/encyclopedia/tankengines/
- https://developers.lesta.ru/reference/all/wot/encyclopedia/vehicles/
- https://developers.lesta.ru/reference/all/wot/encyclopedia/vehicleprofiles/
- https://developers.lesta.ru/reference/
- https://lesta.ru/support/ru/products/mt/article/15023/

Нашивки ранговых боёв (`encyclopedia/badges`), специальности и умения экипажа — каталог без цен и без владения.

- https://developers.lesta.ru/reference/all/wot/encyclopedia/badges/
- https://developers.lesta.ru/reference/all/wot/encyclopedia/crewroles/
- https://developers.lesta.ru/reference/all/wot/encyclopedia/crewskills/

## Владение есть, официальной цены в серебре / золоте / бонах нет

| Что отдаёт `account/info` при токене | Почему это не (б) |
| --- | --- |
| `private.free_xp` | Курса свободного опыта в серебро/золото/боны в API нет. Портал даёт только перевод **боевого** опыта элитной техники в свободный за золото (`25 + 1 → 25`), не цену запаса свободного опыта. |
| `private.is_premium`, `private.premium_expires_at` | Срок есть. Пакета в Public API нет. Премиум магазин продаёт Танковый премиум аккаунт за **реальные деньги**. За золото премиум аккаунт «можно купить» (статья поддержки про золото), но числа дней→золото ни справочник, ни эта статья не фиксируют. |
| `private.personal_missions` | Прогресс задач. `encyclopedia/personalmissions` описывает награды кампании (`rewards.credits` и т.д.), не цену владения. |
| `stronghold/clanreserves` (`access_token` обязателен): `in_stock.amount` | Имущество **клана**, не аккаунта. Полей цены нет. |

Источники:

- https://developers.lesta.ru/reference/all/wot/account/info/
- https://developers.lesta.ru/reference/all/wot/encyclopedia/personalmissions/
- https://developers.lesta.ru/reference/all/wot/stronghold/clanreserves/
- https://tanki.su/ru/content/guide/economy/conversion/
- https://lesta.ru/support/ru/products/mt/article/10540/

Персональные данные по-прежнему требуют `access_token` (срок до двух недель, HTTPS). Параметр `extra` по умолчанию исключён.

- https://developers.lesta.ru/documentation/guide/principles/
- https://developers.lesta.ru/documentation/guide/getting-started/

## Что из «есть владение и цена» Оценка ещё не берёт

Только личные резервы — и только если когда-нибудь появится задокументированный join `private.boosters` ↔ `booster_id`. На 2026-08-31 такого join в Dev Room нет, поэтому в Оценку их включать нельзя.
