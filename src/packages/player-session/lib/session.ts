import {
  copy,
  encyclopediaLanguage,
  isLanguageId,
  LANGUAGES,
  type LanguageId,
} from "./copy";
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
      title: string;
      subtitle: string;
      signInLabel: string;
      settingsLabel: string;
    }
  | {
      kind: "choose-realm";
      kicker: string;
      title: string;
      backLabel: string;
      settingsLabel: string;
      realms: { key: Realm; selected: boolean }[];
    }
  | {
      kind: "valuation";
      signOutLabel: string;
      retryLabel: string | null;
      settingsLabel: string;
      kicker: string;
      symbol: string;
      snapshot: ValuationSnapshot;
    }
  | {
      kind: "settings";
      title: string;
      backLabel: string;
      languages: { id: LanguageId; native: string; selected: boolean }[];
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
  fetchVehiclePrices(tankIds: number[], language?: string): Promise<VehiclePrice[]>;
  fetchBoosterPrices(language?: string): Promise<BoosterPrice[]>;
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
  openSettings(): void;
  closeSettings(): void;
  setLanguage(id: LanguageId): void;
  signOut(): Promise<void>;
  retry(): Promise<void>;
  onForeground(): Promise<void>;
};

function signedOutScreen(language: LanguageId): Screen {
  const text = copy(language);
  return {
    kind: "signed-out",
    title: text.title,
    subtitle: text.subtitle,
    signInLabel: text.signIn,
    settingsLabel: text.settings,
  };
}

function chooseRealmScreen(selected: Realm | null, language: LanguageId): Screen {
  const text = copy(language);
  return {
    kind: "choose-realm",
    kicker: text.realmKicker,
    title: text.realmTitle,
    backLabel: text.back,
    settingsLabel: text.settings,
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
  language?: LanguageId;
  onLanguageChange?: (language: LanguageId) => void;
}): PlayerSession {
  const listeners = new Set<() => void>();
  let language: LanguageId = deps.language ?? "ru";
  let settingsOpen = false;
  let underlying: Screen = signedOutScreen(language);
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

  function visible(): Screen {
    if (!settingsOpen) return underlying;
    const text = copy(language);
    return {
      kind: "settings",
      title: text.settings,
      backLabel: text.back,
      languages: LANGUAGES.map((item) => ({
        id: item.id,
        native: item.native,
        selected: item.id === language,
      })),
    };
  }

  function emit() {
    for (const listener of listeners) listener();
  }

  function show(next: Screen) {
    underlying = next;
    emit();
  }

  function forgetAuth() {
    collectGeneration += 1;
    auth = null;
    clanTag = null;
    selectedRealm = null;
    client = null;
    settingsOpen = false;
    show(signedOutScreen(language));
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
    retryLabel: string | null,
  ): Screen {
    const text = copy(language);
    return {
      kind: "valuation",
      signOutLabel: text.signOut,
      retryLabel,
      settingsLabel: text.settings,
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
      if (underlying.kind === "valuation") {
        show({ ...underlying, kicker: kicker() });
      }
    } catch {
      // Missing tag stays the nick; clan failure is not a failed Оценка.
    }
  }

  async function collect() {
    const current = auth;
    const currentClient = client;
    if (!current || !currentClient) return;
    const generation = ++collectGeneration;
    const catalogLanguage = encyclopediaLanguage(language);
    show(withValuation({ kind: "waiting" }, null));
    if (!(await refreshAuth())) return;
    if (generation !== collectGeneration || !auth) return;
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
          : await currentClient.fetchVehiclePrices(tankIds, catalogLanguage);
      if (generation !== collectGeneration || !auth) return;
      const ownedBoosters = (account.boosters ?? []).filter(
        (row) => row.state !== "USED" && row.count > 0,
      );
      const boosterPrices =
        ownedBoosters.length === 0
          ? []
          : await currentClient.fetchBoosterPrices(catalogLanguage);
      if (generation !== collectGeneration || !auth) return;
      const valued = valueAccount(
        account,
        tankIds,
        prices,
        boosterPrices,
        valuationRates(),
        deps.clock.nowUnixSeconds,
        copy(language).rows,
      );
      show(
        withValuation(
          {
            kind: "numbers",
            heroAmount: valued.heroAmount,
            rows: valued.rows,
          },
          copy(language).retry,
        ),
      );
    } catch {
      if (generation !== collectGeneration || !auth) return;
      show(withValuation({ kind: "dashes" }, copy(language).retry));
    }
  }

  return {
    screen: () => visible(),
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    signIn() {
      if (auth || underlying.kind !== "signed-out") return;
      selectedRealm = null;
      show(chooseRealmScreen(null, language));
    },
    async chooseRealm(key) {
      if (underlying.kind !== "choose-realm") return;
      if (!REALM_KEYS.includes(key)) return;
      selectedRealm = key;
      show(chooseRealmScreen(key, language));
      const result = await deps.customTab.open(
        openIdLoginUrl(WG_API_ORIGINS[key], deps.config.wgApplicationId),
      );
      if (result.type !== "success") return;
      const parsed = parseCallback(result.url);
      if (parsed === "rejected") return;
      beginLive(parsed, key);
    },
    backFromRealm() {
      if (underlying.kind !== "choose-realm") return;
      selectedRealm = null;
      show(signedOutScreen(language));
    },
    openSettings() {
      if (settingsOpen) return;
      settingsOpen = true;
      emit();
    },
    closeSettings() {
      if (!settingsOpen) return;
      settingsOpen = false;
      emit();
    },
    setLanguage(id) {
      if (!isLanguageId(id) || id === language) return;
      language = id;
      deps.onLanguageChange?.(id);
      if (underlying.kind === "signed-out") {
        show(signedOutScreen(language));
        return;
      }
      if (underlying.kind === "choose-realm") {
        show(chooseRealmScreen(selectedRealm, language));
        return;
      }
      if (underlying.kind === "valuation" && underlying.snapshot.kind === "dashes") {
        show(withValuation(underlying.snapshot, copy(language).retry));
        return;
      }
      if (underlying.kind === "valuation") {
        void collect();
      }
    },
    async signOut() {
      const token = auth?.accessToken;
      const toLogout = client;
      forgetAuth();
      if (token && toLogout) await toLogout.logout(token);
    },
    async retry() {
      if (!auth) return;
      if (underlying.kind === "valuation" && underlying.snapshot.kind === "waiting") {
        return;
      }
      await collect();
    },
    async onForeground() {
      await refreshAuth();
    },
  };
}
