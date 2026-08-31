# Откуда взять клан-тег аккаунта

Исследование 2026-08-31. Источники: справочник и руководства [Lesta Dev Room](https://developers.lesta.ru/reference/), живой ответ кластера `api.tanki.su` (`X-Api-Version: 2.77.1`). Клиент игры не использовался. OpenID callback заново не разбирался: опора — карточка [`wot/auth/login`](https://developers.lesta.ru/reference/all/wot/auth/login/) и `docs/research/lesta-openid-expo-android.md`.

Термины — как в `CONTEXT.md`: **Игрок**, **Аккаунт**, **Lesta OpenID**. Пути методов в справочнике лежат в блоке `wot/` (Мир танков).

## Ответ

Клан-тег вошедшего аккаунта отдаёт **`wot/clans/accountinfo`**: поле **`clan.tag`**. Входной ключ — **`account_id`** из Lesta OpenID. Это **один** дополнительный запрос после входа. `clan_id` заранее знать не нужно. `access_token` для этого метода в справочнике не требуется.

Если аккаунт сейчас не в клане, живой ответ — `status: "ok"` и **`data[<account_id>] = null`**. Объекта с пустым `tag` нет.

`wot/account/info` отдаёт только **`clan_id`** (число или `null`), без тега. Чтобы взять тег с этого пути, нужен **второй** запрос — `wot/clans/info` по `clan_id`.

## OpenID не отдаёт тег

Карточка входа перечисляет параметры успешного `redirect_uri`: `status`, `access_token`, `expires_at`, `account_id`, `nickname`. Поля клана в этом списке нет.

- https://developers.lesta.ru/reference/all/wot/auth/login/
- `docs/research/lesta-openid-expo-android.md` (снимок 2026-08-30)

## Канонический метод: `wot/clans/accountinfo`

Карточка: [Подробные данные игрока клана](https://developers.lesta.ru/reference/all/wot/clans/accountinfo/).

> Метод возвращает информацию об игроке клана и краткую информацию о клане.

Это текущий метод раздела «Кланы» для связи аккаунт → клан. В [устаревших полях](https://developers.lesta.ru/documentation/guide/deprecated-features/) (апрель 2014) вместо удалённого поля `clan` у «Персональных данных игрока» указано пользоваться методом «Участник клана» — тем же смысловым слотом, что сейчас занимает `clans/accountinfo`.

### Запрос

| Параметр | Обязателен | Смысл |
| --- | --- | --- |
| `application_id` | да | идентификатор приложения |
| `account_id` | да | идентификатор аккаунта; до 100 id за запрос; минимум 1 |
| `fields` | нет | сужение ответа; для тега достаточно `clan.tag` |
| `language` | нет | локализация; по умолчанию `ru` |

`access_token` в таблице параметров **нет**. Это публичный метод: токен входа не нужен.

Формат URI — общий для Public API: `https://<server>/wot/clans/accountinfo/?…`. Хост кластера Мира танков в примерах аутентификации и в живом ответе: `api.tanki.su`.

- https://developers.lesta.ru/documentation/guide/getting-started/

Пример после Lesta OpenID:

```
https://api.tanki.su/wot/clans/accountinfo/?application_id=…&account_id=<из callback>&fields=clan.tag
```

### Поля ответа, когда аккаунт в клане

Ключ в `data` — строка `account_id`. Внутри:

| Поле | Тип в справочнике | Смысл |
| --- | --- | --- |
| `account_id` | numeric | идентификатор аккаунта |
| `account_name` | string | имя аккаунта (дубль `nickname`, не замена callback) |
| `joined_at` | timestamp | дата вступления в клан |
| `role` | string | техническое название должности |
| `role_i18n` | string | должность человеческим языком |
| `clan.clan_id` | numeric | идентификатор клана |
| `clan.tag` | string | **тег клана** |
| `clan.name` | string | название клана |
| `clan.color` | string | цвет HEX `#RRGGBB` |
| `clan.created_at` | timestamp | дата создания клана |
| `clan.members_count` | numeric | число игроков клана |
| `clan.emblems.*` | associative array | ссылки на эмблемы |

Для экрана Оценки (клан-тег над ником) из этого метода нужен только `clan.tag`. Ник уже есть в OpenID callback.

Живой объект (2026-08-31, `account_id=10000`, `X-Api-Version: 2.77.1`): `status: "ok"`, `data["10000"].clan.tag` — строка (в этом снимке `"DVSH_"`), рядом `clan.clan_id`, `clan.name`, `role`, `joined_at`. Обёртка ответа — общая: `status`, `meta.count`, `data`.

- https://developers.lesta.ru/documentation/guide/getting-started/

## Если аккаунт не в клане

Карточка `wot/clans/accountinfo` **не описывает** пустой случай: тип полей не помечен как nullable, отдельной ошибки «не в клане» в таблице метода нет. Общие ошибки (`404 %FIELD%_NOT_FOUND` и др.) относятся к неверному запросу, не к отсутствию членства.

- https://developers.lesta.ru/reference/all/wot/clans/accountinfo/
- https://developers.lesta.ru/documentation/guide/getting-started/

Живой кластер 2026-08-31:

Аккаунт существует, `clan_id` в `account/info` равен `null` (`account_id=40`):

```json
{
  "status": "ok",
  "meta": { "count": 1 },
  "data": { "40": null }
}
```

Тот же `null` в `data[<id>]` приходит и для несуществующего `account_id`. У вошедшего игрока `account_id` уже известен из OpenID, поэтому `null` здесь читается как «тега нет»: показывать нечего.

Смежный метод Tanks Blitz [`wotb/clans/accountinfo`](https://developers.lesta.ru/reference/all/wotb/clans/accountinfo/) это словами и фиксирует: клановые данные «существуют только для аккаунтов, которые принимали участие в деятельности клана». На карточке Мира танков этой фразы нет; живой ответ `wot/clans/accountinfo` всё равно `null`.

`wot/account/info` пустой случай документирует живым полем, не отсутствием объекта: существующий аккаунт без клана приходит как объект с **`clan_id: null`**. Несуществующий id — весь объект `null`. Это позволяет отличить «нет такого аккаунта» от «не в клане», но тега там всё равно нет.

- https://developers.lesta.ru/reference/all/wot/account/info/

## Альтернатива в два запроса: `account/info` → `clans/info`

[`wot/account/info`](https://developers.lesta.ru/reference/all/wot/account/info/) — «Персональные данные игрока». В ответе есть `clan_id` («Идентификатор клана»), тип `numeric`. Поля `tag` в карточке нет. Список `extra` — `private.*` и `statistics.*`; отдельного extra с тегом клана нет. `statistics.clan` — статистика боёв в составе клана, не членство и не тег.

`access_token` на `account/info` нужен для блока `private` (имущество), не для публичного `clan_id`.

Если `clan_id` не `null`, тег берёт [`wot/clans/info`](https://developers.lesta.ru/reference/all/wot/clans/info/) («Данные клана»): обязательный `clan_id` (до 100 id), в ответе поле **`tag`**. Живой снимок 2026-08-31: `data["147593"].tag` совпал с `clan.tag` из `clans/accountinfo` для того же клана.

Итог пути: **два** запроса (`account_id` → `clan_id` → `tag`), плюс развилка на `clan_id === null`. Для одной только подписи на экране Оценки это лишний круг относительно `clans/accountinfo`.

Если приложение и так вызывает `account/info` за имуществом, `clan_id` приезжает в том же ответе; тег всё равно требует ещё один метод (`clans/accountinfo` или `clans/info`).

## Что не подходит

| Метод | Почему не источник текущего тега аккаунта |
| --- | --- |
| `wot/auth/login` | в callback нет поля клана |
| `wot/account/list` | ответ только `account_id`, `nickname`; `clan_id` **удалён** в апреле 2014, указано пользоваться «Участник клана» |
| `wot/account/info` | есть `clan_id`, нет `tag` |
| `wot/clans/list` | поиск кланов по части названия или тега, не по аккаунту |
| `wot/clans/info` | тег есть, но вход — `clan_id`, не `account_id` |
| `wot/clans/memberhistory` | история пребываний (`clan_id`, даты, роль), не текущий тег; карточка помечает метод к отключению |
| `wot/clans/glossary` | только `clans_roles`, формата тега нет |
| `statistics.clan` в `account/info` | боевая статистика, не членство |

- https://developers.lesta.ru/reference/all/wot/account/list/
- https://developers.lesta.ru/documentation/guide/deprecated-features/
- https://developers.lesta.ru/reference/all/wot/clans/list/
- https://developers.lesta.ru/reference/all/wot/clans/memberhistory/
- https://developers.lesta.ru/reference/all/wot/clans/glossary/

## Практическая связка для экрана Оценки

1. Lesta OpenID: `account_id` и `nickname` из callback.
2. Один GET `wot/clans/accountinfo` с этим `account_id` (достаточно `fields=clan.tag`).
3. Если `data[account_id]` — объект: подпись — `clan.tag` и уже известный `nickname`.
4. Если `data[account_id]` — `null`: тега нет, остаётся ник.

Второй запрос после `clan_id` не нужен. `access_token` для тега не нужен.
