# HUD-иконки валют и корзин техники (Lesta и WG)

Снимок: 2026-09-07. Источники: [Lesta Dev Room](https://developers.lesta.ru/documentation/rules/agreement/), [WG Dev Room](https://developers.wargaming.net/documentation/rules/agreement/), [EULA Lesta](https://legal.lesta.ru/eula/), [Правила для создателей контента «Мира танков»](https://legal.lesta.ru/contributors-content-guidelines/), [Player Content Policy WG](https://legal.wargaming.net/en/user-documents/content-policies/player-content-policy/view), справочник Public API, Центр поддержки Lesta, фронтенд [Премиум магазина Lesta](https://lesta.ru/shop/mt/gold/). Wiki, форумы и распаковки клиента не используются как источник истины.

## Ответ

**Public API не отдаёт HUD/GUI-спрайты** для строк Оценки (Боны, Золото, Серебро, Премиумный танк, Прокачиваемый танк). Поля `images` энциклопедии (`big_icon`, `small_icon`, `contour_icon`) — это техника, не валюты и не маркеры корзин.

**Иконки ангарного HUD** живут в **клиентской части игры** (графика пользовательского интерфейса — объекты ИС по EULA, п. 10.1). Официальная поддержка называет только уровень пакетов: ошибка вида `Game resource path does not exist: /res/packages/misc.pkg` ([модификации, статья 15252](https://lesta.ru/support/ru/products/mt/article/15252/)). **Публичных стабильных URL на отдельные HUD-спрайты нет**; имена файлов в Dev Room не документированы.

**Ближайший официальный веб-источник тех же смыслов** — фронтенд **Премиум магазина** (не 1:1 с ангарным HUD, но те же валюты/маркеры цены на витрине Lesta). Для Lesta на снимке проверены URL на `shop-front-ru-cdn.lesta.ru`. Для WG-аккаунта ожидается тот же стек витрины (`shop-front-{realm}-cdn.wargaming.net`, те же CSS-классы), но **живые URL WG в этом снимке не скачаны** (anti-bot / недоступность CDN из среды исследования).

**Лицензия для стороннего Android-приложения MT Cost (не аффилировано):** **нельзя** ни бандлить, ни хотлинковать эти спрайты как элементы интерфейса. Dev Room API Policy (Lesta п. 6, WG п. 6) запрещает иконки, схожие с интерфейсом игры. EULA Lesta (п. 4.2.1, 4.2.5) запрещает распространение графики игры; Player Content Policy WG (п. 2.6) — встраивание Wargaming IP в сторонние продукты. Использовать **собственные нейтральные иконки**; данные — только через Public API.

## Таблица: десять спрайтов (5×2)

Обозначения корзин — из `CONTEXT.md`. «HUD» = ангарный клиент; «витрина» = Премиум магазин.

| # | Строка Оценки | Lesta (Мир танков) | WG (World of Tanks) |
| --- | --- | --- | --- |
| 1 | **Боны** | **HUD:** публичного URL нет; ресурсы в пакетах клиента (`/res/packages/…`, см. статью 15252). **Витрина:** CSS-класс `.razlom-coin:before`, inline SVG 14×13, цвет `#b08d45` — в бандле `main-xqq6v4S_.css` ([золото](https://lesta.ru/shop/mt/gold/), CDN `shop-front-ru-cdn.lesta.ru`). Отдельного файла на CDN нет. | **HUD:** то же (пакеты клиента WG). **Витрина:** тот же класс `.razlom-coin` на общей платформе магазина; URL не проверен в снимке → ожидаемо `https://shop-front-{eu\|na\|asia}-cdn.wargaming.net/assets/main-*.css` + inline SVG. |
| 2 | **Золото** | **HUD:** публичного URL нет. **Витрина:** `https://shop-front-ru-cdn.lesta.ru/assets/bumblebee-coin-woSv5834.svg` — SVG 14×13, `#ffb81c`; класс `.bumblebee-coin:before`. | **HUD:** публичного URL нет. **Витрина:** тот же asset-name `bumblebee-coin-*.svg` на `shop-front-*-cdn.wargaming.net` (не скачан в снимке). |
| 3 | **Серебро** | **HUD:** публичного URL нет. **Витрина:** класс `.silver-mt:before` (и `.silver-mk` для других тайтлов), inline SVG 14×13, `#ccc` / `#E5E5E5` — в `main-xqq6v4S_.css`. | **HUD:** публичного URL нет. **Витрина:** класс `.silver-mt:before`, inline SVG (не скачан в снимке). |
| 4 | **Премиумный танк** | **HUD:** публичного URL нет. **Витрина:** класс `.prem-mt:before` / `.premium-type__mt:before` — inline SVG ~16×14, золотые «крылья»; альтернатива `.premium-type__base` → `https://shop-front-ru-cdn.lesta.ru/assets/prem-xUxA944R.svg` (18×16). | **HUD:** публичного URL нет. **Витрина:** те же классы; `prem-*.svg` на WG CDN (не проверено в снимке). |
| 5 | **Прокачиваемый танк** | **HUD:** публичного URL нет. **Витрина:** для техники за серебро — `.silver-mt:before` (серый силуэт танка, 14×13, тот же inline SVG, что у серебра на карточках MT). Отдельного «researchable-only» файла на CDN нет. | **HUD:** публичного URL нет. **Витрина:** `.silver-mt:before` (не проверено в снимке). |

Хеши в именах файлов (`woSv5834`, `xqq6v4S_`) — артефакты сборки фронтенда; **не контракт API**.

## Public API — что есть и чего нет

Справочник `wot/encyclopedia/vehicles` отдаёт цены (`price_credit`, `price_gold`) и изображения техники, не иконки валют/HUD ([Lesta Dev Room](https://developers.lesta.ru/reference/all/wot/encyclopedia/vehicles/), [WG Dev Room](https://developers.wargaming.net/reference/all/wot/encyclopedia/vehicles/)). Балансы: `wot/account/info` → `private.bonds`, `private.gold`, `private.credits` ([`lesta-api-imushchestvo.md`](lesta-api-imushchestvo.md)). **Поля с URL HUD-иконок нет.**

## Как получены URL витрины Lesta

1. Страница `https://lesta.ru/shop/mt/gold/` подключает `https://shop-front-ru-cdn.lesta.ru/assets/main-xqq6v4S_.css` (имя меняется с релизом).
2. В CSS: `url(/assets/bumblebee-coin-woSv5834.svg)`, `url(/assets/prem-xUxA944R.svg)` и data-URI для `.razlom-coin`, `.silver-mt`, `.prem-mt`.
3. Абсолютные URL: префикс `https://shop-front-ru-cdn.lesta.ru` + путь из CSS.

Скриншоты в поддержке ([боны](https://lesta.ru/support/ru/products/mt/article/16135/)) — растровые иллюстрации статей на `cdn-kbms.lesta.ru`, **не** спрайты для UI приложения.

## Лицензия: bundle / hotlink / запрет

| Источник | Bundle в APK | Hotlink на CDN Lesta/WG | Вывод для MT Cost |
| --- | --- | --- | --- |
| Dev Room API Policy | — | — | п. 6 (Lesta и WG): **запрещены** иконки, схожие с интерфейсом игры/сервисов |
| EULA Lesta, п. 4.2.1, 4.2.5 | **Запрещено** без письменного согласия | Нет лицензии на графику игры | ИС остаётся у Lesta |
| Правила создателей контента MT (Lesta) | Только стрим/видео с монетизацией платформы; **не** встраивание в чужое приложение | «Не вносить изменения в ИС, предоставленную Lesta» | Не замена UI-библиотеки |
| Player Content Policy WG, п. 2.6 | **Запрещено** использовать Wargaming IP в сторонних продуктах | То же | Нейтральный UI |
| Dev Room, §12 (товарные знаки) | Без письменного разрешения | — | Логотипы/фирстиль отдельно |

**Итог:** для неаффилированного MT Cost — **запрещено** (и bundle, и hotlink официальных HUD/витринных спрайтов). Допустимы: текст/числа из API, собственные иконки без сходства с игровым UI, дисклеймер об неофициальности (Dev Room п. 9).

## Ограничения снимка

- Не проверялся установленный клиент; **точные пути файлов внутри `gui.pkg` / атласов HUD в официальных доках не найдены**.
- CDN Премиум магазина WG не скачан; таблица WG для витрины — по общей платформе магазина, без подтверждения байтов в снимке.
- Бинарные превью в репозиторий **не копировались** (лицензия выше).

## Ссылки

- Lesta API Policy: https://developers.lesta.ru/documentation/rules/agreement/ (раздел «ПОЛИТИКА ЛЕСТА ИГРЫ В ОТНОШЕНИИ API», п. 6)
- WG API Policy: https://developers.wargaming.net/documentation/rules/agreement/ (WARGAMING API POLICY, п. 6)
- EULA Lesta: https://legal.lesta.ru/eula/ (п. 4.2, 10.1)
- Правила создателей контента MT: https://legal.lesta.ru/contributors-content-guidelines/
- Player Content Policy WG: https://legal.wargaming.net/en/user-documents/content-policies/player-content-policy/view
- Модификации / `res/packages`: https://lesta.ru/support/ru/products/mt/article/15252/
- Премиум магазин MT (золото): https://lesta.ru/shop/mt/gold/
- CDN (Lesta, снимок): https://shop-front-ru-cdn.lesta.ru/assets/bumblebee-coin-woSv5834.svg , https://shop-front-ru-cdn.lesta.ru/assets/prem-xUxA944R.svg
