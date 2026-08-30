import { createPlayerSession } from "../index";
import type {
  AccountSnapshot,
  Clock,
  CustomTab,
  CustomTabResult,
  LestaClient,
  PlayerSession,
  Screen,
  VehiclePrice,
} from "../index";

export const APPLICATION_ID = "test-application-id";

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
    hangarTankIds: [],
    rented: [],
  };
  vehicles: VehiclePrice[] | Error = [];
  accountGate: Promise<void> = Promise.resolve();

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
}

type AccountOrError = AccountSnapshot | Error;

export function createHarness() {
  const clock = new FakeClock();
  const customTab = new FakeCustomTab();
  const lesta = new FakeLesta();
  const session = createPlayerSession({
    clock,
    customTab,
    lesta,
    config: { applicationId: APPLICATION_ID },
  });
  return { session, clock, customTab, lesta };
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
} = {}) {
  const search = new URLSearchParams({
    status: "ok",
    access_token: params.accessToken ?? "live-token",
    expires_at: String(params.expiresAt ?? 1_700_000_000 + 14 * 24 * 3600),
    account_id: String(params.accountId ?? 42),
    nickname: "Player",
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
