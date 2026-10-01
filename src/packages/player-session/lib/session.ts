import {
  WG_PREMIUM_PACKAGES,
  uniqueTankIds,
  valueAccount,
} from "./valuation";

export const OPEN_ID_REDIRECT_URI =
  "https://bndby.github.io/mt-cost/auth/callback";
export const CUSTOM_SCHEME_CALLBACK = "mtcost://auth/callback";
export const WG_API_ORIGINS = {
  NA: "https://api.worldoftanks.com",
  EU: "https://api.worldoftanks.eu",
  ASIA: "https://api.worldoftanks.asia",
} as const;
export type Realm = keyof typeof WG_API_ORIGINS;
const REALM_KEYS = Object.keys(WG_API_ORIGINS) as Realm[];

const REALM_SYMBOL: Record<Realm, string> = {
  NA: "$",
  EU: "€",
  ASIA: "¥",
};

export type ColumnRow = {
  line:
    | "bonds"
    | "gold"
    | "silver"
    | "freeXp"
    | "boosters"
    | "premium"
    | "premiumAccount"
    | "researchable";
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
    };

export type Screen =
  | {
      kind: "signed-out";
      title: "Оценка";
      subtitle: "Имущество танкового аккаунта.";
      signInLabel: "Войти";
    }
  | {
      kind: "choose-realm";
      kicker: "Войти";
      title: "Выберите Реалм";
      backLabel: "Назад";
      realms: { key: Realm; selected: boolean }[];
    }
  | {
      kind: "valuation";
      signOutLabel: "Выйти";
      retryLabel: "Повторить" | null;
      kicker: string;
      symbol: string;
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

export type OwnedBooster = {
  boosterId: number;
  count: number;
  state: string;
};

export type AccountSnapshot = {
  silver: number;
  gold: number;
  bonds: number;
  freeXp?: number;
  premiumExpiresAt?: number | null;
  hangarTankIds: number[];
  rented: RentedTank[];
  boosters?: OwnedBooster[];
};

export type VehiclePrice = {
  tankId: number;
  priceSilver: number | null;
  priceGold: number | null;
  tier?: number | null;
  isPremium?: boolean;
  isGift?: boolean;
};

export type BoosterPrice = {
  boosterId: number;
  priceGold: number | null;
  resource?: string | null;
  lifetime?: number | null;
  description?: string | null;
};

export type WgClient = {
  logout(accessToken: string): Promise<void>;
  prolongate(
    accessToken: string,
  ): Promise<{ accessToken: string; expiresAt: number } | "failed">;
  fetchAccount(
    accessToken: string,
    accountId: number,
  ): Promise<AccountSnapshot>;
  fetchVehiclePrices(tankIds: number[]): Promise<VehiclePrice[]>;
  fetchBoosterPrices(): Promise<BoosterPrice[]>;
  fetchClanTag(accountId: number): Promise<string | null>;
};

export type GoldPack = {
  gold: number;
  money: number;
};

export type PlayerSessionConfig = {
  wgApplicationId: string;
  silverPerGold: number;
  goldPerBond: number;
  freeXpPerGold: number;
  goldPacks: Record<Realm, GoldPack>;
};

export type PlayerSession = {
  screen(): Screen;
  subscribe(listener: () => void): () => void;
  signIn(): void;
  chooseRealm(key: Realm): Promise<void>;
  backFromRealm(): void;
  signOut(): Promise<void>;
  retry(): Promise<void>;
  onForeground(): Promise<void>;
};

const SIGNED_OUT: Screen = {
  kind: "signed-out",
  title: "Оценка",
  subtitle: "Имущество танкового аккаунта.",
  signInLabel: "Войти",
};

function chooseRealmScreen(selected: Realm | null): Screen {
  return {
    kind: "choose-realm",
    kicker: "Войти",
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
  realm: Realm;
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

function formatKicker(nick: string, clanTag: string | null, realm: Realm): string {
  const who = clanTag ? `[${clanTag}] ${nick}` : nick;
  return `[${realm}] ${who}`;
}

export function createPlayerSession(deps: {
  customTab: CustomTab;
  wgForRealm: (realm: Realm) => WgClient;
  clock: Clock;
  config: PlayerSessionConfig;
}): PlayerSession {
  const listeners = new Set<() => void>();
  let screen: Screen = SIGNED_OUT;
  let auth: LiveAuth | null = null;
  let clanTag: string | null = null;
  let selectedRealm: Realm | null = null;
  let client: WgClient | null = null;
  let collectGeneration = 0;

  function valuationRates() {
    const realm = auth?.realm ?? "EU";
    const pack = deps.config.goldPacks[realm];
    return {
      silverPerGold: deps.config.silverPerGold,
      goldPackGold: pack.gold,
      goldPackMoney: pack.money,
      goldPerBond: deps.config.goldPerBond,
      freeXpPerGold: deps.config.freeXpPerGold,
      premiumPackages: WG_PREMIUM_PACKAGES,
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
    client = null;
    show(SIGNED_OUT);
  }

  function kicker(): string {
    return auth ? formatKicker(auth.nick, clanTag, auth.realm) : "";
  }

  function beginLive(parsed: CallbackAuth, realm: Realm) {
    auth = { ...parsed, realm };
    client = deps.wgForRealm(realm);
    void collect();
    void loadClanTag();
  }

  async function refreshAuth(): Promise<boolean> {
    if (!auth || !client) return false;
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
      symbol: auth ? REALM_SYMBOL[auth.realm] : "€",
      snapshot,
    };
  }

  async function loadClanTag() {
    const current = auth;
    const currentClient = client;
    if (!current || !currentClient) return;
    try {
      const tag = await currentClient.fetchClanTag(current.accountId);
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
    const currentClient = client;
    if (!current || !currentClient) return;
    const generation = ++collectGeneration;
    show(withValuation({ kind: "waiting" }, null));
    try {
      const account = await currentClient.fetchAccount(
        current.accessToken,
        current.accountId,
      );
      if (generation !== collectGeneration || !auth) return;
      const tankIds = uniqueTankIds(account.hangarTankIds, account.rented);
      const prices =
        tankIds.length === 0
          ? []
          : await currentClient.fetchVehiclePrices(tankIds);
      if (generation !== collectGeneration || !auth) return;
      const ownedBoosters = (account.boosters ?? []).filter(
        (row) => row.state !== "USED" && row.count > 0,
      );
      const boosterPrices =
        ownedBoosters.length === 0
          ? []
          : await currentClient.fetchBoosterPrices();
      if (generation !== collectGeneration || !auth) return;
      const valued = valueAccount(
        account,
        tankIds,
        prices,
        boosterPrices,
        valuationRates(),
        deps.clock.nowUnixSeconds,
      );
      show(
        withValuation(
          {
            kind: "numbers",
            heroAmount: valued.heroAmount,
            rows: valued.rows,
          },
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
    signIn() {
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
      beginLive(parsed, key);
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
      if (token && toLogout) await toLogout.logout(token);
    },
    async retry() {
      if (!auth) return;
      if (screen.kind === "valuation" && screen.snapshot.kind === "waiting") return;
      await collect();
    },
    async onForeground() {
      await refreshAuth();
    },
  };
}
