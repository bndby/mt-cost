# Курс бон в World of Tanks (WG)

Исследование 2026-09-07. Источники: официальный портал worldoftanks.com/eu/com/asia, Центр поддержки Wargaming (support.wargaming.net / eu.wargaming.net/support / na.wargaming.net/support), Премиум магазин (wargaming.net/shop/wot), справочник WG Public API (`developers.wargaming.net`). Форумы, калькуляторы и серый рынок не используются как источник истины.

## Ответ

**Официального обмена Бон на Серебро (Credits), Золото (Gold) или доллары у WG нет.** Портал прямо называет боны валютой, которую «нельзя купить за кредиты или золото», и не включает боны в раздел обмена валют. Числа, направления и витрины в том же стандарте, что курс золота (1 → 400 кредитов), для бон не существует. Публичный API отдаёт только баланс `private.bonds`, не коэффициент. Серый рынок не подставлять. Снимок Курса бон этой Оценки для WG — та же договорённость, что у Lesta: 1 бон = 1,6 золота (ADR-0001, ADR-0002).

## Есть ли официальный обмен бон на серебро, золото или доллары

Нет. Официальный гайд портала «Economy in World of Tanks» описывает ровно два постоянных перевода валюты и ресурсов:

| Что переводят | Курс | За что |
| --- | --- | --- |
| Gold в Credits | 1 → 400 | — |
| Combat XP элитной техники в Free XP | 25 + 1 → 25 | за Gold |

Бон в этой таблице нет. Обратных направлений (Credits → Gold, боны → что угодно) тоже нет.

- https://worldoftanks.com/en/news/general-news/currency-and-resources/
- https://worldoftanks.eu/en/content/guide/wot_economy/conversion/

Гайд называет четыре вида валюты и ресурсов (experience, credits, gold, bonds); раздел «Currency Exchange and Resource Conversion» относится только к Gold (перевод в Credits, конвертация Combat XP в Free XP через Gold). У бон отдельные разделы «How to Get Bonds» / «How to Use Bonds» — заработок в боях, миссиях, Battle Pass, Global Map, реферальной программе; трата — во вкладке «Items for Bonds» в Магазине (улучшенное оборудование, директивы, техника, стили). Раздела «обмен бон» не существует.

- https://worldoftanks.com/en/news/general-news/currency-and-resources/
- То же разделение в гайде для новичков: боны зарабатываются в боях/миссиях/реферальной программе, тратятся на имущество; конвертация относится к Gold, не к бонам.
  - https://worldoftanks.com/en/content/guide/newcomers-guide/game_economy/

Статья поддержки «How to get bonds and what can you purchase using them?» (идентична на всех трёх реалмах): «Bonds are a special in-game currency that cannot be purchased for credits or gold» — прямая формулировка отсутствия обмена в обе стороны. За боны покупают улучшенное оборудование, директивы и некоторые премиум-танки; обмена бон на кредиты, золото или доллары в статье нет.

- https://na.wargaming.net/support/en/products/wot/article/16135
- https://eu.wargaming.net/support/en/products/wot/article/16135/
- https://www.wargaming.net/support/en/products/wot/article/16135/

## Премиум магазин: пакетов бон за деньги нет

Живая витрина Премиум магазина WoT (wargaming.net/shop/wot, 2026-09-07): категории верхнего меню — Featured, Battle Pass, Gold, Premium & WoT Plus, Vehicles, Styles, OLS. Категории «Bonds» нет; покупки в магазине совершаются за реальные деньги, ассортимент — Gold, премиум-техника, Premium Account/WoT Plus, стили. Боны как товар (продажа бон за деньги) и как валюта оплаты в магазине не представлены.

- https://wargaming.net/shop/wot/main/

Статья поддержки «Premium Shop - what is it and how to buy»: покупки — реальные деньги, ассортимент — техника, аккаунт-время, игровая валюта (Gold); боны не названы ни товаром, ни средством оплаты.

- https://wargaming.net/support/en/products/wot/article/10540/

Статья поддержки «How do I purchase Gold?»: единственная покупаемая за деньги валюта — Gold, через магазин или вкладку «Gold» в Сторе Гаража. Боны в статье не упомянуты.

- https://wargaming.net/support/kb/articles/71

## Цены лотов в бонах — не курс

У имущества в разделе «Items for Bonds» бывает цена **в бонах** (как у техники бывает цена в Credits или Gold) — это каталожная цена лота, не коэффициент обмена валют.

Новости портала «Bond Shop Update» (сентябрь 2025, февраль 2025) называют конкретные лоты боновой витрины (например, Garage slot Crew для IX Tiger-Maus — 11 000 бон; 3D-стиль для X Type 5 Heavy — 3 000 бон). Такие числа нельзя переводить в Credits, Gold или доллары через «курс бон»: официального курса нет.

- https://worldoftanks.com/en/news/specials/bond-shop-update-september-2025/
- https://worldoftanks.asia/en/news/specials/bond-shop-update-february-2025/

## Отдаёт ли публичный API курс бон

Нет. Есть баланс, нет коэффициента — проверено прямым обращением к живому API и полем ответа справочника Developer Room (все три реалма отдают одинаковую схему полей; проверка сделана на реалме EU, `api.worldoftanks.eu`).

- `wot/account/info/` при `access_token`: поле `private.bonds` — «Bonds». Рядом `private.credits` — «Credits» и `private.gold` — «Gold». Курса нет.
  - https://developers.wargaming.net/reference/all/wot/account/info/
  - Живой запрос без `access_token` подтверждает форму ответа: `private` — объект, доступный только авторизованному владельцу токена (`{"private":null}` для чужого/анонимного запроса; проверено на `api.worldoftanks.eu` с зарегистрированным `application_id`).
- `wot/encyclopedia/vehicles/` — поля ответа включают «Cost in credits» и «Cost in gold» (цена техники), «Cost in credits» для модулей (Research cost). Поля цены в бонах нет.
  - https://developers.wargaming.net/reference/all/wot/encyclopedia/vehicles/
- `wot/encyclopedia/provisions/` (оборудование и расходники) — поля ответа включают «Cost in credits» и «Cost in gold». Поля цены в бонах нет.
  - https://developers.wargaming.net/reference/all/wot/encyclopedia/provisions/

Полный справочник методов World of Tanks (аккаунты, аутентификация, укрепрайоны, глобальная карта, танкопедия, рейтинги, кланы) — без магазина, без обмена валют, без курса бон:

- https://developers.wargaming.net/reference/all/wot/

Метод `wot/clans/info/` отдаёт `private.clan_treasury` — казну клана в Credits, Crystal (ресурс укрепрайонов) и Gold; поля бон в казне клана нет — тот же вывод, что и для аккаунта игрока.

- https://developers.wargaming.net/reference/all/wot/clans/info/

## Для Оценки

| Вопрос | Решение |
| --- | --- |
| Официальный курс бон (боны ↔ Credits / Gold / доллар) | Нет |
| Число для снимка в `.env` | 1.6 (`WG_GOLD_PER_BOND`): та же договорённость, что у Lesta (ADR-0001), не публичный обмен |
| Направление обмена | Нет постоянного перевода с участием бон (только Gold → Credits, 1 → 400) |
| Источник истины публичного обмена | Гайд «Economy in World of Tanks»: боны в разделе Currency Exchange and Resource Conversion отсутствуют |
| Источник снимка Оценки | Та же договорённость, что Курс бон Lesta: 1 бон = 1,6 золота (ADR-0001, ADR-0002) |
| Подтверждение отсутствия публичного обмена | Статья поддержки 16135 («cannot be purchased for credits or gold»); витрина Премиум магазина без категории Bonds; Public API без коэффициента (`private.bonds`, `private.credits`, `private.gold` — все балансы) |
| Цены лотов в бонах | Не курс; в цепочку Credits → Gold → доллар не входят |
| Серый рынок / форумный «курс бон» | Не использовать |
| Боны на счету WG-аккаунта в Оценке | Имущество: Курс бон 1 бон = 1,6 золота |
