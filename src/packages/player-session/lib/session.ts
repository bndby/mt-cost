import { uniqueTankIds, valueAccount } from "./valuation";

export const OPEN_ID_REDIRECT_URI =
  "https://bndby.github.io/mt-cost/auth/callback";
export const CUSTOM_SCHEME_CALLBACK = "mtcost://auth/callback";
export const LESTA_API_ORIGIN = "https://api.tanki.su";

export type Screen =
  | {
      kind: "signed-out";
      title: "Оценка";
      subtitle: "Имущество аккаунта Мира танков в рублях.";
      signInLabel: "Войти через Lesta";
    }
  | {
      kind: "valuation";
      signOutLabel: "Выйти";
      retryLabel: "Повторить" | null;
      heroLabel: "Оценка";
      tanksLabel: "Танки";
      tanksRubLabel: "Танки, ₽";
      otherLabel: "Прочее имущество";
      slots:
        | { kind: "waiting" }
        | {
            kind: "numbers";
            tankCount: number;
            tanksRub: number;
            otherRub: number;
            sumRub: number;
          }
        | { kind: "dashes" };
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
};

export type PlayerSessionConfig = {
  applicationId: string;
};

export type PlayerSession = {
  screen(): Screen;
  subscribe(listener: () => void): () => void;
  signIn(): Promise<void>;
  signOut(): Promise<void>;
  retry(): Promise<void>;
  onForeground(): Promise<void>;
};

const SIGNED_OUT: Screen = {
  kind: "signed-out",
  title: "Оценка",
  subtitle: "Имущество аккаунта Мира танков в рублях.",
  signInLabel: "Войти через Lesta",
};

function waitingValuation(): Extract<Screen, { kind: "valuation" }> {
  return {
    kind: "valuation",
    signOutLabel: "Выйти",
    retryLabel: null,
    heroLabel: "Оценка",
    tanksLabel: "Танки",
    tanksRubLabel: "Танки, ₽",
    otherLabel: "Прочее имущество",
    slots: { kind: "waiting" },
  };
}

type LiveAuth = {
  accessToken: string;
  expiresAt: number;
  accountId: number;
};

function parseCallback(url: string): LiveAuth | "rejected" {
  const parsed = new URL(url);
  const status = parsed.searchParams.get("status");
  const message = parsed.searchParams.get("message") ?? "";
  if (status === "error" || message.startsWith("AUTH_")) return "rejected";
  const accessToken = parsed.searchParams.get("access_token");
  const expiresAt = Number(parsed.searchParams.get("expires_at"));
  const accountId = Number(parsed.searchParams.get("account_id"));
  if (!accessToken || !Number.isFinite(expiresAt) || !Number.isFinite(accountId)) {
    return "rejected";
  }
  return { accessToken, expiresAt, accountId };
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
  let collectGeneration = 0;

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
    show(SIGNED_OUT);
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
    slots: Extract<Screen, { kind: "valuation" }>["slots"],
    retryLabel: "Повторить" | null,
  ): Screen {
    return { ...waitingValuation(), slots, retryLabel };
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
      show(
        withValuation(
          { kind: "numbers", ...valueAccount(account, tankIds, prices) },
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
    },
    async signOut() {
      const token = auth?.accessToken;
      forgetAuth();
      if (token) await deps.lesta.logout(token);
    },
    async retry() {
      if (!auth) return;
      if (screen.kind === "valuation" && screen.slots.kind === "waiting") return;
      await collect();
    },
    async onForeground() {
      await refreshAuth();
    },
  };
}
