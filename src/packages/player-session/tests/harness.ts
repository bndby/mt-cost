import { createPlayerSession } from "../index";
import type {
  AccountSnapshot,
  Clock,
  CustomTab,
  CustomTabResult,
  BoosterPrice,
  LestaClient,
  PlayerSession,
  Screen,
  VehiclePrice,
} from "../index";

export const APPLICATION_ID = "test-application-id";
export const WG_APPLICATION_ID = "test-wg-application-id";

export const SIGNED_OUT_SCREEN = {
  kind: "signed-out" as const,
  title: "Оценка" as const,
  subtitle: "Имущество танкового аккаунта.",
  signInLabel: "Войти через Lesta",
  wgSignInLabel: "Войти через WG",
};

export const SESSION_RATES = {
  silverPerGold: 400,
  goldPackGold: 50_000,
  goldPackRubles: 7_800,
  goldPerBond: 2,
  freeXpPerGold: 25,
  wgSilverPerGold: 400,
  wgGoldPackGold: 50_000,
  wgGoldPackUsd: 100,
  wgGoldPerBond: 2,
  wgFreeXpPerGold: 25,
  rubPerByn: 28.1618,
  rubPerUsd: 85.6007,
} as const;

export class FakeClock implements Clock {
  constructor(public nowUnixSeconds = 1_700_000_000) {}

  set(unixSeconds: number) {
    this.nowUnixSeconds = unixSeconds;
  }
}

export class FakeCustomTab implements CustomTab {
  opened: string[] = [];
  nextResult: CustomTabResult = { type: "dismiss" };

  async open(url: string): Promise<CustomTabResult> {
    this.opened.push(url);
    return this.nextResult;
  }

  succeedWith(url: string) {
    this.nextResult = { type: "success", url };
  }
}

export class FakeLesta implements LestaClient {
  logoutCalls: string[] = [];
  prolongateResult:
    | { accessToken: string; expiresAt: number }
    | "failed" = "failed";
  account: AccountOrError = {
    silver: 0,
    gold: 0,
    bonds: 0,
    premiumExpiresAt: null,
    hangarTankIds: [],
    rented: [],
  };
  vehicles: VehiclePrice[] | Error = [];
  boosterPrices: BoosterPrice[] | Error = [];
  accountGate: Promise<void> = Promise.resolve();
  clan: string | null | Error = null;
  clanGate: Promise<void> = Promise.resolve();
  clanCalls = 0;

  async logout(accessToken: string): Promise<void> {
    this.logoutCalls.push(accessToken);
  }

  async prolongate(): Promise<
    { accessToken: string; expiresAt: number } | "failed"
  > {
    return this.prolongateResult;
  }

  async fetchAccount(): Promise<AccountSnapshot> {
    await this.accountGate;
    if (this.account instanceof Error) throw this.account;
    return this.account;
  }

  async fetchVehiclePrices(): Promise<VehiclePrice[]> {
    if (this.vehicles instanceof Error) throw this.vehicles;
    return this.vehicles;
  }

  async fetchBoosterPrices(): Promise<BoosterPrice[]> {
    if (this.boosterPrices instanceof Error) throw this.boosterPrices;
    return this.boosterPrices;
  }

  async fetchClanTag(): Promise<string | null> {
    this.clanCalls += 1;
    await this.clanGate;
    if (this.clan instanceof Error) throw this.clan;
    return this.clan;
  }
}

type AccountOrError = AccountSnapshot | Error;

export function createHarness() {
  const clock = new FakeClock();
  const customTab = new FakeCustomTab();
  const lesta = new FakeLesta();
  const wg = new FakeLesta();
  const wgRealms: string[] = [];
  const session = createPlayerSession({
    clock,
    customTab,
    lesta,
    wgForRealm: (realm) => {
      wgRealms.push(realm);
      return wg;
    },
    config: {
      applicationId: APPLICATION_ID,
      wgApplicationId: WG_APPLICATION_ID,
      ...SESSION_RATES,
    },
  });
  return { session, clock, customTab, lesta, wg, wgRealms };
}

export function waitForScreen(
  session: PlayerSession,
  predicate: (screen: Screen) => boolean,
): Promise<Screen> {
  const current = session.screen();
  if (predicate(current)) return Promise.resolve(current);
  return new Promise((resolve) => {
    const unsubscribe = session.subscribe(() => {
      const next = session.screen();
      if (predicate(next)) {
        unsubscribe();
        resolve(next);
      }
    });
  });
}

export function okCallback(params: {
  accessToken?: string;
  expiresAt?: number;
  accountId?: number;
  nickname?: string;
} = {}) {
  const search = new URLSearchParams({
    status: "ok",
    access_token: params.accessToken ?? "live-token",
    expires_at: String(params.expiresAt ?? 1_700_000_000 + 14 * 24 * 3600),
    account_id: String(params.accountId ?? 42),
    nickname: params.nickname ?? "Player",
  });
  return `mtcost://auth/callback?${search.toString()}`;
}

export function errorCallback(message: string) {
  const search = new URLSearchParams({
    status: "error",
    code: "401",
    message,
  });
  return `mtcost://auth/callback?${search.toString()}`;
}
