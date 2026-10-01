import { describe, expect, test } from "vitest";
import {
  OPEN_ID_REDIRECT_URI,
  WG_API_ORIGINS,
} from "../index";
import {
  APPLICATION_ID,
  SIGNED_OUT_SCREEN,
  createHarness,
  errorCallback,
  okCallback,
  waitForScreen,
} from "./harness";

describe("не вошёл", () => {
  test("первый запуск показывает «не вошёл» и не открывает Custom Tab", () => {
    const { session, customTab } = createHarness();

    expect(session.screen()).toEqual(SIGNED_OUT_SCREEN);
    expect(customTab.opened).toEqual([]);
  });

  test("нажатие входа открывает шаг Реалма и не открывает Custom Tab", async () => {
    const { session, customTab } = createHarness();

    session.signIn();

    expect(session.screen().kind).toBe("choose-realm");
    expect(customTab.opened).toEqual([]);
  });

  test("успешный callback с access_token показывает Оценку со слотами «ждём» и «Выйти»", async () => {
    const { session, customTab, wg } = createHarness();
    let release!: () => void;
    wg.accountGate = new Promise((resolve) => {
      release = resolve;
    });
    customTab.succeedWith(okCallback());

    session.signIn();
    await session.chooseRealm("EU");

    expect(session.screen()).toMatchObject({
      kind: "valuation",
      signOutLabel: "Выйти",
      kicker: "[EU] Player",
      retryLabel: null,
      snapshot: { kind: "waiting" },
    });
    expect(JSON.stringify(session.screen())).not.toMatch(
      /Оценка|WoT Cost|рос\. рубль|бел\. рубль/,
    );
    release();
  });

  test("срыв входа оставляет шаг Реалма без кодов и без чисел", async () => {
    const cases = [
      { type: "dismiss" as const },
      { type: "success" as const, url: errorCallback("AUTH_CANCEL") },
      { type: "success" as const, url: errorCallback("AUTH_EXPIRED") },
      { type: "success" as const, url: errorCallback("AUTH_ERROR") },
    ];

    for (const nextResult of cases) {
      const { session, customTab } = createHarness();
      customTab.nextResult = nextResult;
      session.signIn();
    await session.chooseRealm("EU");
      const shown = session.screen();
      expect(shown.kind).toBe("choose-realm");
      expect(JSON.stringify(shown)).not.toMatch(/AUTH_|access_token/);
    }
  });

  test("«Выйти» при живом токене возвращает «не вошёл» и забывает токен", async () => {
    const { session, customTab, wg } = createHarness();
    customTab.succeedWith(okCallback({ accessToken: "live-token" }));
    session.signIn();
    await session.chooseRealm("EU");
    expect(session.screen().kind).toBe("valuation");

    await session.signOut();

    expect(session.screen().kind).toBe("signed-out");
    expect(wg.logoutCalls).toEqual(["live-token"]);
    customTab.opened = [];
    session.signIn();
    await session.chooseRealm("EU");
    expect(customTab.opened).toHaveLength(1);
  });
});

describe("вход через WG: шаг выбора Реалма", () => {
  const CHOOSE_REALM = {
    kind: "choose-realm" as const,
    kicker: "Войти",
    title: "Выберите Реалм",
    backLabel: "Назад",
    realms: [
      { key: "NA" as const, selected: false },
      { key: "EU" as const, selected: false },
      { key: "ASIA" as const, selected: false },
    ],
  };

  test("«Войти через WG» показывает шаг выбора Реалма и не открывает Custom Tab", () => {
    const { session, customTab } = createHarness();

    session.signIn();

    expect(session.screen()).toEqual(CHOOSE_REALM);
    expect(customTab.opened).toEqual([]);
  });

  test("«Назад» с шага Реалма возвращает «не вошёл» и сбрасывает выбор", () => {
    const { session, customTab } = createHarness();
    session.signIn();

    session.backFromRealm();

    expect(session.screen()).toEqual(SIGNED_OUT_SCREEN);
    expect(customTab.opened).toEqual([]);
  });

  test("выбор Реалма открывает WG OpenID на хосте Реалма", async () => {
    const { session, customTab } = createHarness();
    session.signIn();

    await session.chooseRealm("EU");

    expect(customTab.opened).toHaveLength(1);
    const opened = new URL(customTab.opened[0]);
    expect(opened.origin + opened.pathname).toBe(
      `${WG_API_ORIGINS.EU}/wot/auth/login/`,
    );
    expect(opened.searchParams.get("application_id")).toBe(APPLICATION_ID);
    expect(opened.searchParams.get("redirect_uri")).toBe(OPEN_ID_REDIRECT_URI);
    expect(opened.searchParams.get("display")).toBe("page");
    expect(opened.searchParams.get("redirect_uri")).not.toContain("mtcost://");
  });

  test("отмена Custom Tab после выбора Реалма оставляет шаг с сохранённым выбором", async () => {
    const { session, customTab } = createHarness();
    session.signIn();
    await session.chooseRealm("NA");

    expect(session.screen()).toEqual({
      ...CHOOSE_REALM,
      realms: [
        { key: "NA", selected: true },
        { key: "EU", selected: false },
        { key: "ASIA", selected: false },
      ],
    });
    expect(customTab.opened).toHaveLength(1);
  });

  test("«Назад» после отмены на странице WG сбрасывает выбор полностью", async () => {
    const { session } = createHarness();
    session.signIn();
    await session.chooseRealm("ASIA");

    session.backFromRealm();
    session.signIn();

    expect(session.screen()).toEqual(CHOOSE_REALM);
  });
});

describe("успешная Оценка: сумма и столбик", () => {
  test("после входа снимок сначала «ждём», затем сумма и строки по курсу серебра и пакету золота", async () => {
    const { session, customTab, wg } = createHarness();
    let release!: () => void;
    wg.accountGate = new Promise((resolve) => {
      release = resolve;
    });
    wg.account = {
      silver: 400,
      gold: 50_000,
      bonds: 0,
      hangarTankIds: [11],
      rented: [],
    };
    wg.vehicles = [
      { tankId: 11, priceSilver: 400_000, priceGold: null },
    ];
    customTab.succeedWith(okCallback());

    session.signIn();
    await session.chooseRealm("EU");
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
      kicker: "[EU] Player",
      signOutLabel: "Выйти",
      retryLabel: "Повторить",
      symbol: "€",
      snapshot: {
        kind: "numbers",
        heroAmount: 102.002,
        rows: [
          { line: "gold", name: "Золото", count: 50_000, amount: 100 },
          { line: "silver", name: "Серебро", count: 400, amount: 0.002 },
          {
            line: "researchable",
            name: "Танки",
            count: 1,
            amount: 2,
          },
        ],
      },
    });
    expect(JSON.stringify(screen)).not.toContain("Прочее имущество");
  });

  test("пустой аккаунт — успех с 0,00 без строк, не прочерки", async () => {
    const { session, customTab, wg } = createHarness();
    wg.account = {
      silver: 0,
      gold: 0,
      bonds: 0,
      hangarTankIds: [],
      rented: [],
    };
    customTab.succeedWith(okCallback());

    session.signIn();
    await session.chooseRealm("EU");
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

  test("боны входят в сумму по снимку 1 бон = 1,6 золота", async () => {
    const { session, customTab, wg } = createHarness();
    wg.account = {
      silver: 0,
      gold: 0,
      bonds: 10,
      hangarTankIds: [],
      rented: [],
    };
    customTab.succeedWith(okCallback());

    session.signIn();
    await session.chooseRealm("EU");
    const screen = await waitForScreen(
      session,
      (s) => s.kind === "valuation" && s.snapshot.kind === "numbers",
    );

    expect(screen).toMatchObject({
      snapshot: {
        kind: "numbers",
        heroAmount: 0.032,
        rows: [{ line: "bonds", name: "Боны", count: 10, amount: 0.032 }],
      },
    });
  });

  test("ТПА считает дни вверх, раскладывает их по пакетам и входит в общую сумму", async () => {
    const { session, customTab, wg, clock } = createHarness();
    wg.account = {
      silver: 0,
      gold: 0,
      bonds: 0,
      premiumExpiresAt: clock.nowUnixSeconds + 10 * 24 * 3600,
      hangarTankIds: [],
      rented: [],
    };
    customTab.succeedWith(okCallback());

    session.signIn();
    await session.chooseRealm("EU");
    const screen = await waitForScreen(
      session,
      (s) => s.kind === "valuation" && s.snapshot.kind === "numbers",
    );

    expect(screen).toMatchObject({
      snapshot: {
        kind: "numbers",
        heroAmount: 3.8,
        rows: [
          {
            line: "premiumAccount",
            name: "Прем. акк",
            count: 10,
            amount: 3.8,
          },
        ],
      },
    });
  });

  test("ТПА на 360 дней раскладывается пакетом 20 500 золота", async () => {
    const { session, customTab, wg, clock } = createHarness();
    wg.account = {
      silver: 0,
      gold: 0,
      bonds: 0,
      premiumExpiresAt: clock.nowUnixSeconds + 360 * 24 * 3600,
      hangarTankIds: [],
      rented: [],
    };
    customTab.succeedWith(okCallback());

    session.signIn();
    await session.chooseRealm("EU");
    const screen = await waitForScreen(
      session,
      (s) => s.kind === "valuation" && s.snapshot.kind === "numbers",
    );

    expect(screen).toMatchObject({
      snapshot: {
        kind: "numbers",
        heroAmount: 41,
        rows: [
          {
            line: "premiumAccount",
            name: "Прем. акк",
            count: 360,
            amount: 41,
          },
        ],
      },
    });
  });

  test("свободный опыт идёт в столбик по курсу 25 XP за золото", async () => {
    const { session, customTab, wg } = createHarness();
    wg.account = {
      silver: 0,
      gold: 0,
      bonds: 0,
      freeXp: 25_000,
      hangarTankIds: [],
      rented: [],
    };
    customTab.succeedWith(okCallback());

    session.signIn();
    await session.chooseRealm("EU");
    const screen = await waitForScreen(
      session,
      (s) => s.kind === "valuation" && s.snapshot.kind === "numbers",
    );

    expect(screen).toMatchObject({
      snapshot: {
        kind: "numbers",
        heroAmount: 2,
        rows: [
          {
            line: "freeXp",
            name: "Своб. опыт",
            count: 25_000,
            amount: 2,
          },
        ],
      },
    });
  });

  test("наградной танк без каталожной цены не входит в Оценку", async () => {
    const { session, customTab, wg } = createHarness();
    wg.account = {
      silver: 0,
      gold: 0,
      bonds: 0,
      hangarTankIds: [8],
      rented: [],
    };
    wg.vehicles = [
      {
        tankId: 8,
        priceSilver: 0,
        priceGold: 0,
        tier: 8,
        isPremium: false,
        isGift: true,
      },
    ];
    customTab.succeedWith(okCallback());

    session.signIn();
    await session.chooseRealm("EU");
    const screen = await waitForScreen(
      session,
      (s) => s.kind === "valuation" && s.snapshot.kind === "numbers",
    );

    expect(screen).toMatchObject({
      snapshot: {
        kind: "numbers",
        heroAmount: 0,
        rows: [],
      },
    });
  });

  test("личные резервы: витрина золота, USED выкинут, не словарь — без строки", async () => {
    const { session, customTab, wg } = createHarness();
    wg.account = {
      silver: 0,
      gold: 0,
      bonds: 0,
      hangarTankIds: [],
      rented: [],
      boosters: [
        { boosterId: 121001, count: 2, state: "INACTIVE" },
        { boosterId: 121000, count: 1, state: "ACTIVE" },
        { boosterId: 9, count: 4, state: "USED" },
      ],
    };
    wg.boosterPrices = [
      { boosterId: 121001, priceGold: 150 },
      { boosterId: 121000, priceGold: 100 },
      { boosterId: 9, priceGold: 50 },
    ];
    customTab.succeedWith(okCallback());

    session.signIn();
    await session.chooseRealm("EU");
    const screen = await waitForScreen(
      session,
      (s) => s.kind === "valuation" && s.snapshot.kind === "numbers",
    );

    expect(screen).toMatchObject({
      snapshot: {
        kind: "numbers",
        heroAmount: 0.8,
        rows: [
          {
            line: "boosters",
            name: "Резервы",
            count: 3,
            amount: 0.8,
          },
        ],
      },
    });
  });

  test("истёкший ТПА не показывается и не входит в сумму", async () => {
    const { session, customTab, wg, clock } = createHarness();
    wg.account = {
      silver: 0,
      gold: 0,
      bonds: 0,
      premiumExpiresAt: clock.nowUnixSeconds,
      hangarTankIds: [],
      rented: [],
    };
    customTab.succeedWith(okCallback());

    session.signIn();
    await session.chooseRealm("EU");
    const screen = await waitForScreen(
      session,
      (s) => s.kind === "valuation" && s.snapshot.kind === "numbers",
    );

    expect(screen).toMatchObject({
      snapshot: { kind: "numbers", heroAmount: 0, rows: [] },
    });
  });

  test("нулевой баланс валюты и пустая корзина схлопываются; порядок живых строк стабилен", async () => {
    const { session, customTab, wg } = createHarness();
    wg.account = {
      silver: 0,
      gold: 2_500,
      bonds: 0,
      hangarTankIds: [1],
      rented: [],
    };
    wg.vehicles = [
      { tankId: 1, priceSilver: null, priceGold: 2_500 },
    ];
    customTab.succeedWith(okCallback());

    session.signIn();
    await session.chooseRealm("EU");
    const screen = await waitForScreen(
      session,
      (s) => s.kind === "valuation" && s.snapshot.kind === "numbers",
    );

    expect(screen).toMatchObject({
      snapshot: {
        kind: "numbers",
        heroAmount: 10,
        rows: [
          { line: "gold", name: "Золото", count: 2_500, amount: 5 },
          { line: "premium", name: "Прем. танки", count: 1, amount: 5 },
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
    session.signIn();
    await session.chooseRealm("EU");
    await waitForScreen(
      session,
      (s) => s.kind === "valuation" && s.snapshot.kind === "numbers",
    );

    await session.onForeground();

    expect(session.screen().kind).toBe("valuation");
  });

  test("истёкший токен без продления — «не вошёл» без кодов, чисел и автооткрытия Custom Tab", async () => {
    const { session, customTab, clock, wg } = createHarness();
    wg.account = {
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
    session.signIn();
    await session.chooseRealm("EU");
    await waitForScreen(
      session,
      (s) =>
        s.kind === "valuation" &&
        s.snapshot.kind === "numbers" &&
        s.snapshot.heroAmount === 100,
    );

    clock.set(clock.nowUnixSeconds + 11);
    wg.prolongateResult = "failed";
    customTab.opened = [];

    await session.onForeground();

    expect(session.screen()).toEqual(SIGNED_OUT_SCREEN);
    expect(JSON.stringify(session.screen())).not.toMatch(/AUTH_|access_token/);
    expect(customTab.opened).toEqual([]);
  });
});

describe("правила танков в Оценке", () => {
  test("уникальный tank_id включая аренду; без официальной цены нет в столбике и сумме; компенсация не в сумме", async () => {
    const { session, customTab, wg } = createHarness();
    wg.account = {
      silver: 0,
      gold: 0,
      bonds: 0,
      hangarTankIds: [1, 2, 2],
      rented: [
        { tankId: 3, compensationSilver: 1_000_000, compensationGold: 500 },
        { tankId: 1, compensationSilver: 50, compensationGold: 0 },
      ],
    };
    wg.vehicles = [
      { tankId: 1, priceSilver: 400_000, priceGold: null },
      { tankId: 2, priceSilver: null, priceGold: 2_500 },
    ];
    customTab.succeedWith(okCallback());

    session.signIn();
    await session.chooseRealm("EU");
    const screen = await waitForScreen(
      session,
      (s) => s.kind === "valuation" && s.snapshot.kind === "numbers",
    );

    expect(screen).toMatchObject({
      kind: "valuation",
      snapshot: {
        kind: "numbers",
        heroAmount: 7,
        rows: [
          { line: "premium", name: "Прем. танки", count: 1, amount: 5 },
          {
            line: "researchable",
            name: "Танки",
            count: 1,
            amount: 2,
          },
        ],
      },
    });
  });

  test("оба ненулевых поля цены — золото, суммы двух витрин нет", async () => {
    const { session, customTab, wg } = createHarness();
    wg.account = {
      silver: 0,
      gold: 0,
      bonds: 0,
      hangarTankIds: [7],
      rented: [],
    };
    wg.vehicles = [
      { tankId: 7, priceSilver: 400_000, priceGold: 2_500 },
    ];
    customTab.succeedWith(okCallback());

    session.signIn();
    await session.chooseRealm("EU");
    const screen = await waitForScreen(
      session,
      (s) => s.kind === "valuation" && s.snapshot.kind === "numbers",
    );

    expect(screen).toMatchObject({
      snapshot: {
        kind: "numbers",
        heroAmount: 5,
        rows: [
          { line: "premium", name: "Прем. танки", count: 1, amount: 5 },
        ],
      },
    });
  });
});

describe("сбой сбора и повтор", () => {
  test("сбой при живом токене оставляет Оценку с прочерками и «Повторить»", async () => {
    const { session, customTab, wg } = createHarness();
    wg.account = new Error("ECONNRESET");
    customTab.succeedWith(okCallback());

    session.signIn();
    await session.chooseRealm("EU");
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
      /AUTH_|ECONNRESET|code|рос\. рубль|бел\. рубль/,
    );
  });

  test("«Повторить» сразу ставит все слоты в «ждём», затем числа или прочерки", async () => {
    const { session, customTab, wg } = createHarness();
    wg.account = new Error("fail");
    customTab.succeedWith(okCallback());
    session.signIn();
    await session.chooseRealm("EU");
    await waitForScreen(
      session,
      (s) => s.kind === "valuation" && s.snapshot.kind === "dashes",
    );

    let release!: () => void;
    wg.account = {
      silver: 0,
      gold: 50_000,
      bonds: 0,
      hangarTankIds: [],
      rented: [],
    };
    wg.accountGate = new Promise((resolve) => {
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
      snapshot: { kind: "numbers", heroAmount: 100 },
      retryLabel: "Повторить",
    });
  });

  test("из успеха повтор только явным «Повторить»; onForeground сбор не запускает", async () => {
    const { session, customTab, wg } = createHarness();
    wg.account = {
      silver: 0,
      gold: 50_000,
      bonds: 0,
      hangarTankIds: [],
      rented: [],
    };
    customTab.succeedWith(okCallback());
    session.signIn();
    await session.chooseRealm("EU");
    await waitForScreen(
      session,
      (s) => s.kind === "valuation" && s.snapshot.kind === "numbers",
    );

    wg.account = {
      silver: 0,
      gold: 2_500,
      bonds: 0,
      hangarTankIds: [],
      rented: [],
    };
    await session.onForeground();
    expect(session.screen()).toMatchObject({
      snapshot: { kind: "numbers", heroAmount: 100 },
    });

    await session.retry();
    const screen = await waitForScreen(
      session,
      (s) =>
        s.kind === "valuation" &&
        s.snapshot.kind === "numbers" &&
        s.snapshot.kind === "numbers" &&
        s.snapshot.heroAmount === 5,
    );
    expect(screen).toMatchObject({
      snapshot: { kind: "numbers", heroAmount: 5 },
    });
  });

  test("неудачный повтор стирает предыдущие числа", async () => {
    const { session, customTab, wg } = createHarness();
    wg.account = {
      silver: 0,
      gold: 50_000,
      bonds: 0,
      hangarTankIds: [],
      rented: [],
    };
    customTab.succeedWith(okCallback());
    session.signIn();
    await session.chooseRealm("EU");
    await waitForScreen(
      session,
      (s) => s.kind === "valuation" && s.snapshot.kind === "numbers",
    );

    wg.account = new Error("fail");
    await session.retry();
    const screen = await waitForScreen(
      session,
      (s) => s.kind === "valuation" && s.snapshot.kind === "dashes",
    );
    expect(screen).toMatchObject({
      snapshot: { kind: "dashes" },
      retryLabel: "Повторить",
    });
    expect(JSON.stringify(screen)).not.toContain("live-token");
  });

  test("ошибка энциклопедии при живом токене — те же прочерки, не «не вошёл»", async () => {
    const { session, customTab, wg } = createHarness();
    wg.account = {
      silver: 0,
      gold: 0,
      bonds: 0,
      hangarTankIds: [1],
      rented: [],
    };
    wg.vehicles = new Error("vehicles");
    customTab.succeedWith(okCallback());
    session.signIn();
    await session.chooseRealm("EU");
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
    const { session, customTab, wg } = createHarness();
    let release!: () => void;
    wg.accountGate = new Promise((resolve) => {
      release = resolve;
    });
    customTab.succeedWith(okCallback({ nickname: "pLaYeR" }));

    session.signIn();
    await session.chooseRealm("EU");

    expect(session.screen()).toMatchObject({
      kind: "valuation",
      kicker: "[EU] pLaYeR",
      snapshot: { kind: "waiting" },
    });
    expect(JSON.stringify(session.screen())).not.toMatch(/Оценка|WoT Cost|PLAYER/);
    release();
  });

  test("подтверждённый клан: кикер «[тег] ник» в том регистре, что пришёл", async () => {
    const { session, customTab, wg } = createHarness();
    wg.clan = "xYz";
    customTab.succeedWith(okCallback({ nickname: "pLaYeR" }));

    session.signIn();
    await session.chooseRealm("EU");
    const screen = await waitForScreen(
      session,
      (s) => s.kind === "valuation" && s.kicker === "[EU] [xYz] pLaYeR",
    );

    expect(screen).toMatchObject({
      kind: "valuation",
      kicker: "[EU] [xYz] pLaYeR",
    });
  });

  test("нет клана, ожидание и сбой запроса — только ник, без прочерка тега", async () => {
    const waiting = createHarness();
    let releaseClan!: () => void;
    waiting.wg.clan = "TAG";
    waiting.wg.clanGate = new Promise((resolve) => {
      releaseClan = resolve;
    });
    waiting.customTab.succeedWith(okCallback({ nickname: "Nick" }));
    waiting.session.signIn();
    await waiting.session.chooseRealm("EU");
    expect(waiting.session.screen()).toMatchObject({
      kind: "valuation",
      kicker: "[EU] Nick",
    });
    const waitingShown = waiting.session.screen();
    if (waitingShown.kind === "valuation") {
      expect(waitingShown.kicker).toBe("[EU] Nick");
    }
    releaseClan();
    await waitForScreen(
      waiting.session,
      (s) => s.kind === "valuation" && s.kicker === "[EU] [TAG] Nick",
    );

    const notInClan = createHarness();
    notInClan.wg.clan = null;
    notInClan.customTab.succeedWith(okCallback({ nickname: "Solo" }));
    notInClan.session.signIn();
    await notInClan.session.chooseRealm("EU");
    await waitForScreen(
      notInClan.session,
      (s) => s.kind === "valuation" && s.snapshot.kind === "numbers",
    );
    expect(notInClan.session.screen()).toMatchObject({ kicker: "[EU] Solo" });
    const notInClanShown = notInClan.session.screen();
    if (notInClanShown.kind === "valuation") {
      expect(notInClanShown.kicker).toBe("[EU] Solo");
    }

    const failed = createHarness();
    failed.wg.clan = new Error("clan");
    failed.customTab.succeedWith(okCallback({ nickname: "Solo" }));
    failed.session.signIn();
    await failed.session.chooseRealm("EU");
    await waitForScreen(
      failed.session,
      (s) => s.kind === "valuation" && s.snapshot.kind === "numbers",
    );
    expect(failed.session.screen()).toMatchObject({
      kind: "valuation",
      kicker: "[EU] Solo",
      snapshot: { kind: "numbers" },
    });
    const failedShown = failed.session.screen();
    if (failedShown.kind === "valuation") {
      expect(failedShown.kicker).toBe("[EU] Solo");
    }
  });

  test("сбой клана не превращает успешную Оценку в прочерки", async () => {
    const { session, customTab, wg } = createHarness();
    wg.clan = new Error("clan");
    wg.account = {
      silver: 0,
      gold: 50_000,
      bonds: 0,
      hangarTankIds: [],
      rented: [],
    };
    customTab.succeedWith(okCallback());
    session.signIn();
    await session.chooseRealm("EU");
    const screen = await waitForScreen(
      session,
      (s) => s.kind === "valuation" && s.snapshot.kind === "numbers",
    );
    expect(screen).toMatchObject({
      kind: "valuation",
      kicker: "[EU] Player",
      snapshot: { kind: "numbers", heroAmount: 100 },
    });
  });

  test("повтор Оценки не сбрасывает известный кикер и не запрашивает клан снова", async () => {
    const { session, customTab, wg } = createHarness();
    wg.clan = "RED";
    customTab.succeedWith(okCallback({ nickname: "Ace" }));
    session.signIn();
    await session.chooseRealm("EU");
    await waitForScreen(
      session,
      (s) => s.kind === "valuation" && s.kicker === "[EU] [RED] Ace",
    );
    expect(wg.clanCalls).toBe(1);

    wg.clan = "BLUE";
    await session.retry();
    const screen = await waitForScreen(
      session,
      (s) => s.kind === "valuation" && s.snapshot.kind === "numbers",
    );
    expect(screen).toMatchObject({ kicker: "[EU] [RED] Ace" });
    expect(wg.clanCalls).toBe(1);
  });
});

describe("вход через WG: Оценка", () => {
  async function signInWg(
    harness: ReturnType<typeof createHarness>,
    realm: "NA" | "EU" | "ASIA" = "EU",
  ) {
    harness.customTab.succeedWith(okCallback());
    harness.session.signIn();
    await harness.session.chooseRealm(realm);
  }

  test("успешный WG-вход считает пакет в долларах и ставит доллар по умолчанию", async () => {
    const harness = createHarness();
    harness.wg.account = {
      silver: 0,
      gold: 50_000,
      bonds: 0,
      hangarTankIds: [],
      rented: [],
    };
    await signInWg(harness);
    const screen = await waitForScreen(
      harness.session,
      (s) => s.kind === "valuation" && s.snapshot.kind === "numbers",
    );

    expect(screen).toMatchObject({
      kind: "valuation",
      kicker: "[EU] Player",
      symbol: "€",
      snapshot: {
        kind: "numbers",
        heroAmount: 100,
        rows: [{ name: "Золото", count: 50_000, amount: 100 }],
      },
    });
    expect(harness.wg.logoutCalls).toEqual([]);
    expect(harness.wgRealms).toEqual(["EU"]);
  });

  test("свободный опыт WG идёт в столбик по курсу конвертации 25 XP за золото", async () => {
    const harness = createHarness();
    harness.wg.account = {
      silver: 0,
      gold: 0,
      bonds: 0,
      freeXp: 25_000,
      hangarTankIds: [],
      rented: [],
    };
    await signInWg(harness);
    const screen = await waitForScreen(
      harness.session,
      (s) => s.kind === "valuation" && s.snapshot.kind === "numbers",
    );
    expect(screen).toMatchObject({
      snapshot: {
        kind: "numbers",
        heroAmount: 2,
        rows: [
          {
            line: "freeXp",
            name: "Своб. опыт",
            count: 25_000,
            amount: 2,
          },
        ],
      },
    });
  });

  test("ТПА 360 дней раскладывается пакетом 20 500 золота", async () => {
    const harness = createHarness();
    harness.wg.account = {
      silver: 0,
      gold: 0,
      bonds: 0,
      premiumExpiresAt: harness.clock.nowUnixSeconds + 360 * 24 * 3600,
      hangarTankIds: [],
      rented: [],
    };
    await signInWg(harness);
    const screen = await waitForScreen(
      harness.session,
      (s) => s.kind === "valuation" && s.snapshot.kind === "numbers",
    );
    expect(screen).toMatchObject({
      snapshot: {
        kind: "numbers",
        heroAmount: 41,
        rows: [
          {
            line: "premiumAccount",
            name: "Прем. акк",
            count: 360,
            amount: 41,
          },
        ],
      },
    });
  });

  test("наградной танк без каталога не входит в Оценку", async () => {
    const harness = createHarness();
    harness.wg.account = {
      silver: 0,
      gold: 0,
      bonds: 0,
      hangarTankIds: [8],
      rented: [],
    };
    harness.wg.vehicles = [
      {
        tankId: 8,
        priceSilver: 0,
        priceGold: 0,
        tier: 8,
        isPremium: false,
        isGift: true,
      },
    ];
    await signInWg(harness);
    const screen = await waitForScreen(
      harness.session,
      (s) => s.kind === "valuation" && s.snapshot.kind === "numbers",
    );
    expect(screen).toMatchObject({
      snapshot: { kind: "numbers", heroAmount: 0, rows: [] },
    });
  });

  test("боны WG идут в столбик по той же договорённости 1 бона = 1,6 золота", async () => {
    const harness = createHarness();
    harness.wg.account = {
      silver: 0,
      gold: 0,
      bonds: 50_000,
      hangarTankIds: [],
      rented: [],
    };
    await signInWg(harness);
    const screen = await waitForScreen(
      harness.session,
      (s) => s.kind === "valuation" && s.snapshot.kind === "numbers",
    );
    expect(screen).toMatchObject({
      snapshot: {
        kind: "numbers",
        heroAmount: 160,
        rows: [{ name: "Боны", count: 50_000, amount: 160 }],
      },
    });
  });

  test("кикер WG — Реалм первым, затем клан-тег и ник", async () => {
    const harness = createHarness();
    harness.wg.clan = "RED";
    harness.customTab.succeedWith(okCallback({ nickname: "Ace" }));
    harness.session.signIn();
    await harness.session.chooseRealm("NA");
    const screen = await waitForScreen(
      harness.session,
      (s) => s.kind === "valuation" && s.kicker === "[NA] [RED] Ace",
    );
    expect(screen).toMatchObject({ kicker: "[NA] [RED] Ace", symbol: "$" });
  });

  test("«Выйти» вызывает logout клиента Реалма", async () => {
    const harness = createHarness();
    harness.customTab.succeedWith(okCallback({ accessToken: "wg-token" }));
    harness.session.signIn();
    await harness.session.chooseRealm("ASIA");
    await waitForScreen(harness.session, (s) => s.kind === "valuation");

    await harness.session.signOut();

    expect(harness.session.screen()).toEqual(SIGNED_OUT_SCREEN);
    expect(harness.wg.logoutCalls).toEqual(["wg-token"]);
  });

  test("срыв WG OpenID (AUTH_*) оставляет шаг Реалма без кодов", async () => {
    const { session, customTab } = createHarness();
    session.signIn();
    customTab.nextResult = {
      type: "success",
      url: errorCallback("AUTH_CANCEL"),
    };
    await session.chooseRealm("EU");

    expect(session.screen()).toMatchObject({
      kind: "choose-realm",
      realms: [
        { key: "NA", selected: false },
        { key: "EU", selected: true },
        { key: "ASIA", selected: false },
      ],
    });
    expect(JSON.stringify(session.screen())).not.toMatch(/AUTH_|access_token|code/);
  });
});
