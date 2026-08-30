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
      subtitle: "Имущество аккаунта Мира танков в рублях.",
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
      slots: { kind: "waiting" },
    });
    expect(JSON.stringify(session.screen())).not.toContain("MT Cost");
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
        subtitle: "Имущество аккаунта Мира танков в рублях.",
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

describe("успешная Оценка: четыре числа", () => {
  test("после входа слоты сначала «ждём», затем четыре числа по курсам 400 и 0,156", async () => {
    const { session, customTab, lesta } = createHarness();
    let release!: () => void;
    lesta.accountGate = new Promise((resolve) => {
      release = resolve;
    });
    lesta.account = {
      silver: 400,
      gold: 50_000,
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
      slots: { kind: "waiting" },
    });

    release();
    const screen = await waitForScreen(
      session,
      (s) => s.kind === "valuation" && s.slots.kind === "numbers",
    );

    expect(screen).toMatchObject({
      kind: "valuation",
      heroLabel: "Оценка",
      tanksLabel: "Танки",
      tanksRubLabel: "Танки, ₽",
      otherLabel: "Прочее имущество",
      signOutLabel: "Выйти",
      slots: {
        kind: "numbers",
        tankCount: 1,
        tanksRub: 156,
        otherRub: 7800.156,
        sumRub: 7956.156,
      },
    });
  });

  test("пустой Ангар — успех с нулями, не прочерки", async () => {
    const { session, customTab, lesta } = createHarness();
    lesta.account = {
      silver: 0,
      gold: 0,
      hangarTankIds: [],
      rented: [],
    };
    customTab.succeedWith(okCallback());

    await session.signIn();
    const screen = await waitForScreen(
      session,
      (s) => s.kind === "valuation" && s.slots.kind === "numbers",
    );

    expect(screen).toMatchObject({
      kind: "valuation",
      slots: {
        kind: "numbers",
        tankCount: 0,
        tanksRub: 0,
        otherRub: 0,
        sumRub: 0,
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
      (s) => s.kind === "valuation" && s.slots.kind === "numbers",
    );

    await session.onForeground();

    expect(session.screen().kind).toBe("valuation");
  });

  test("истёкший токен без продления — «не вошёл» без кодов, чисел и автооткрытия Custom Tab", async () => {
    const { session, customTab, clock, lesta } = createHarness();
    lesta.account = {
      silver: 0,
      gold: 50_000,
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
        s.slots.kind === "numbers" &&
        s.slots.sumRub === 7800,
    );

    clock.set(clock.nowUnixSeconds + 11);
    lesta.prolongateResult = "failed";
    customTab.opened = [];

    await session.onForeground();

    expect(session.screen()).toEqual({
      kind: "signed-out",
      title: "Оценка",
      subtitle: "Имущество аккаунта Мира танков в рублях.",
      signInLabel: "Войти через Lesta",
    });
    expect(JSON.stringify(session.screen())).not.toMatch(/AUTH_|7800/);
    expect(customTab.opened).toEqual([]);
  });
});

describe("правила танков в Оценке", () => {
  test("число — уникальные tank_id, включая аренду и без цены; компенсация не в сумме", async () => {
    const { session, customTab, lesta } = createHarness();
    lesta.account = {
      silver: 0,
      gold: 0,
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
      (s) => s.kind === "valuation" && s.slots.kind === "numbers",
    );

    expect(screen).toMatchObject({
      kind: "valuation",
      slots: {
        kind: "numbers",
        tankCount: 3,
        tanksRub: 546,
        otherRub: 0,
        sumRub: 546,
      },
    });
  });

  test("оба ненулевых поля цены — золото, суммы двух витрин нет", async () => {
    const { session, customTab, lesta } = createHarness();
    lesta.account = {
      silver: 0,
      gold: 0,
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
      (s) => s.kind === "valuation" && s.slots.kind === "numbers",
    );

    expect(screen).toMatchObject({
      slots: {
        kind: "numbers",
        tankCount: 1,
        tanksRub: 390,
        otherRub: 0,
        sumRub: 390,
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
      (s) => s.kind === "valuation" && s.slots.kind === "dashes",
    );

    expect(screen).toMatchObject({
      kind: "valuation",
      signOutLabel: "Выйти",
      retryLabel: "Повторить",
      slots: { kind: "dashes" },
    });
    expect(JSON.stringify(screen)).not.toMatch(/AUTH_|ECONNRESET|code/);
  });

  test("«Повторить» сразу ставит все слоты в «ждём», затем числа или прочерки", async () => {
    const { session, customTab, lesta } = createHarness();
    lesta.account = new Error("fail");
    customTab.succeedWith(okCallback());
    await session.signIn();
    await waitForScreen(
      session,
      (s) => s.kind === "valuation" && s.slots.kind === "dashes",
    );

    let release!: () => void;
    lesta.account = {
      silver: 0,
      gold: 50_000,
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
        s.slots.kind === "waiting" &&
        s.retryLabel === null,
    );
    release();
    await retrying;
    const screen = await waitForScreen(
      session,
      (s) => s.kind === "valuation" && s.slots.kind === "numbers",
    );
    expect(screen).toMatchObject({
      slots: { kind: "numbers", sumRub: 7800 },
      retryLabel: "Повторить",
    });
  });

  test("из успеха повтор только явным «Повторить»; onForeground сбор не запускает", async () => {
    const { session, customTab, lesta } = createHarness();
    lesta.account = {
      silver: 0,
      gold: 50_000,
      hangarTankIds: [],
      rented: [],
    };
    customTab.succeedWith(okCallback());
    await session.signIn();
    await waitForScreen(
      session,
      (s) => s.kind === "valuation" && s.slots.kind === "numbers",
    );

    lesta.account = {
      silver: 0,
      gold: 2_500,
      hangarTankIds: [],
      rented: [],
    };
    await session.onForeground();
    expect(session.screen()).toMatchObject({
      slots: { kind: "numbers", sumRub: 7800 },
    });

    await session.retry();
    const screen = await waitForScreen(
      session,
      (s) =>
        s.kind === "valuation" &&
        s.slots.kind === "numbers" &&
        s.slots.sumRub === 390,
    );
    expect(screen).toMatchObject({
      slots: { kind: "numbers", sumRub: 390 },
    });
  });

  test("неудачный повтор стирает предыдущие числа", async () => {
    const { session, customTab, lesta } = createHarness();
    lesta.account = {
      silver: 0,
      gold: 50_000,
      hangarTankIds: [],
      rented: [],
    };
    customTab.succeedWith(okCallback());
    await session.signIn();
    await waitForScreen(
      session,
      (s) => s.kind === "valuation" && s.slots.kind === "numbers",
    );

    lesta.account = new Error("fail");
    await session.retry();
    const screen = await waitForScreen(
      session,
      (s) => s.kind === "valuation" && s.slots.kind === "dashes",
    );
    expect(screen).toMatchObject({
      slots: { kind: "dashes" },
      retryLabel: "Повторить",
    });
    expect(JSON.stringify(screen)).not.toContain("7800");
  });

  test("ошибка энциклопедии при живом токене — те же прочерки, не «не вошёл»", async () => {
    const { session, customTab, lesta } = createHarness();
    lesta.account = {
      silver: 0,
      gold: 0,
      hangarTankIds: [1],
      rented: [],
    };
    lesta.vehicles = new Error("vehicles");
    customTab.succeedWith(okCallback());
    await session.signIn();
    const screen = await waitForScreen(
      session,
      (s) => s.kind === "valuation" && s.slots.kind === "dashes",
    );
    expect(screen).toMatchObject({
      kind: "valuation",
      retryLabel: "Повторить",
      slots: { kind: "dashes" },
    });
  });
});
