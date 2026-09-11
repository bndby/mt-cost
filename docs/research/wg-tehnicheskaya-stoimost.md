# Техническая стоимость имущества World of Tanks (WG)

Исследование 2026-09-09. Вопрос: какие **открытые первичные** ставки WG (золото или USD) соответствуют строкам внутренней таблицы Lesta ADR-0002 — чтобы Оценка WG-аккаунта не подставляла ADR-0002, когда у единицы есть владение, но в Public API нет каталожной цены.

Источники: портал worldoftanks.com / .eu, Центр поддержки Wargaming, Премиум магазин wargaming.net/shop/wot, справочник и живой WG Public API (`developers.wargaming.net`, `api.worldoftanks.eu`). Вики, Reddit, серый рынок и tanki.su как источник WG **не используются**. Числа Lesta из ADR-0002 сюда не копируются как ставка WG.

Живой каталог API снят 2026-09-09 на реалме EU, `game_version` энциклопедии **2.4**. Значение `application_id` в файл не выводится.

## Ответ

**У WG нет опубликованной таблицы «техническая стоимость единицы → золото» в духе ADR-0002.** Компенсации, бюджеты контейнеров и внутренний прайс Lesta на кластер Wargaming не переносятся.

Для Оценки WG:

1. Если энциклопедия отдаёт ненулевую `price_gold` / `price_credit` этой единицы — это каталог, не техническая ставка. Брать API.
2. Если цены в API нет — брать только WG-ставку из таблицы ниже (с URL и датой). Нет числа в первичных источниках WG — строки нет, ADR-0002 не подставлять.

Независимо от Lesta у WG найдены: постоянный перевод Combat XP → Free XP (**1 золото = 25 XP**, то есть **0,04 золота за 1 свободный опыт**); пакеты Танкового премиум аккаунта за золото **250 / 650 / 1250 / 1800 / 2500** за 1 / 3 / 7 / 14 / 30 дней; каталог личных резервов `encyclopedia/boosters.price_gold` (цены **по `booster_id`**, не одна ставка на тип); снаряжение в гайде и API — в **кредитах**, не в золоте; демонтаж стандартного оборудования — **10 золота** или набор; переподготовка без штрафа — **200 золота**; казарма — **16 коек за 300 золота**. Курса опыта экипажа, единых золотых цен камуфляжа/стилей, компенсации премов **по уровню** и обмена бон на золото в первичных источниках **нет**. Боны: см. `docs/research/wg-kurs-bon.md`, нового числа нет.

## Строки ADR-0002 → WG

Колонка «Lesta» — только якорь строки, не ставка WG.

| Единица (якорь ADR-0002) | WG | Статус |
| --- | --- | --- |
| 1 единица свободного опыта (Lesta 0,04) | Постоянный перевод: **25 Combat XP + 1 золото → 25 Free XP**. Это **1 золото = 25 свободного опыта** = **0,04 золота за 1 XP**. Акции меняют курс (например 1 = 25→35). Компенсации запаса `private.free_xp` отдельной таблицы нет: это цена **конвертации**, не выкупа пула. | Найдено (портал, 2026-09-09) |
| 1 единица опыта экипажа (Lesta 0,008) | Постоянного перевода Crew XP ↔ золото нет. Свободный опыт можно вкладывать в перки; Crew Books дают XP, не золото за единицу пула. | Не найдено |
| 1 / 3 / 7 / 14 / 30 дней ТПА (Lesta 250 / 650 / 1250 / 1800 / 2500) | Внутриигровые пакеты за золото (класс `currency__gold`): **1 д = 250, 3 д = 650, 7 д = 1250, 14 д = 1800, 30 д = 2500**; плюс 90 / 180 / 360 д = **6900 / 11900 / 20500**. Живой HTML гайда 2026-09-09 — **404**; снимок официальной страницы Wayback **2026-01-23**. Живые новости Holiday Ops 2026 подтверждают зачёркнутые (базовые) 6900 / 11900 / 20500. В Public API пакетов нет (`premium_expires_at` — срок, не цена). USD витрины Премиум магазина в HTML нет (SPA). | Найдено в золоте (гайд + живые новости); USD пакетов ТПА — не найдено |
| Личные резервы (Lesta 100–250 за конкретные +% × 1 ч) | Каталог: `wot/encyclopedia/boosters`, поля `price_gold`, `price_credit`. На EU 2026-09-09: **97** записей, `price_credit` везде 0, ненулевое `price_gold` у **58**. Одинаковое описание даёт **разное** золото у разных `booster_id` (например +100% XP на 1 ч — 100 / 110 / 150; +50% серебра на 1 ч — 75 / 100 / 150; +300% Free+Crew на 1 ч — 100 / 150; +100% серебра на 1 ч — 250). Плоской технической ставки «тип резерва → N золота» нет. Компенсационной таблицы резервов нет. Гайд: покупка в Store → Service за золото, чисел на странице нет. | API уже отдаёт каталожную цену по id |
| 1 снаряжение: малое (Lesta 7,5 золота) | Гайд Consumables: Small Repair Kit / Small First Aid Kit / Manual Fire Extinguisher — **3000 кредитов**. В `encyclopedia/provisions` у этих имён `price_gold = 0`, `price_credit` совпадает с гайдом (3000). | Каталог в кредитах (гайд + API); золотой техставки нет |
| 1 снаряжение: большое (Lesta 50 золота) | Large Repair Kit / Large First Aid Kit / Automatic Fire Extinguisher / Excellent Fuel / рационы — **20000 кредитов**. API: `price_gold = 0`. | Каталог в кредитах; золотой техставки нет |
| Масло / бензин / регулятор (Lesta 7,5) | Quality Fuel **5000** кредитов; Excellent Fuel **20000**. Отдельного «масла» за золото в гайде нет. API `price_gold = 0`. | Каталог в кредитах; золотой техставки нет |
| Камуфляж / краска / эмблема / надпись / декаль / эффект | Постоянная покупка «как правило за золото»; часть 2D-стилей — аренда за кредиты. Чисел за единицу на гайде Exterior нет. Методов энциклопедии стилей нет. | Не найдено (валюта да, ставка нет) |
| 2D-стиль универсальный / к технике / к нации (Lesta 1000 / 1500 / 1000) | Покупка за золото или аренда за кредиты; боновая витрина иногда даёт цену **в бонах** (это лот, не курс). Единой золотой ставки типа стиля нет. Акции называют цену конкретного лота (например 3D «Hot Rod» зачёркнутые 5000 золота). | Не найдено как ставка типа; лоты — акции / боны |
| 3D-стиль полноценный 9–10 / 6–8 / условный (Lesta 8000 / 4000 / 1500) | То же. Привязка к конкретной технике. Компенсации дубля 3D-стиля в Twitch Drops — **кредиты**, не золото по уровню. | Не найдено как ставка по уровню |
| Предбоевые инструкции (Lesta 25–200 золота) | Equipment directives — **за боны**; crew directives — **за кредиты**. Продажа директив запрещена. Чисел на гайде (вкладки) в снятом HTML нет. В API отдельного метода директив нет. | Не найдено в золоте |
| Учебные брошюры / руководства / пособия / универсальные / персональное 850k (Lesta 400–5000 золота) | Training Manual (250k XP экипажу): покупка за **2 000 000 кредитов**. Остальные типы — награды событий / ежедневных миссий, не витрина золота. Акция Winter Cache: Universal Manual зачёркнутые **5000** золота (−50% → 2500) — лот события, не каталог. | Manual: найдено в кредитах; золотой каталог остальных — не найден |
| 1 койка в казарме (Lesta 15,625) | Казарма расширяется **пакетом 16 коек за 300** (гайд Crew: «Enlarge the Barracks for gold» + «16 bunks for 300»). Поштучной цены койки нет. 300 / 16 считать техставкой нельзя: продаётся пакетом. | Найден пакет 16 = 300 золота; за 1 койку — не найдено |
| 1 демонтажный набор (Lesta 10) | Набор **заменяет** золото при демонтаже; получить — Daily Missions / события. «Purchased» в гайде Equipment есть, **цены набора в золоте нет**. Продажа наборов запрещена. Демонтаж стандартного/Bounty оборудования без набора: **10 золота** (Update 1.10); Improved — **200 бон**. | Цена *набора* в золоте не найдена; демонтаж без набора — 10 золота |
| 1 бланк переподготовки (Lesta 200) | Сам Retraining Order: гайд называет его способом сброса перков без потери XP, **цены покупки бланка нет**. Переподготовка члена экипажа **без штрафа: 200 золота** (новость 1.24.1 и гайд Crew: Tank Academy «for 200»). Сброс перков: новость 1.24.1 — «Resetting for 200»; актуальный гайд Crew Training пишет Tank Academy reset «costs 100,000» без валюты рядом с 20 000 кредитов — **однозначной золотой цены бланка нет**. | Бланк: не найден; операция переподготовки без штрафа: 200 золота |
| 1 облик (Lesta 100) | Crew skins / смена имени и картинки — **бесплатно**. Уникальных ивентовых экипажей это не касается. | Не найдено как платный лот (официально бесплатно) |
| 1 слот ангара (Lesta 250) | Гайд экономики: слоты покупаются **за кредиты**. Числа кредитов/золота за 1 слот на портале нет. Премиум магазин: **Parking Pass** once per account, **$7.49** за 10 слотов с пометкой 50% Off (постоянная скидка на этот лот). Это промо-пакет, не ставка слота. | 1 слот в золоте/кредитах — не найдено; промо USD за 10 слотов — найдено |
| Прем / наградной / акционный танк 2…11 ур. (Lesta 2500…50000 золота) | Каталог: `encyclopedia/vehicles.price_gold` **на танк**, не на уровень. EU 2026-09-09, 1028 машин, `price_gold > 0`: T2 750 (1 шт.); T3 850–1000; T4 1000; T5 1500–1750; T6 2800–3300; T7 4400–6900; T8 5700–9500. T9–T11 с `price_gold > 0` — **0 штук**. У премиум/подарочных без цены золота — сотни записей (T8: 177 с `price_gold = 0`). Это **не** таблица Lesta 2500…50000. | API уже отдаёт цену, если она есть; техставки по уровню нет |
| Компенсация према по уровню | Официальной таблицы «уровень → N золота» нет. VRT: выкуп **в кредитах** (цена продажи + 10%), по имени танка, не по уровню. Миссии с дублем према (с 2015): компенсация **кредитами**, не золотом. Золото — если купили/подарили уже имеющийся танк или выиграли на живом ивенте; сумма в статье 19061 не названа. Holiday Ops Large Boxes: компенсация **конкретного** танка в золоте (таблица имён, не уровней). | Не найдено |
| Боны → золото (Lesta 1:1,6) | Официального обмена нет. Нового первичного источника с числом **нет**. | См. `docs/research/wg-kurs-bon.md` |

## Свободный опыт

Живой гайд «Economy in World of Tanks» / «Resources and Currency» (2026-09-09):

> Conversion rate: **25 + 1 → 25**

Combat XP элитной техники конвертируется в Free XP за золото. Новость акции июля 2024 явно пишет default: **«25 XP to 25 Free XP for 1 gold»**. Обратного выкупа уже лежащего на счету Free XP нет. Акции временно улучшают курс; для Оценки пула — постоянный default, не акция.

- https://worldoftanks.com/en/news/general-news/currency-and-resources/
- https://worldoftanks.com/en/news/specials/xp-conversion-july-2024/

Страницы `/en/content/guide/wot_economy/conversion/` на 2026-09-09 отдают 404 (снимок Wayback 2026-04-17 существовал). Содержание перенесено на currency-and-resources.

`wot/account/info` отдаёт `private.free_xp` (баланс), не коэффициент. `encyclopedia/info` курса не содержит.

## Опыт экипажа

Гайды Crew / Economy описывают заработок Crew XP (бои, книги, резервы, ТПА, WoT Plus) и трату на перки. Перевода «1 Crew XP = N золота» нет. Ускорение перков Free XP — это трата уже оценённого свободного опыта, не ставка пула Crew XP.

## Танковый премиум аккаунт

Покупка за золото в клиенте (Store → WoT Premium Account / кнопка Upgrade). Public API пакетов не отдаёт.

Официальный гайд «Going Premium» на 2026-09-09: **404** на worldoftanks.com, .eu и .asia. Снимок той же официальной страницы Wayback **2026-01-23** (HTML с `span.currency.currency__gold`):

| Дни | Золото |
| --- | --- |
| 1 | 250 |
| 3 | 650 |
| 7 | 1 250 |
| 14 | 1 800 |
| 30 | 2 500 |
| 90 | 6 900 |
| 180 | 11 900 |
| 360 | 20 500 |

Пометка гайда: при остатке ТПА > 365 дней продление за золото недоступно; цены могут меняться на событиях.

Живые страницы 2026-09-09 с теми же базовыми 90/180/360:

- Holiday Ops Winter Cache: 20 500 → 16 400 (−20%); 11 900 → 10 115 (−15%); 6 900 → 6 210 (−10%).
  - https://worldoftanks.com/en/news/specials/holiday-ops-2026-mystery-shop/
- Постоянное снижение длинных пакетов (зачёркнутые 24 000 / 13 500 / 7 500 → 20 500 / 11 900 / 6 900).
  - https://worldoftanks.com/en/news/general-news/premium-account-price-drop/

Историческая новость 2012 подтверждает «обычно» 650 / 1250 за 3 / 7 дней — не снимок 2026, только согласованность пакетов.

- https://worldoftanks.eu/en/news/specials/last-days-world-war-ii/

Премиум магазин за реальные деньги: гайд ведёт на `wargaming.net/shop/wot/premium/`; HTML витрины без цен (SPA «Please wait…»). Поддержка 19333: в клиенте — золото, в магазине — USD/местная валюта, чисел пакетов в статье нет.

- https://wargaming.net/support/en/products/wot/article/19333/
- Wayback гайда: http://web.archive.org/web/20260123165347/https://worldoftanks.com/en/content/guide/wot_economy/going_premium/

## Личные резервы vs компенсация

Справочник: https://developers.wargaming.net/reference/all/wot/encyclopedia/boosters/

Живой `GET …/wot/encyclopedia/boosters/` (EU, 2026-09-09): `price_gold` / `price_credit` / `resource` / `lifetime` / `description`. Покупка за золото в Store подтверждена гайдом Personal Reserves (сумма списывается в золоте; чисел на странице нет).

- https://worldoftanks.com/en/content/guide/economy/personal-reserves/
- https://worldoftanks.com/en/content/guide/general/personal_reserves/

Сопоставление с якорями ADR-0002 **не** даёт одну ставку: несколько `booster_id` делят одно описание. Для Оценки — `price_gold` той записи, с которой сопоставлено владение, не колонка ADR-0002.

## Снаряжение и оборудование

Снаряжение (гайд Consumables, 2026-09-09): 3000 / 5000 / 20000 **кредитов**. Standard Large Repair Kit — Free.

- https://worldoftanks.com/en/content/guide/general/consumables/

`wot/encyclopedia/provisions/`: 179 записей. `type=equipment` — расходники/инструкции; ненулевой `price_gold` только у 11 штук с именами вроде Airstrike / Artillery Strike (не аптечка/ремкомплект). `type=optionalDevice` (оборудование): **все 89** с `price_gold = 0`; кредиты 50 000…600 000 типичны для классов. Владения складом API по-прежнему нет.

- https://developers.wargaming.net/reference/all/wot/encyclopedia/provisions/

## Внешний вид

- https://worldoftanks.com/en/content/guide/general/customization-guide/

Элементы покупаются за золото (аренда 2D — кредиты). Продажа купленного элемента возможна (цена продажи ниже покупки — общий принцип экономики). Поштучных 50 / 20 / 25 / 100 / 300 / 1000 золота на портале нет. Console/Modern Armor (другие цены камуфляжа) — не PC WG.

## Прочее

**Директивы.** https://worldoftanks.com/en/content/guide/general/directives/ — оборудование за боны, экипаж за кредиты; часть лотов только с событий.

**Книги экипажа.** https://worldoftanks.com/en/content/guide/general/crew_training/ — Training Manual 2 000 000 кредитов. https://worldoftanks.com/en/content/docs/release_notes/update-1-5-1-list-of-changes/ — те же 2 000 000 при вводе сущности.

**Казарма.** https://worldoftanks.com/en/content/guide/game-mechanics-and-achievements/vehicle-crew/ — 16 коек за 300, за золото.

**Демонтаж.** Update 1.10: стандартное оборудование — **10 Gold** или Demount Kit. https://worldoftanks.com/en/news/updates/update-1-10-equipment-2-0/  
Текущий гайд Equipment золото за набор не публикует; Improved — 200 бон (поддержка 15010).

**Переподготовка.** https://worldoftanks.com/en/news/general-news/crew-update-april-2024/ — 20 000 кредитов со штрафом или **200 gold** без штрафа.

**Облик.** Тот же гайд Crew: apply skin for free.

**Слот.** Экономика: слоты за кредиты. https://worldoftanks.com/en/content/guide/wot_economy/  
Parking Pass: https://worldoftanks.com/en/news/specials/pss-parking-pass/ — $7.49 / 10 слотов, 50% Off, once per account.

## Танки без `price_gold`

Живой каталог EU не совпадает с колонкой уровней ADR-0002 (другие числа, у T9+ каталожного золота нет). Оценка: ненулевая `price_gold` или `price_credit` этой `tank_id`. Если оба нули — техставки по уровню у WG нет.

VRT: https://wargaming.net/support/en/products/wot/article/23826/ — кредиты по имени.  
Дубли миссий: https://wargaming.net/support/en/products/wot/article/19061/ — кредиты, не золото по уровню.

## Боны

Нового первичного источника с коэффициентом боны→золото нет. Повторять исследование не нужно: `docs/research/wg-kurs-bon.md` (2026-09-07).

## Для Оценки

| Что | WG |
| --- | --- |
| Таблица «техстоимость» как ADR-0002 | Нет; не копировать Lesta |
| Свободный опыт без цены API | 0,04 золота / 1 XP только как default-конвертация Combat→Free; не компенсация пула |
| Crew XP | Нет ставки |
| Оставшиеся дни ТПА | Пакеты 30/14/7/3/1 день = 2500/1800/1250/650/250 золота (гайд Going Premium, снимок 2026-01-23; длинные пакеты подтверждены живыми новостями 2026) |
| Личные резервы | Только `encyclopedia/boosters.price_gold` по id |
| Снаряжение / стандартное оборудование | Каталог кредитов; не золотая техставка |
| Стили, камуфляж, инструкции, бланк, слот, койка поштучно | Нет WG-ставки для Оценки |
| Танк без `price_*` | Не оценивать по уровню ADR-0002 |
| Боны | Нет обмена; договорённость снимка — в `wg-kurs-bon.md`, не новое число |

## Источники

Портал (живые на 2026-09-09, если не сказано иное):

- https://worldoftanks.com/en/news/general-news/currency-and-resources/
- https://worldoftanks.com/en/news/specials/xp-conversion-july-2024/
- https://worldoftanks.com/en/content/guide/wot_economy/
- http://web.archive.org/web/20260123165347/https://worldoftanks.com/en/content/guide/wot_economy/going_premium/ (официальный гайд; live URL 404)
- https://worldoftanks.com/en/news/specials/holiday-ops-2026-mystery-shop/
- https://worldoftanks.com/en/news/general-news/premium-account-price-drop/
- https://worldoftanks.com/en/content/guide/general/consumables/
- https://worldoftanks.com/en/content/guide/general/equipment/
- https://worldoftanks.com/en/content/guide/general/directives/
- https://worldoftanks.com/en/content/guide/general/crew_training/
- https://worldoftanks.com/en/content/guide/game-mechanics-and-achievements/vehicle-crew/
- https://worldoftanks.com/en/content/guide/general/customization-guide/
- https://worldoftanks.com/en/content/guide/economy/in-game-store-and-depot/
- https://worldoftanks.com/en/content/guide/economy/personal-reserves/
- https://worldoftanks.com/en/news/updates/update-1-10-equipment-2-0/
- https://worldoftanks.com/en/news/general-news/crew-update-april-2024/
- https://worldoftanks.com/en/news/specials/pss-parking-pass/
- https://worldoftanks.com/en/content/docs/release_notes/update-1-5-1-list-of-changes/

Поддержка:

- https://wargaming.net/support/en/products/wot/article/19333/
- https://wargaming.net/support/en/products/wot/article/15010/
- https://wargaming.net/support/en/products/wot/article/19061/
- https://wargaming.net/support/en/products/wot/article/23826/
- https://wargaming.net/support/en/products/wot/article/10540/

API:

- https://developers.wargaming.net/reference/all/wot/encyclopedia/boosters/
- https://developers.wargaming.net/reference/all/wot/encyclopedia/provisions/
- https://developers.wargaming.net/reference/all/wot/encyclopedia/vehicles/
- https://developers.wargaming.net/reference/all/wot/account/info/
- Живые ответы `api.worldoftanks.eu` 2026-09-09: boosters (97), provisions (179), vehicles (1028, 11 страниц), encyclopedia/info (`game_version` 2.4)

Уже сделано, не дублировать:

- `docs/research/wg-kurs-bon.md`
- `docs/research/wg-api-parnost-polej.md`
- `docs/adr/0002-tehnicheskaya-stoimost-imushchestva-mt.md` (только Lesta)
- `docs/research/kurs-zolota.md` (Lesta; пакет золота WG в `.env` — заглушка)
