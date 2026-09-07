# Логотипы Lesta и Wargaming на кнопке «Войти через X» стороннего приложения

Снимок: 2026-09-07. Источники: [Lesta Dev Room — Условия использования API](https://developers.lesta.ru/documentation/rules/agreement/), [WG Dev Room — API Terms of Use](https://developers.wargaming.net/documentation/rules/agreement/), [EULA Lesta](https://legal.lesta.ru/eula/), [Правила для создателей контента «Мира танков» (Lesta)](https://legal.lesta.ru/contributors-content-guidelines/), [WG EULA](https://legal.wargaming.net/en/user-documents/eula/end-user-license-agreement), [WG Player Content Policy](https://legal.wargaming.net/en/user-documents/content-policies/player-content-policy/view), [Lesta Dev Room — Руководство: Использование API](https://developers.lesta.ru/documentation/guide/principles/), [WG Dev Room — Getting Started](https://developers.wargaming.net/documentation/guide/getting-started/?language=en), [World of Tanks Fansite Kit](https://worldoftanks.asia/en/content/docs/1221/world-tanks-fansite-kit/), [Центр поддержки Lesta — Леста OpenID](https://lesta.ru/support/ru/products/mt/article/10549/). Wiki, форумы и распаковки клиента не используются как источник истины.

## Ответ

**И у Lesta, и у Wargaming показ логотипа компании на кнопке входа стороннего (неаффилированного) приложения требует отдельного письменного разрешения — ни у одной из двух компаний нет публичного, самообслуживаемого «Sign in with X»-кита (аналога Google/Apple/Facebook button kit), которым мог бы воспользоваться MT Cost без контакта с правообладателем.**

- **Lesta.** Dev Room ToU п. 12 «НАШИ ТОВАРНЫЕ ЗНАКИ И БРЕНДЫ»: «Ничто на Платформе или в API не может толковаться как выдача лицензии или предоставление права использования API **без Нашего письменного разрешения**» ([developers.lesta.ru](https://developers.lesta.ru/documentation/rules/agreement/), п. 12). Правила для создателей контента «Мира танков» (Lesta) — единственный публичный документ, где Lesta говорит про «стандарты бренда» — прямо не применяются к MT Cost: в FAQ этого документа сказано «Правила применяются исключительно к частным лицам-создателям контента» ([legal.lesta.ru/contributors-content-guidelines/](https://legal.lesta.ru/contributors-content-guidelines/)), а MT Cost — стороннее коммерческое/API-приложение, не «частное лицо-создатель контента». Значит, для MT Cost действует именно Dev Room ToU п. 12 → **нужно разрешение**, готового ассета нет.
- **Wargaming.** Тот же п. 12 «OUR TRADE MARKS AND BRANDING» в WG Dev Room ToU: «Nothing... should be construed as granting any licence or right to use any Trade Marks... **without Our written permission**... Any such use (if agreed) must be strictly in compliance with Our instructions» ([developers.wargaming.net](https://developers.wargaming.net/documentation/rules/agreement/), §12). Дополнительно подтверждается Player Content Policy: п. 2.1 запрещает коммерческое использование Wargaming IP «unless explicitly permitted», п. 2.6 — «The Player Content or any other Wargaming IP should not be used or integrated within third-party games, **products**, or merchandise», п. 2.10 (a–d) — товарные знаки можно использовать только «in connection with Wargaming and Wargaming IP» и без изменений ([legal.wargaming.net](https://legal.wargaming.net/en/user-documents/content-policies/player-content-policy/view)). Единственный найденный публичный набор ассетов — **World of Tanks Fansite Kit** — предназначен для **фан-сайтов** (некоммерческий информационный контент), не для сторонних приложений с интеграцией логина, и не содержит бейджа «Sign in with WG» ([worldoftanks.asia](https://worldoftanks.asia/en/content/docs/1221/world-tanks-fansite-kit/)). Итог: **нужно разрешение**, готового «Sign in with WG» кита нет.
- **Проверка Dev Room / OpenID-доков на требования к оформлению кнопки логина** (обе компании): руководства [Lesta «Использование API»](https://developers.lesta.ru/documentation/guide/principles/) и [WG «Getting Started»](https://developers.wargaming.net/documentation/guide/getting-started/?language=en) / [«Using API»](https://developers.wargaming.net/documentation/guide/principles/) описывают только техническую сторону OpenID-логина (application_id, access_token, callback, обязательная функция «Выйти») — **ни слова о визуальном оформлении кнопки, логотипе или минимальных размерах/отступах**. Центр поддержки Lesta ([статья 10549](https://lesta.ru/support/ru/products/mt/article/10549/)) описывает флоу входа через Lesta OpenID только с точки зрения игрока, тоже без упоминания брендинга кнопки на стороне партнёра.
- **Не путать паттерн с Google/Apple/Facebook**: те компании публикуют официальные button-kit'ы с конкретными правилами (минимальный размер, цвет, отступы) именно потому, что явно разрешают такое использование. У Lesta и Wargaming такого документа **не найдено** ни в Dev Room, ни на legal-порталах, ни в открытом поиске — значит предполагать «то же самое, что у Google» нельзя.

### Таблица

| | Официальный ассет для кнопки входа? | Нужно разрешение? | Вывод для MT Cost |
| --- | --- | --- | --- |
| **Lesta** («Мир танков») | Нет. Dev Room/OpenID-доки не описывают визуал кнопки; Fansite-кит у Lesta не найден. | **Да** — Dev Room ToU п. 12: письменное разрешение на любой Товарный знак. | Логотип Lesta на кнопке — **нельзя** без отдельного письменного согласия. Использовать текстовую подпись без логотипа (см. «Рекомендация» ниже). |
| **Wargaming** (World of Tanks / WG) | Нет для логина. Fansite Kit есть, но это фан-сайты, не сторонние приложения с аккаунт-интеграцией; бейджа «Sign in with WG» в нём нет. | **Да** — Dev Room ToU §12 + Player Content Policy §2.1/§2.6/§2.10. | Логотип WG на кнопке — **нельзя** без отдельного письменного согласия. Тот же текстовый подход. |

## Lesta и Wargaming — одна политика или две разные?

Это два разных юридических лица с двумя разными (хоть и текстуально похожими) пакетами правил, а не единая политика с общим происхождением, автоматически покрывающая обе торговые марки:

- Lesta Dev Room ToU называет лицензиаром **ООО «Леста Геймс Эдженси»** (ОГРН 1217700553080) — российское юрлицо ([developers.lesta.ru](https://developers.lesta.ru/documentation/rules/agreement/), преамбула).
- WG Dev Room ToU называет лицензиаром **Wargaming Group Limited** — кипрская юрисдикция, споры — «courts of Cyprus» ([developers.wargaming.net](https://developers.wargaming.net/documentation/rules/agreement/), §18 Governing Law).
- Разделение возникло в 2022 г., когда Wargaming.net ушла из России, и «Мир танков»/«Мир кораблей»/Tanks Blitz на территории РФ и Беларуси стала оперировать Lesta Games (в 2024 г. переименована в «Леста Игры» с русскоязычным логотипом) — не источник истины, но подтверждает контекст разделения (см. новость о ребрендинге, не первичный источник; здесь используется только как контекст, не как основание вывода).
- Практическое следствие: **находка по одной компании не переносится автоматически на другую** — но в данном случае обе политики содержат структурно идентичный п. 12 «Товарные знаки», требующий письменного разрешения, так что вывод («нужно разрешение, готового кита нет») совпадает для обеих *по независимым, хоть и параллельным по формулировке, документам*.

## Первичные источники по пунктам

### Lesta Dev Room — Условия использования API, п. 12
> Все товарные знаки, логотипы и знаки обслуживания («Товарные знаки»), отображаемые на Платформе и в API, являются Нашими зарегистрированными и незарегистрированными Товарными знаками или используются нами по лицензии. [...] Ничто на Платформе или в API не может толковаться как выдача лицензии или предоставление права использования API без Нашего письменного разрешения или письменного разрешения владельца соответствующего Товарного знака. Использование любого Товарного знака, отображаемого на Платформе, или любого контента Платформы в нарушение настоящих Условий строго запрещено.

Источник: [developers.lesta.ru/documentation/rules/agreement/](https://developers.lesta.ru/documentation/rules/agreement/), раздел «ПОЛИТИКА ЛЕСТА ИГРЫ В ОТНОШЕНИИ API» находится ниже по той же странице (п. 6 API policy, уже процитирован в research #63, запрещает похожие на интерфейс Lesta иконки/кнопки — применимо и к визуалу кнопки логина, если она стилизуется под Lesta UI).

### WG Dev Room — API Terms of Use, §12
> All trade marks, logos and service marks (the Trade Marks) which appear on the Platform or API are Our registered and unregistered Trade Marks or are licensed for use by Us by the owners of those Trade Marks. [...] Nothing contained on the Platform or API should be construed as granting any licence or right to use any Trade Marks displayed on the Platform or API without Our written permission or such other Trademark owner. **Any such use (if agreed) must be strictly in compliance with Our instructions.** Misuse of any Trade Mark displayed on the Platform, or any other content on the Platform, except as provided herein, is strictly prohibited.

Источник: [developers.wargaming.net/documentation/rules/agreement/](https://developers.wargaming.net/documentation/rules/agreement/), §12. Обратите внимание на фразу «if agreed... strictly in compliance with Our instructions» — это описание точечного, индивидуального согласования, а не публичного self-serve кита.

### Lesta EULA, п. 10.4 «Товарные знаки»
> Товарные знаки Леста Игры зарегистрированы и охраняются в различных юрисдикциях мира. Товарные знаки третьих лиц, упомянутые в Игре, принадлежат их законным правообладателям.

Источник: [legal.lesta.ru/eula/](https://legal.lesta.ru/eula/), п. 10.4 (в объединённом EULA, вкладка «Мир кораблей»; товарный знак Lesta как таковой защищён этим пунктом независимо от игры). Пункт декларативный (право собственности), не даёт и не описывает лицензию на использование — сам факт использования регулируется п. 4.2.1/4.2.5 (распространение материалов игры без письменного согласия запрещено, процитировано в research #63) и Dev Room п. 12 выше.

### WG EULA, §5.5/§5.7 (нумерация раздела «Trademarks», региональные версии совпадают по смыслу)
> "World of Tanks", ... "Wargaming.net", "Wargaming" and their respective logos are trademarks or registered trademarks of Wargaming. **You may not use or display these and other trademarks of Wargaming in any manner, except as expressly set out in this EULA.**

Источник: [legal.wargaming.net/en/user-documents/eula/end-user-license-agreement](https://legal.wargaming.net/en/user-documents/eula/end-user-license-agreement), §5.5–5.7 (зеркало с идентичным текстом также на [vilnius.wargaming.com/eula/](https://vilnius.wargaming.com/eula/), §5.7–5.8, там же ссылка на «Player Content Guidelines» — раздел 7 «Wargaming Guidelines»).

### WG Player Content Policy, §2.1, §2.6, §2.10
> 2.1. Neither Wargaming IP nor Player Content may be used for commercial purposes, unless explicitly permitted below. [...]
> 2.6. The Player Content or any other Wargaming IP should not be used or integrated within third-party games, products, or merchandise. [...]
> 2.10. If you make use of our trademarks as part of the Player Content, you must: a) Use such marks only in connection with Wargaming and Wargaming IP; b) Not cause any damage to the reputation and goodwill associated with Wargaming's trademarks; c) Not register any domain that is identical or similar to our trademarks...; and d) Not modify any of our trademarks.

Источник: [legal.wargaming.net/en/user-documents/content-policies/player-content-policy/view](https://legal.wargaming.net/en/user-documents/content-policies/player-content-policy/view). Формально этот документ регулирует Player Content (фан-арт, стримы, моды) физлиц-игроков, а не Applications сторонних разработчиков (это зона Dev Room ToU) — но §2.1/§2.6 прямо называют запрещённым именно случай MT Cost: встраивание Wargaming IP («logos... and any other intellectual property») в сторонний коммерческий продукт.

### Lesta — Правила для создателей контента «Мира танков» (не применимо к MT Cost, но проверено)
> Правила применяются исключительно к частным лицам-создателям контента.
> ...при разработке контента, связанного с Леста Игры или «Мира танков», руководствуйтесь всеми предоставленными компанией материалами по стандартам бренда...

Источник: [legal.lesta.ru/contributors-content-guidelines/](https://legal.lesta.ru/contributors-content-guidelines/), FAQ + основной текст. Документ подтверждает существование неких «материалов по стандартам бренда», но **выдаёт их избирательно контент-мейкерам** («предоставленным компанией»), это не открытый публичный кит, и сам документ явно не для коммерческих сторонних приложений типа MT Cost.

### World of Tanks Fansite Kit (WG) — единственный найденный публичный ассет-кит с логотипами
> A fansite kit is a set of various materials, including logos, images, screenshots, icons, wallpapers, etc. to help site owners establish a substantial fan source. [...] For information about the appropriate and approved use of any World of Tanks assets, please read World of Tanks Privacy Policy, Terms of Service and Fansite Requirements.

Источник: [worldoftanks.asia/en/content/docs/1221/world-tanks-fansite-kit/](https://worldoftanks.asia/en/content/docs/1221/world-tanks-fansite-kit/). Это архив логотипов/арта/скриншотов для **фан-сайтов** — некоммерческий информационный контекст, не аккаунт-интегрированное приложение с кнопкой логина; ни слова о «Sign in with WG», ни о минимальных размерах кнопки. Равноценного публичного кита у Lesta не найдено (поиск дал только сторонние, неофициальные сайты со скачиванием логотипа, что не является позицией правообладателя).

### OpenID / Dev Room guide — проверка на требования к брендингу кнопки логина
Оба руководства ([Lesta «Использование API»](https://developers.lesta.ru/documentation/guide/principles/), [WG «Getting Started»](https://developers.wargaming.net/documentation/guide/getting-started/?language=en) и [WG «Using API»](https://developers.wargaming.net/documentation/guide/principles/)) описывают: регистрацию приложения и `application_id`, типы приложений (серверные/автономные), получение и продление `access_token` через Lesta/WG OpenID, обязательность функции «Выйти». **Ни один из этих документов не упоминает визуальное оформление кнопки логина, логотип, цвет или минимальный размер** — в отличие от, например, официальных Google/Apple Sign-In гайдов, где это отдельный раздел. Технический пример стороннего OpenID-клиента для WG (не первичный источник, просто иллюстрация флоу) — [github.com/mac-developer/openid-wargaming](https://github.com/mac-developer/openid-wargaming) — тоже не содержит официальных брендинг-ассетов, только код редиректа на `https://{realm}.wargaming.net/id/openid/`.

## Рекомендация для MT Cost

Раз готового «Sign in with Lesta/WG» кита нет, а логотип на кнопке требует письменного разрешения (Dev Room п. 12 обеих компаний) — до получения такого разрешения безопасный вариант для MT Cost: кнопка с **текстовой** подписью («Войти через Lesta ID» / «Войти через WG ID») без графического логотипа компании, оформленная нейтральной иконкой приложения (см. также вывод research #63 про запрет на элементы, похожие на игровой UI — Dev Room п. 6 обеих компаний). Использование текстового упоминания названия сервиса как такового Dev Room не запрещает (наоборот, п. 9/п. 8 API policy обеих компаний требуют явно указывать источник данных и copyright-уведомление) — запрещён именно **графический Товарный знак** (логотип) без письменного согласия.

## Ограничения снимка

- **legal.wargaming.net** отдаёт главную страницу как маркетинговый шелл без прямого списка документов (в отличие от `legal.lesta.ru`, где список документов виден сразу) — конкретные документы (EULA, Player Content Policy) найдены через веб-поиск и известные прямые URL, а не через навигацию по индексу; возможно, там существуют и другие релевантные документы (например, отдельная trademark-политика), которые не всплыли в поиске.
- Отдельного документа с названием «бренд-гайд» / «trademark guidelines» / «press kit», размещённого именно на `legal.lesta.ru` или `legal.wargaming.net`, **не найдено** ни для Lesta, ни для Wargaming — только упоминания «стандартов бренда» внутри Content Guidelines (выдаются избирательно, не публичный документ).
- Страница World of Tanks Fansite Kit отрендерилась с баннером «Failed to log in» (артефакт региональной версии `worldoftanks.asia`) — основной текст кита прочитан полностью, но не проверялось, доступен ли сам .zip-архив по подписке/логину или без него; для вывода это не важно (кит и так не про кнопку логина).
- Не найдено ни одного примера стороннего (не аффилированного) коммерческого приложения, которое использует официальный логотип Lesta/WG на кнопке входа — что косвенно подтверждает вывод («нужно разрешение»), но это отсутствие доказательства, не прямая цитата политики.
- Формулировка WG Dev Room ToU §12 «Any such use (if agreed) must be strictly in compliance with Our instructions» подразумевает существование неких «instructions» (инструкций по использованию Товарного знака), которые выдаются **после** согласования — их публичного текста в этом снимке не найдено (по определению: они не публичны до согласования).

## Ссылки

- Lesta Dev Room — Условия использования API + Политика API: https://developers.lesta.ru/documentation/rules/agreement/ (п. 6 и п. 12)
- WG Dev Room — API Terms of Use + API Policy: https://developers.wargaming.net/documentation/rules/agreement/ (§6 и §12)
- Lesta Dev Room — Руководство «Использование API»: https://developers.lesta.ru/documentation/guide/principles/
- WG Dev Room — Getting Started: https://developers.wargaming.net/documentation/guide/getting-started/?language=en
- WG Dev Room — Using API (guide/principles): https://developers.wargaming.net/documentation/guide/principles/
- EULA Lesta: https://legal.lesta.ru/eula/ (п. 4.2.1, 4.2.5, 10.4)
- EULA Wargaming: https://legal.wargaming.net/en/user-documents/eula/end-user-license-agreement (§5.5–5.7); зеркало: https://vilnius.wargaming.com/eula/ (§5.7–5.8, §7)
- Правила для создателей контента «Мира танков» (Lesta): https://legal.lesta.ru/contributors-content-guidelines/
- WG Player Content Policy: https://legal.wargaming.net/en/user-documents/content-policies/player-content-policy/view (§2.1, §2.6, §2.10)
- World of Tanks Fansite Kit: https://worldoftanks.asia/en/content/docs/1221/world-tanks-fansite-kit/
- Центр поддержки Lesta — Леста OpenID: https://lesta.ru/support/ru/products/mt/article/10549/
- legal.lesta.ru (индекс документов): https://legal.lesta.ru/
- legal.wargaming.net (главная): https://legal.wargaming.net/
- Иллюстративный (не первичный) пример WG OpenID клиента: https://github.com/mac-developer/openid-wargaming
- Соседнее research (HUD-иконки, тот же формат; `docs/research/hud-ikonki-valyut-i-korzin-tankov.md` на ветке `research/hud-ikonki-valyut-i-tankov`, пока не влито в `master`): https://github.com/bndby/mt-cost/issues/63
