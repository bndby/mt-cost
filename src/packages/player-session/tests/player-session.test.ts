import { describe, expect, test } from "vitest";
import { LESTA_API_ORIGIN, OPEN_ID_REDIRECT_URI } from "../index";
import {
  APPLICATION_ID,
  createHarness,
  errorCallback,
  okCallback,
  waitForScreen,
} from "./harness";

describe("не вошёл и Lesta OpenID", () => {
  test("первый запуск показывает «не вошёл» и не открывает Custom Tab", () => {
    const { session, customTab } = createHarness();

    expect(session.screen()).toEqual({
      kind: "signed-out",
      title: "Оценка",
      subtitle: "Имущество аккаунта Мира танков.",
      signInLabel: "Войти через Lesta",
    });
    expect(customTab.opened).toEqual([]);
  });

  test("нажатие входа открывает Custom Tab с HTTPS redirect_uri заглушки", async () => {
    const { session, customTab } = createHarness();

    await session.signIn();

    expect(customTab.opened).toHaveLength(1);
    const opened = new URL(customTab.opened[0]);
    expect(opened.origin + opened.pathname).toBe(
      `${LESTA_API_ORIGIN}/wot/auth/login/`,
    );
    expect(opened.searchParams.get("application_id")).toBe(APPLICATION_ID);
    expect(opened.searchParams.get("redirect_uri")).toBe(OPEN_ID_REDIRECT_URI);
    expect(opened.searchParams.get("display")).toBe("page");
    expect(opened.searchParams.get("redirect_uri")).not.toContain("mtcost://");
  });

  test("успешный callback с access_token показывает Оценку со слотами «ждём» и «Выйти»", async () => {
    const { session, customTab, lesta } = createHarness();
    let release!: () => void;
    lesta.accountGate = new Promise((resolve) => {
      release = resolve;
    });
    customTab.succeedWith(okCallback());

    await session.signIn();

    expect(session.screen()).toMatchObject({
      kind: "valuation",
      signOutLabel: "Выйти",
      kicker: "Player",
      retryLabel: null,
      snapshot: { kind: "waiting" },
    });
    expect(JSON.stringify(session.screen())).not.toMatch(
      /Оценка|MT Cost|рос\. рубль|бел\. рубль|доллар/,
    );
    release();
  });

  test("срыв входа оставляет «не вошёл» без кодов Lesta и без чисел", async () => {
    const cases = [
      { type: "dismiss" as const },
      { type: "success" as const, url: errorCallback("AUTH_CANCEL") },
      { type: "success" as const, url: errorCallback("AUTH_EXPIRED") },
      { type: "success" as const, url: errorCallback("AUTH_ERROR") },
    ];

    for (const nextResult of cases) {
      const { session, customTab } = createHarness();
      customTab.nextResult = nextResult;
      await session.signIn();
      const shown = session.screen();
      expect(shown).toEqual({
        kind: "signed-out",
        title: "Оценка",
        subtitle: "Имущество аккаунта Мира танков.",
        signInLabel: "Войти через Lesta",
      });
      expect(JSON.stringify(shown)).not.toMatch(/AUTH_|access_token|code/);
    }
  });

  test("«Выйти» при живом токене возвращает «не вошёл» и забывает токен", async () => {
    const { session, customTab, lesta } = createHarness();
    customTab.succeedWith(okCallback({ accessToken: "live-token" }));
    await session.signIn();
    expect(session.screen().kind).toBe("valuation");

    await session.signOut();

    expect(session.screen().kind).toBe("signed-out");
    expect(lesta.logoutCalls).toEqual(["live-token"]);
    customTab.opened = [];
    await session.signIn();
    expect(customTab.opened).toHaveLength(1);
  });
});

describe("успешная Оценка: сумма и столбик", () => {
  test("после входа снимок сначала «ждём», затем сумма и строки по курсам 400 и 0,156", async () => {
    const { session, customTab, lesta } = createHarness();
    let release!: () => void;
    lesta.accountGate = new Promise((resolve) => {
      release = resolve;
    });
    lesta.account = {
      silver: 400,
      gold: 50_000,
      bonds: 0,
      hangarTankIds: [11],
      rented: [],
    };
    lesta.vehicles = [
      { tankId: 11, priceSilver: 400_000, priceGold: null },
    ];
    customTab.succeedWith(okCallback());

    await session.signIn();
    expect(session.screen()).toMatchObject({
      kind: "valuation",
      snapshot: { kind: "waiting" },
    });

    release();
    const screen = await waitForScreen(
      session,
      (s) => s.kind === "valuation" && s.snapshot.kind === "numbers",
    );

    expect(screen).toMatchObject({
      kind: "valuation",
      kicker: "Player",
      signOutLabel: "Выйти",
      retryLabel: "Повторить",
      snapshot: {
        kind: "numbers",
        heroAmount: 7956.156,
        rows: [
          { name: "Золото", count: 50_000, amount: 7800 },
          { name: "Серебро", count: 400, amount: 0.156 },
          { name: "Прокачиваемые танки", count: 1, amount: 156 },
        ],
        chips: [
          { label: "рос. рубль", symbol: "₽", selected: true },
          { label: "бел. рубль", symbol: "Br", selected: false },
          { label: "доллар", symbol: "$", selected: false },
        ],
      },
    });
    expect(JSON.stringify(screen)).not.toContain("Прочее имущество");
  });

  test("пустой аккаунт — успех с 0,00 ₽ без строк, не прочерки", async () => {
    const { session, customTab, lesta } = createHarness();
    lesta.account = {
      silver: 0,
      gold: 0,
      bonds: 0,
      hangarTankIds: [],
      rented: [],
    };
    customTab.succeedWith(okCallback());

    await session.signIn();
    const screen = await waitForScreen(
      session,
      (s) => s.kind === "valuation" && s.snapshot.kind === "numbers",
    );

    expect(screen).toMatchObject({
      kind: "valuation",
      snapshot: {
        kind: "numbers",
        heroAmount: 0,
        rows: [],
      },
    });
  });

  test("боны входят в сумму по снимку 1 бон = 1 золото", async () => {
    const { session, customTab, lesta } = createHarness();
    lesta.account = {
      silver: 0,
      gold: 0,
      bonds: 10,
      hangarTankIds: [],
      rented: [],
    };
    customTab.succeedWith(okCallback());

    await session.signIn();
    const screen = await waitForScreen(
      session,
      (s) => s.kind === "valuation" && s.snapshot.kind === "numbers",
    );

    expect(screen).toMatchObject({
      snapshot: {
        kind: "numbers",
        heroAmount: 1.56,
        rows: [{ name: "Боны", count: 10, amount: 1.56 }],
      },
    });
  });

  test("нулевой баланс валюты и пустая корзина схлопываются; порядок живых строк стабилен", async () => {
    const { session, customTab, lesta } = createHarness();
    lesta.account = {
      silver: 0,
      gold: 2_500,
      bonds: 0,
      hangarTankIds: [1],
      rented: [],
    };
    lesta.vehicles = [
      { tankId: 1, priceSilver: null, priceGold: 2_500 },
    ];
    customTab.succeedWith(okCallback());

    await session.signIn();
    const screen = await waitForScreen(
      session,
      (s) => s.kind === "valuation" && s.snapshot.kind === "numbers",
    );

    expect(screen).toMatchObject({
      snapshot: {
        kind: "numbers",
        heroAmount: 780,
        rows: [
          { name: "Золото", count: 2_500, amount: 390 },
          { name: "Премиумные танки", count: 1, amount: 390 },
        ],
      },
    });
  });
});

describe("мёртвый токен без устаревшей Оценки", () => {
  test("живой токен оставляет игрока на Оценке", async () => {
    const { session, customTab, clock } = createHarness();
    customTab.succeedWith(
      okCallback({ expiresAt: clock.nowUnixSeconds + 60 }),
    );
    await session.signIn();
    await waitForScreen(
      session,
      (s) => s.kind === "valuation" && s.snapshot.kind === "numbers",
    );

    await session.onForeground();

    expect(session.screen().kind).toBe("valuation");
  });

  test("истёкший токен без продления — «не вошёл» без кодов, чисел и автооткрытия Custom Tab", async () => {
    const { session, customTab, clock, lesta } = createHarness();
    lesta.account = {
      silver: 0,
      gold: 50_000,
      bonds: 0,
      hangarTankIds: [],
      rented: [],
    };
    customTab.succeedWith(
      okCallback({
        accessToken: "old-token",
        expiresAt: clock.nowUnixSeconds + 10,
      }),
    );
    await session.signIn();
    await waitForScreen(
      session,
      (s) =>
        s.kind === "valuation" &&
        s.snapshot.kind === "numbers" &&
        s.snapshot.heroAmount === 7800,
    );

    clock.set(clock.nowUnixSeconds + 11);
    lesta.prolongateResult = "failed";
    customTab.opened = [];

    await session.onForeground();

    expect(session.screen()).toEqual({
      kind: "signed-out",
      title: "Оценка",
      subtitle: "Имущество аккаунта Мира танков.",
      signInLabel: "Войти через Lesta",
    });
    expect(JSON.stringify(session.screen())).not.toMatch(/AUTH_|7800/);
    expect(customTab.opened).toEqual([]);
  });
});

describe("правила танков в Оценке", () => {
  test("уникальный tank_id включая аренду; без официальной цены нет в столбике и сумме; компенсация не в сумме", async () => {
    const { session, customTab, lesta } = createHarness();
    lesta.account = {
      silver: 0,
      gold: 0,
      bonds: 0,
      hangarTankIds: [1, 2, 2],
      rented: [
        { tankId: 3, compensationSilver: 1_000_000, compensationGold: 500 },
        { tankId: 1, compensationSilver: 50, compensationGold: 0 },
      ],
    };
    lesta.vehicles = [
      { tankId: 1, priceSilver: 400_000, priceGold: null },
      { tankId: 2, priceSilver: null, priceGold: 2_500 },
    ];
    customTab.succeedWith(okCallback());

    await session.signIn();
    const screen = await waitForScreen(
      session,
      (s) => s.kind === "valuation" && s.snapshot.kind === "numbers",
    );

    expect(screen).toMatchObject({
      kind: "valuation",
      snapshot: {
        kind: "numbers",
        heroAmount: 546,
        rows: [
          { name: "Премиумные танки", count: 1, amount: 390 },
          { name: "Прокачиваемые танки", count: 1, amount: 156 },
        ],
      },
    });
  });

  test("оба ненулевых поля цены — золото, суммы двух витрин нет", async () => {
    const { session, customTab, lesta } = createHarness();
    lesta.account = {
      silver: 0,
      gold: 0,
      bonds: 0,
      hangarTankIds: [7],
      rented: [],
    };
    lesta.vehicles = [
      { tankId: 7, priceSilver: 400_000, priceGold: 2_500 },
    ];
    customTab.succeedWith(okCallback());

    await session.signIn();
    const screen = await waitForScreen(
      session,
      (s) => s.kind === "valuation" && s.snapshot.kind === "numbers",
    );

    expect(screen).toMatchObject({
      snapshot: {
        kind: "numbers",
        heroAmount: 390,
        rows: [{ name: "Премиумные танки", count: 1, amount: 390 }],
      },
    });
  });
});

describe("сбой сбора и повтор", () => {
  test("сбой при живом токене оставляет Оценку с прочерками и «Повторить»", async () => {
    const { session, customTab, lesta } = createHarness();
    lesta.account = new Error("ECONNRESET");
    customTab.succeedWith(okCallback());

    await session.signIn();
    const screen = await waitForScreen(
      session,
      (s) => s.kind === "valuation" && s.snapshot.kind === "dashes",
    );

    expect(screen).toMatchObject({
      kind: "valuation",
      signOutLabel: "Выйти",
      retryLabel: "Повторить",
      snapshot: { kind: "dashes" },
    });
    expect(screen.kind === "valuation" ? screen.snapshot : null).toEqual({
      kind: "dashes",
    });
    expect(JSON.stringify(screen)).not.toMatch(
      /AUTH_|ECONNRESET|code|рос\. рубль|бел\. рубль|доллар/,
    );
  });

  test("«Повторить» сразу ставит все слоты в «ждём», затем числа или прочерки", async () => {
    const { session, customTab, lesta } = createHarness();
    lesta.account = new Error("fail");
    customTab.succeedWith(okCallback());
    await session.signIn();
    await waitForScreen(
      session,
      (s) => s.kind === "valuation" && s.snapshot.kind === "dashes",
    );

    let release!: () => void;
    lesta.account = {
      silver: 0,
      gold: 50_000,
      bonds: 0,
      hangarTankIds: [],
      rented: [],
    };
    lesta.accountGate = new Promise((resolve) => {
      release = resolve;
    });

    const retrying = session.retry();
    await waitForScreen(
      session,
      (s) =>
        s.kind === "valuation" &&
        s.snapshot.kind === "waiting" &&
        s.retryLabel === null,
    );
    release();
    await retrying;
    const screen = await waitForScreen(
      session,
      (s) => s.kind === "valuation" && s.snapshot.kind === "numbers",
    );
    expect(screen).toMatchObject({
      snapshot: { kind: "numbers", heroAmount: 7800 },
      retryLabel: "Повторить",
    });
  });

  test("из успеха повтор только явным «Повторить»; onForeground сбор не запускает", async () => {
    const { session, customTab, lesta } = createHarness();
    lesta.account = {
      silver: 0,
      gold: 50_000,
      bonds: 0,
      hangarTankIds: [],
      rented: [],
    };
    customTab.succeedWith(okCallback());
    await session.signIn();
    await waitForScreen(
      session,
      (s) => s.kind === "valuation" && s.snapshot.kind === "numbers",
    );

    lesta.account = {
      silver: 0,
      gold: 2_500,
      bonds: 0,
      hangarTankIds: [],
      rented: [],
    };
    await session.onForeground();
    expect(session.screen()).toMatchObject({
      snapshot: { kind: "numbers", heroAmount: 7800 },
    });

    await session.retry();
    const screen = await waitForScreen(
      session,
      (s) =>
        s.kind === "valuation" &&
        s.snapshot.kind === "numbers" &&
        s.snapshot.kind === "numbers" &&
        s.snapshot.heroAmount === 390,
    );
    expect(screen).toMatchObject({
      snapshot: { kind: "numbers", heroAmount: 390 },
    });
  });

  test("неудачный повтор стирает предыдущие числа", async () => {
    const { session, customTab, lesta } = createHarness();
    lesta.account = {
      silver: 0,
      gold: 50_000,
      bonds: 0,
      hangarTankIds: [],
      rented: [],
    };
    customTab.succeedWith(okCallback());
    await session.signIn();
    await waitForScreen(
      session,
      (s) => s.kind === "valuation" && s.snapshot.kind === "numbers",
    );

    lesta.account = new Error("fail");
    await session.retry();
    const screen = await waitForScreen(
      session,
      (s) => s.kind === "valuation" && s.snapshot.kind === "dashes",
    );
    expect(screen).toMatchObject({
      snapshot: { kind: "dashes" },
      retryLabel: "Повторить",
    });
    expect(JSON.stringify(screen)).not.toContain("7800");
  });

  test("ошибка энциклопедии при живом токене — те же прочерки, не «не вошёл»", async () => {
    const { session, customTab, lesta } = createHarness();
    lesta.account = {
      silver: 0,
      gold: 0,
      bonds: 0,
      hangarTankIds: [1],
      rented: [],
    };
    lesta.vehicles = new Error("vehicles");
    customTab.succeedWith(okCallback());
    await session.signIn();
    const screen = await waitForScreen(
      session,
      (s) => s.kind === "valuation" && s.snapshot.kind === "dashes",
    );
    expect(screen).toMatchObject({
      kind: "valuation",
      retryLabel: "Повторить",
      snapshot: { kind: "dashes" },
    });
  });
});

describe("кикер: ник и клан-тег", () => {
  test("успешный вход сразу ставит ник над суммой, без «Оценка» и без капса", async () => {
    const { session, customTab, lesta } = createHarness();
    let release!: () => void;
    lesta.accountGate = new Promise((resolve) => {
      release = resolve;
    });
    customTab.succeedWith(okCallback({ nickname: "pLaYeR" }));

    await session.signIn();

    expect(session.screen()).toMatchObject({
      kind: "valuation",
      kicker: "pLaYeR",
      snapshot: { kind: "waiting" },
    });
    expect(JSON.stringify(session.screen())).not.toMatch(/Оценка|MT Cost|PLAYER/);
    release();
  });

  test("подтверждённый клан: кикер «[тег] ник» в том регистре, что пришёл", async () => {
    const { session, customTab, lesta } = createHarness();
    lesta.clan = "xYz";
    customTab.succeedWith(okCallback({ nickname: "pLaYeR" }));

    await session.signIn();
    const screen = await waitForScreen(
      session,
      (s) => s.kind === "valuation" && s.kicker === "[xYz] pLaYeR",
    );

    expect(screen).toMatchObject({
      kind: "valuation",
      kicker: "[xYz] pLaYeR",
    });
  });

  test("нет клана, ожидание и сбой запроса — только ник, без прочерка тега", async () => {
    const waiting = createHarness();
    let releaseClan!: () => void;
    waiting.lesta.clan = "TAG";
    waiting.lesta.clanGate = new Promise((resolve) => {
      releaseClan = resolve;
    });
    waiting.customTab.succeedWith(okCallback({ nickname: "Nick" }));
    await waiting.session.signIn();
    expect(waiting.session.screen()).toMatchObject({
      kind: "valuation",
      kicker: "Nick",
    });
    const waitingShown = waiting.session.screen();
    if (waitingShown.kind === "valuation") {
      expect(waitingShown.kicker).not.toMatch(/\[|—|TAG/);
    }
    releaseClan();
    await waitForScreen(
      waiting.session,
      (s) => s.kind === "valuation" && s.kicker === "[TAG] Nick",
    );

    const notInClan = createHarness();
    notInClan.lesta.clan = null;
    notInClan.customTab.succeedWith(okCallback({ nickname: "Solo" }));
    await notInClan.session.signIn();
    await waitForScreen(
      notInClan.session,
      (s) => s.kind === "valuation" && s.snapshot.kind === "numbers",
    );
    expect(notInClan.session.screen()).toMatchObject({ kicker: "Solo" });
    const notInClanShown = notInClan.session.screen();
    if (notInClanShown.kind === "valuation") {
      expect(notInClanShown.kicker).not.toMatch(/\[|—/);
    }

    const failed = createHarness();
    failed.lesta.clan = new Error("clan");
    failed.customTab.succeedWith(okCallback({ nickname: "Solo" }));
    await failed.session.signIn();
    await waitForScreen(
      failed.session,
      (s) => s.kind === "valuation" && s.snapshot.kind === "numbers",
    );
    expect(failed.session.screen()).toMatchObject({
      kind: "valuation",
      kicker: "Solo",
      snapshot: { kind: "numbers" },
    });
    const failedShown = failed.session.screen();
    if (failedShown.kind === "valuation") {
      expect(failedShown.kicker).not.toMatch(/\[|—/);
    }
  });

  test("сбой клана не превращает успешную Оценку в прочерки", async () => {
    const { session, customTab, lesta } = createHarness();
    lesta.clan = new Error("clan");
    lesta.account = {
      silver: 0,
      gold: 50_000,
      bonds: 0,
      hangarTankIds: [],
      rented: [],
    };
    customTab.succeedWith(okCallback());
    await session.signIn();
    const screen = await waitForScreen(
      session,
      (s) => s.kind === "valuation" && s.snapshot.kind === "numbers",
    );
    expect(screen).toMatchObject({
      kind: "valuation",
      kicker: "Player",
      snapshot: { kind: "numbers", heroAmount: 7800 },
    });
  });

  test("повтор Оценки не сбрасывает известный кикер и не запрашивает клан снова", async () => {
    const { session, customTab, lesta } = createHarness();
    lesta.clan = "RED";
    customTab.succeedWith(okCallback({ nickname: "Ace" }));
    await session.signIn();
    await waitForScreen(
      session,
      (s) => s.kind === "valuation" && s.kicker === "[RED] Ace",
    );
    expect(lesta.clanCalls).toBe(1);

    lesta.clan = "BLUE";
    await session.retry();
    const screen = await waitForScreen(
      session,
      (s) => s.kind === "valuation" && s.snapshot.kind === "numbers",
    );
    expect(screen).toMatchObject({ kicker: "[RED] Ace" });
    expect(lesta.clanCalls).toBe(1);
  });
});

describe("переключатель валюты показа", () => {
  test("после входа выбран «рос. рубль»; бел. рубль и доллар делят рубли на 28,1618 и 85,6007", async () => {
    const { session, customTab, lesta } = createHarness();
    lesta.account = {
      silver: 0,
      gold: 50_000,
      bonds: 0,
      hangarTankIds: [],
      rented: [],
    };
    customTab.succeedWith(okCallback());
    await session.signIn();
    const rub = await waitForScreen(
      session,
      (s) => s.kind === "valuation" && s.snapshot.kind === "numbers",
    );
    expect(rub).toMatchObject({
      snapshot: {
        kind: "numbers",
        heroAmount: 7800,
        rows: [{ name: "Золото", count: 50_000, amount: 7800 }],
        chips: [
          { label: "рос. рубль", symbol: "₽", selected: true },
          { label: "бел. рубль", symbol: "Br", selected: false },
          { label: "доллар", symbol: "$", selected: false },
        ],
      },
    });

    session.chooseDisplayCurrency("бел. рубль");
    expect(session.screen()).toMatchObject({
      snapshot: {
        kind: "numbers",
        heroAmount: 276.9709322557507,
        rows: [{ name: "Золото", count: 50_000, amount: 276.9709322557507 }],
        chips: [
          { label: "рос. рубль", symbol: "₽", selected: false },
          { label: "бел. рубль", symbol: "Br", selected: true },
          { label: "доллар", symbol: "$", selected: false },
        ],
      },
    });

    session.chooseDisplayCurrency("доллар");
    expect(session.screen()).toMatchObject({
      snapshot: {
        kind: "numbers",
        heroAmount: 91.12075018078123,
        rows: [{ name: "Золото", count: 50_000, amount: 91.12075018078123 }],
        chips: [
          { label: "рос. рубль", symbol: "₽", selected: false },
          { label: "бел. рубль", symbol: "Br", selected: false },
          { label: "доллар", symbol: "$", selected: true },
        ],
      },
    });
  });

  test("выбор валюты показа переживает «Повторить»", async () => {
    const { session, customTab, lesta } = createHarness();
    lesta.account = {
      silver: 0,
      gold: 50_000,
      bonds: 0,
      hangarTankIds: [],
      rented: [],
    };
    customTab.succeedWith(okCallback());
    await session.signIn();
    await waitForScreen(
      session,
      (s) => s.kind === "valuation" && s.snapshot.kind === "numbers",
    );
    session.chooseDisplayCurrency("бел. рубль");

    lesta.account = {
      silver: 0,
      gold: 2_500,
      bonds: 0,
      hangarTankIds: [],
      rented: [],
    };
    await session.retry();
    const screen = await waitForScreen(
      session,
      (s) =>
        s.kind === "valuation" &&
        s.snapshot.kind === "numbers" &&
        s.snapshot.heroAmount === 13.848546612787535,
    );
    expect(screen).toMatchObject({
      snapshot: {
        kind: "numbers",
        heroAmount: 13.848546612787535,
        rows: [{ name: "Золото", count: 2_500, amount: 13.848546612787535 }],
        chips: [
          { label: "рос. рубль", symbol: "₽", selected: false },
          { label: "бел. рубль", symbol: "Br", selected: true },
          { label: "доллар", symbol: "$", selected: false },
        ],
      },
    });
  });

  test("выход и новый вход возвращают «рос. рубль»", async () => {
    const { session, customTab, lesta } = createHarness();
    lesta.account = {
      silver: 0,
      gold: 50_000,
      bonds: 0,
      hangarTankIds: [],
      rented: [],
    };
    customTab.succeedWith(okCallback());
    await session.signIn();
    await waitForScreen(
      session,
      (s) => s.kind === "valuation" && s.snapshot.kind === "numbers",
    );
    session.chooseDisplayCurrency("доллар");
    await session.signOut();

    customTab.succeedWith(okCallback());
    await session.signIn();
    const screen = await waitForScreen(
      session,
      (s) => s.kind === "valuation" && s.snapshot.kind === "numbers",
    );
    expect(screen).toMatchObject({
      snapshot: {
        kind: "numbers",
        heroAmount: 7800,
        chips: [
          { label: "рос. рубль", symbol: "₽", selected: true },
          { label: "бел. рубль", symbol: "Br", selected: false },
          { label: "доллар", symbol: "$", selected: false },
        ],
      },
    });
  });
});
