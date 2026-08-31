import { uniqueTankIds, valueAccount } from "./valuation";

export const OPEN_ID_REDIRECT_URI =
  "https://bndby.github.io/mt-cost/auth/callback";
export const CUSTOM_SCHEME_CALLBACK = "mtcost://auth/callback";
export const LESTA_API_ORIGIN = "https://api.tanki.su";

export type DisplayChip = {
  label: string;
  symbol: string;
  selected: boolean;
};

export type ColumnRow = {
  name: string;
  count: number;
  amount: number;
};

export type ValuationSnapshot =
  | { kind: "waiting" }
  | { kind: "dashes" }
  | {
      kind: "numbers";
      heroAmount: number;
      rows: ColumnRow[];
      chips: DisplayChip[];
    };

export type Screen =
  | {
      kind: "signed-out";
      title: "Оценка";
      subtitle: "Имущество аккаунта Мира танков.";
      signInLabel: "Войти через Lesta";
    }
  | {
      kind: "valuation";
      signOutLabel: "Выйти";
      retryLabel: "Повторить" | null;
      kicker: string;
      snapshot: ValuationSnapshot;
    };

export type CustomTabResult =
  | { type: "success"; url: string }
  | { type: "dismiss" };

export type CustomTab = {
  open(url: string): Promise<CustomTabResult>;
};

export type Clock = {
  nowUnixSeconds: number;
};

export type RentedTank = {
  tankId: number;
  compensationSilver: number;
  compensationGold: number;
};

export type AccountSnapshot = {
  silver: number;
  gold: number;
  bonds: number;
  hangarTankIds: number[];
  rented: RentedTank[];
};

export type VehiclePrice = {
  tankId: number;
  priceSilver: number | null;
  priceGold: number | null;
};

export type LestaClient = {
  logout(accessToken: string): Promise<void>;
  prolongate(
    accessToken: string,
  ): Promise<{ accessToken: string; expiresAt: number } | "failed">;
  fetchAccount(
    accessToken: string,
    accountId: number,
  ): Promise<AccountSnapshot>;
  fetchVehiclePrices(tankIds: number[]): Promise<VehiclePrice[]>;
  fetchClanTag(accountId: number): Promise<string | null>;
};

export type PlayerSessionConfig = {
  applicationId: string;
  silverPerGold: number;
  goldPackGold: number;
  goldPackRubles: number;
  goldPerBond: number;
  rubPerByn: number;
  rubPerUsd: number;
};

export type PlayerSession = {
  screen(): Screen;
  subscribe(listener: () => void): () => void;
  signIn(): Promise<void>;
  signOut(): Promise<void>;
  retry(): Promise<void>;
  onForeground(): Promise<void>;
  chooseDisplayCurrency(label: string): void;
};

const SIGNED_OUT: Screen = {
  kind: "signed-out",
  title: "Оценка",
  subtitle: "Имущество аккаунта Мира танков.",
  signInLabel: "Войти через Lesta",
};

type LiveAuth = {
  accessToken: string;
  expiresAt: number;
  accountId: number;
  nick: string;
};

function parseCallback(url: string): LiveAuth | "rejected" {
  const parsed = new URL(url);
  const status = parsed.searchParams.get("status");
  const message = parsed.searchParams.get("message") ?? "";
  if (status === "error" || message.startsWith("AUTH_")) return "rejected";
  const accessToken = parsed.searchParams.get("access_token");
  const expiresAt = Number(parsed.searchParams.get("expires_at"));
  const accountId = Number(parsed.searchParams.get("account_id"));
  if (
    !accessToken ||
    !Number.isFinite(expiresAt) ||
    !Number.isFinite(accountId)
  ) {
    return "rejected";
  }
  return {
    accessToken,
    expiresAt,
    accountId,
    nick: parsed.searchParams.get("nickname") ?? "",
  };
}

function formatKicker(nick: string, clanTag: string | null): string {
  return clanTag ? `[${clanTag}] ${nick}` : nick;
}

export function createPlayerSession(deps: {
  customTab: CustomTab;
  lesta: LestaClient;
  clock: Clock;
  config: PlayerSessionConfig;
}): PlayerSession {
  const listeners = new Set<() => void>();
  let screen: Screen = SIGNED_OUT;
  let auth: LiveAuth | null = null;
  let clanTag: string | null = null;
  let collectGeneration = 0;
  const RUB_LABEL = "рос. рубль";
  let displayLabel = RUB_LABEL;
  let collectedRubles: {
    heroRubles: number;
    rows: ColumnRow[];
  } | null = null;

  function displayMoneys() {
    return [
      { label: RUB_LABEL, symbol: "₽", rubPerUnit: 1 },
      { label: "бел. рубль", symbol: "Br", rubPerUnit: deps.config.rubPerByn },
      { label: "доллар", symbol: "$", rubPerUnit: deps.config.rubPerUsd },
    ];
  }

  function selectedMoney() {
    return (
      displayMoneys().find((item) => item.label === displayLabel) ??
      displayMoneys()[0]
    );
  }

  function numbersSnapshot(
    heroRubles: number,
    rows: ColumnRow[],
  ): Extract<ValuationSnapshot, { kind: "numbers" }> {
    const selected = selectedMoney();
    const convert = (rubles: number) => rubles / selected.rubPerUnit;
    return {
      kind: "numbers",
      heroAmount: convert(heroRubles),
      rows: rows.map((row) => ({
        name: row.name,
        count: row.count,
        amount: convert(row.amount),
      })),
      chips: displayMoneys().map((item) => ({
        label: item.label,
        symbol: item.symbol,
        selected: item.label === selected.label,
      })),
    };
  }

  function emit() {
    for (const listener of listeners) listener();
  }

  function show(next: Screen) {
    screen = next;
    emit();
  }

  function forgetAuth() {
    collectGeneration += 1;
    auth = null;
    clanTag = null;
    collectedRubles = null;
    displayLabel = RUB_LABEL;
    show(SIGNED_OUT);
  }

  function kicker(): string {
    return auth ? formatKicker(auth.nick, clanTag) : "";
  }

  async function refreshAuth(): Promise<boolean> {
    if (!auth) return false;
    if (deps.clock.nowUnixSeconds < auth.expiresAt) return true;
    const prolonged = await deps.lesta.prolongate(auth.accessToken);
    if (prolonged === "failed") {
      forgetAuth();
      return false;
    }
    auth = {
      ...auth,
      accessToken: prolonged.accessToken,
      expiresAt: prolonged.expiresAt,
    };
    return true;
  }

  function withValuation(
    snapshot: ValuationSnapshot,
    retryLabel: "Повторить" | null,
  ): Screen {
    return {
      kind: "valuation",
      signOutLabel: "Выйти",
      retryLabel,
      kicker: kicker(),
      snapshot,
    };
  }

  async function loadClanTag() {
    const current = auth;
    if (!current) return;
    try {
      const tag = await deps.lesta.fetchClanTag(current.accountId);
      if (!auth || auth.accountId !== current.accountId) return;
      clanTag = tag;
      if (screen.kind === "valuation") {
        show({ ...screen, kicker: kicker() });
      }
    } catch {
      // Missing tag stays the nick; clan failure is not a failed Оценка.
    }
  }

  async function collect() {
    if (!(await refreshAuth())) return;
    const current = auth;
    if (!current) return;
    const generation = ++collectGeneration;
    show(withValuation({ kind: "waiting" }, null));
    try {
      const account = await deps.lesta.fetchAccount(
        current.accessToken,
        current.accountId,
      );
      if (generation !== collectGeneration || !auth) return;
      const tankIds = uniqueTankIds(account.hangarTankIds, account.rented);
      const prices =
        tankIds.length === 0
          ? []
          : await deps.lesta.fetchVehiclePrices(tankIds);
      if (generation !== collectGeneration || !auth) return;
      const valued = valueAccount(account, tankIds, prices, deps.config);
      collectedRubles = {
        heroRubles: valued.heroAmount,
        rows: valued.rows,
      };
      show(
        withValuation(
          numbersSnapshot(valued.heroAmount, valued.rows),
          "Повторить",
        ),
      );
    } catch {
      if (generation !== collectGeneration || !auth) return;
      show(withValuation({ kind: "dashes" }, "Повторить"));
    }
  }

  return {
    screen: () => screen,
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    async signIn() {
      if (auth) return;
      const login = new URL(`${LESTA_API_ORIGIN}/wot/auth/login/`);
      login.searchParams.set("application_id", deps.config.applicationId);
      login.searchParams.set("redirect_uri", OPEN_ID_REDIRECT_URI);
      login.searchParams.set("display", "page");
      const result = await deps.customTab.open(login.toString());
      if (result.type !== "success") return;
      const parsed = parseCallback(result.url);
      if (parsed === "rejected") return;
      auth = parsed;
      void collect();
      void loadClanTag();
    },
    async signOut() {
      const token = auth?.accessToken;
      forgetAuth();
      if (token) await deps.lesta.logout(token);
    },
    async retry() {
      if (!auth) return;
      if (screen.kind === "valuation" && screen.snapshot.kind === "waiting") return;
      await collect();
    },
    async onForeground() {
      await refreshAuth();
    },
    chooseDisplayCurrency(label) {
      if (!displayMoneys().some((item) => item.label === label)) return;
      displayLabel = label;
      if (
        screen.kind === "valuation" &&
        screen.snapshot.kind === "numbers" &&
        collectedRubles
      ) {
        show(
          withValuation(
            numbersSnapshot(collectedRubles.heroRubles, collectedRubles.rows),
            screen.retryLabel,
          ),
        );
      }
    },
  };
}
