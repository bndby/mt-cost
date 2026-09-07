import { uniqueTankIds, valueAccount } from "./valuation";

export const OPEN_ID_REDIRECT_URI =
  "https://bndby.github.io/mt-cost/auth/callback";
export const CUSTOM_SCHEME_CALLBACK = "mtcost://auth/callback";
export const LESTA_API_ORIGIN = "https://api.tanki.su";
export const WG_API_ORIGINS = {
  NA: "https://api.worldoftanks.com",
  EU: "https://api.worldoftanks.eu",
  ASIA: "https://api.worldoftanks.asia",
} as const;
export type Realm = keyof typeof WG_API_ORIGINS;
const REALM_KEYS = Object.keys(WG_API_ORIGINS) as Realm[];

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
      subtitle: "Имущество танкового аккаунта.";
      signInLabel: "Войти через Lesta";
      wgSignInLabel: "Войти через WG";
    }
  | {
      kind: "choose-realm";
      kicker: "Войти через WG";
      title: "Выберите Реалм";
      backLabel: "Назад";
      realms: { key: Realm; selected: boolean }[];
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
  wgApplicationId: string;
  silverPerGold: number;
  goldPackGold: number;
  goldPackRubles: number;
  goldPerBond: number;
  wgSilverPerGold: number;
  wgGoldPackGold: number;
  wgGoldPackUsd: number;
  wgGoldPerBond: number;
  rubPerByn: number;
  rubPerUsd: number;
};

export type PlayerSession = {
  screen(): Screen;
  subscribe(listener: () => void): () => void;
  signIn(): Promise<void>;
  startWgSignIn(): void;
  chooseRealm(key: Realm): Promise<void>;
  backFromRealm(): void;
  signOut(): Promise<void>;
  retry(): Promise<void>;
  onForeground(): Promise<void>;
  chooseDisplayCurrency(label: string): void;
};

const SIGNED_OUT: Screen = {
  kind: "signed-out",
  title: "Оценка",
  subtitle: "Имущество танкового аккаунта.",
  signInLabel: "Войти через Lesta",
  wgSignInLabel: "Войти через WG",
};

function chooseRealmScreen(selected: Realm | null): Screen {
  return {
    kind: "choose-realm",
    kicker: "Войти через WG",
    title: "Выберите Реалм",
    backLabel: "Назад",
    realms: REALM_KEYS.map((key) => ({
      key,
      selected: key === selected,
    })),
  };
}

type CallbackAuth = {
  accessToken: string;
  expiresAt: number;
  accountId: number;
  nick: string;
};

type LiveAuth = CallbackAuth & {
  source: "lesta" | "wg";
  realm: Realm | null;
};

function parseCallback(url: string): CallbackAuth | "rejected" {
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

function openIdLoginUrl(origin: string, applicationId: string): string {
  const login = new URL(`${origin}/wot/auth/login/`);
  login.searchParams.set("application_id", applicationId);
  login.searchParams.set("redirect_uri", OPEN_ID_REDIRECT_URI);
  login.searchParams.set("display", "page");
  return login.toString();
}

function formatKicker(
  nick: string,
  clanTag: string | null,
  realm: Realm | null,
): string {
  const who = clanTag ? `[${clanTag}] ${nick}` : nick;
  return realm ? `[${realm}] ${who}` : who;
}

export function createPlayerSession(deps: {
  customTab: CustomTab;
  lesta: LestaClient;
  wgForRealm: (realm: Realm) => LestaClient;
  clock: Clock;
  config: PlayerSessionConfig;
}): PlayerSession {
  const listeners = new Set<() => void>();
  let screen: Screen = SIGNED_OUT;
  let auth: LiveAuth | null = null;
  let clanTag: string | null = null;
  let selectedRealm: Realm | null = null;
  let client: LestaClient = deps.lesta;
  let collectGeneration = 0;
  const RUB_LABEL = "рос. рубль";
  const USD_LABEL = "доллар";
  let displayLabel = RUB_LABEL;
  let collected: {
    heroAmount: number;
    rows: ColumnRow[];
  } | null = null;

  function displayMoneys() {
    const rub = { label: RUB_LABEL, symbol: "₽", rubPerUnit: 1 };
    const byn = {
      label: "бел. рубль",
      symbol: "Br",
      rubPerUnit: deps.config.rubPerByn,
    };
    const usd = {
      label: USD_LABEL,
      symbol: "$",
      rubPerUnit: deps.config.rubPerUsd,
    };
    if (auth?.source === "wg") return [usd, rub, byn];
    return [rub, byn, usd];
  }

  function valuationRates() {
    if (auth?.source === "wg") {
      return {
        silverPerGold: deps.config.wgSilverPerGold,
        goldPackGold: deps.config.wgGoldPackGold,
        goldPackRubles: deps.config.wgGoldPackUsd,
        goldPerBond: deps.config.wgGoldPerBond,
      };
    }
    return {
      silverPerGold: deps.config.silverPerGold,
      goldPackGold: deps.config.goldPackGold,
      goldPackRubles: deps.config.goldPackRubles,
      goldPerBond: deps.config.goldPerBond,
    };
  }

  function selectedMoney() {
    return (
      displayMoneys().find((item) => item.label === displayLabel) ??
      displayMoneys()[0]
    );
  }

  function numbersSnapshot(
    heroAmount: number,
    rows: ColumnRow[],
  ): Extract<ValuationSnapshot, { kind: "numbers" }> {
    const selected = selectedMoney();
    const convert = (amount: number) => {
      if (auth?.source === "wg") {
        if (selected.label === USD_LABEL) return amount;
        return (amount * deps.config.rubPerUsd) / selected.rubPerUnit;
      }
      return amount / selected.rubPerUnit;
    };
    return {
      kind: "numbers",
      heroAmount: convert(heroAmount),
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
    selectedRealm = null;
    collected = null;
    displayLabel = RUB_LABEL;
    client = deps.lesta;
    show(SIGNED_OUT);
  }

  function kicker(): string {
    return auth ? formatKicker(auth.nick, clanTag, auth.realm) : "";
  }

  function beginLive(
    parsed: CallbackAuth,
    source: "lesta" | "wg",
    realm: Realm | null,
  ) {
    auth = { ...parsed, source, realm };
    displayLabel = source === "wg" ? USD_LABEL : RUB_LABEL;
    client = source === "wg" && realm ? deps.wgForRealm(realm) : deps.lesta;
    void collect();
    void loadClanTag();
  }

  async function refreshAuth(): Promise<boolean> {
    if (!auth) return false;
    if (deps.clock.nowUnixSeconds < auth.expiresAt) return true;
    const prolonged = await client.prolongate(auth.accessToken);
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
      const tag = await client.fetchClanTag(current.accountId);
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
      const account = await client.fetchAccount(
        current.accessToken,
        current.accountId,
      );
      if (generation !== collectGeneration || !auth) return;
      const tankIds = uniqueTankIds(account.hangarTankIds, account.rented);
      const prices =
        tankIds.length === 0
          ? []
          : await client.fetchVehiclePrices(tankIds);
      if (generation !== collectGeneration || !auth) return;
      const valued = valueAccount(account, tankIds, prices, valuationRates());
      collected = {
        heroAmount: valued.heroAmount,
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
      if (auth || screen.kind !== "signed-out") return;
      const result = await deps.customTab.open(
        openIdLoginUrl(LESTA_API_ORIGIN, deps.config.applicationId),
      );
      if (result.type !== "success") return;
      const parsed = parseCallback(result.url);
      if (parsed === "rejected") return;
      beginLive(parsed, "lesta", null);
    },
    startWgSignIn() {
      if (auth || screen.kind !== "signed-out") return;
      selectedRealm = null;
      show(chooseRealmScreen(null));
    },
    async chooseRealm(key) {
      if (screen.kind !== "choose-realm") return;
      if (!REALM_KEYS.includes(key)) return;
      selectedRealm = key;
      show(chooseRealmScreen(key));
      const result = await deps.customTab.open(
        openIdLoginUrl(WG_API_ORIGINS[key], deps.config.wgApplicationId),
      );
      if (result.type !== "success") return;
      const parsed = parseCallback(result.url);
      if (parsed === "rejected") return;
      beginLive(parsed, "wg", key);
    },
    backFromRealm() {
      if (screen.kind !== "choose-realm") return;
      selectedRealm = null;
      show(SIGNED_OUT);
    },
    async signOut() {
      const token = auth?.accessToken;
      const toLogout = client;
      forgetAuth();
      if (token) await toLogout.logout(token);
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
        collected
      ) {
        show(
          withValuation(
            numbersSnapshot(collected.heroAmount, collected.rows),
            screen.retryLabel,
          ),
        );
      }
    },
  };
}
