import {
  LESTA_API_ORIGIN,
  type AccountSnapshot,
  type BoosterPrice,
  type LestaClient,
  type OwnedBooster,
  type RentedTank,
  type VehiclePrice,
} from "../packages/player-session";

type LestaJson = {
  status?: string;
  data?: unknown;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

function parseRented(raw: unknown): RentedTank[] {
  if (raw == null) return [];
  const record = Array.isArray(raw)
    ? null
    : asRecord(raw);
  const rows = Array.isArray(raw)
    ? raw
    : record
      ? Object.values(record)
      : [raw];
  const tanks: RentedTank[] = [];
  for (const row of rows) {
    const record = asRecord(row);
    if (!record) continue;
    const tankId = Number(record.tank_id);
    if (!Number.isFinite(tankId)) continue;
    tanks.push({
      tankId,
      compensationSilver: Number(record.compensation_credits ?? 0),
      compensationGold: Number(record.compensation_gold ?? 0),
    });
  }
  return tanks;
}

function parseBoosters(raw: unknown): OwnedBooster[] {
  const record = asRecord(raw);
  if (!record) return [];
  const keys = Object.keys(record);
  if (
    keys.length > 0 &&
    keys.every((key) =>
      ["count", "expiration_time", "state"].includes(key),
    )
  ) {
    return [];
  }
  const boosters: OwnedBooster[] = [];
  for (const [key, row] of Object.entries(record)) {
    const item = asRecord(row);
    if (!item) continue;
    const boosterId = Number(item.booster_id ?? key);
    if (!Number.isFinite(boosterId)) continue;
    boosters.push({
      boosterId,
      count: Number(item.count ?? 0),
      state: String(item.state ?? ""),
    });
  }
  return boosters.sort((a, b) => a.boosterId - b.boosterId);
}

function numericOrNull(value: unknown): number | null {
  if (value == null) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export function createHttpLesta(deps: {
  applicationId: string;
  fetch: typeof fetch;
  origin?: string;
}): LestaClient {
  const origin = deps.origin ?? LESTA_API_ORIGIN;
  async function getJson(
    path: string,
    params: Record<string, string>,
  ): Promise<LestaJson> {
    const url = new URL(path, `${origin}/`);
    url.searchParams.set("application_id", deps.applicationId);
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }
    const response = await deps.fetch(url.toString());
    if (!response.ok) throw new Error("lesta-http");
    return (await response.json()) as LestaJson;
  }

  return {
    async logout(accessToken) {
      try {
        await getJson("/wot/auth/logout/", { access_token: accessToken });
      } catch {
        // Local sign-out already forgot the token.
      }
    },

    async prolongate(accessToken) {
      try {
        const body = await getJson("/wot/auth/prolongate/", {
          access_token: accessToken,
        });
        const data = asRecord(body.data);
        const nextToken = data?.access_token;
        const expiresAt = Number(data?.expires_at);
        if (
          body.status !== "ok" ||
          typeof nextToken !== "string" ||
          !Number.isFinite(expiresAt)
        ) {
          return "failed";
        }
        return { accessToken: nextToken, expiresAt };
      } catch {
        return "failed";
      }
    },

    async fetchAccount(accessToken, accountId): Promise<AccountSnapshot> {
      const body = await getJson("/wot/account/info/", {
        access_token: accessToken,
        account_id: String(accountId),
        extra: "private.garage,private.rented,private.boosters",
      });
      const accounts = asRecord(body.data);
      const account = asRecord(accounts?.[String(accountId)]);
      const privateBlock = asRecord(account?.private);
      if (body.status !== "ok" || !privateBlock) throw new Error("account");
      const hangar = Array.isArray(privateBlock.garage)
        ? privateBlock.garage.map((id) => Number(id)).filter(Number.isFinite)
        : [];
      return {
        silver: Number(privateBlock.credits ?? 0),
        gold: Number(privateBlock.gold ?? 0),
        bonds: Number(privateBlock.bonds ?? 0),
        freeXp: Number(privateBlock.free_xp ?? 0),
        premiumExpiresAt: numericOrNull(privateBlock.premium_expires_at),
        hangarTankIds: hangar,
        rented: parseRented(privateBlock.rented),
        boosters: parseBoosters(privateBlock.boosters),
      };
    },

    async fetchVehiclePrices(tankIds): Promise<VehiclePrice[]> {
      const prices: VehiclePrice[] = [];
      for (let i = 0; i < tankIds.length; i += 100) {
        const chunk = tankIds.slice(i, i + 100);
        const body = await getJson("/wot/encyclopedia/vehicles/", {
          tank_id: chunk.join(","),
          fields: "tank_id,price_credit,price_gold,tier,is_premium,is_gift",
        });
        const data = asRecord(body.data);
        if (body.status !== "ok" || !data) throw new Error("vehicles");
        for (const vehicle of Object.values(data)) {
          const record = asRecord(vehicle);
          if (!record) continue;
          const tankId = Number(record.tank_id);
          if (!Number.isFinite(tankId)) continue;
          prices.push({
            tankId,
            priceSilver: numericOrNull(record.price_credit),
            priceGold: numericOrNull(record.price_gold),
            tier: numericOrNull(record.tier),
            isPremium: record.is_premium === true,
            isGift: record.is_gift === true,
          });
        }
      }
      return prices;
    },

    async fetchBoosterPrices(): Promise<BoosterPrice[]> {
      const body = await getJson("/wot/encyclopedia/boosters/", {
        fields: "booster_id,price_gold,resource,lifetime,description",
      });
      const data = asRecord(body.data);
      if (body.status !== "ok" || !data) throw new Error("boosters");
      const prices: BoosterPrice[] = [];
      for (const booster of Object.values(data)) {
        const record = asRecord(booster);
        if (!record) continue;
        const boosterId = Number(record.booster_id);
        if (!Number.isFinite(boosterId)) continue;
        prices.push({
          boosterId,
          priceGold: numericOrNull(record.price_gold),
          resource: typeof record.resource === "string" ? record.resource : null,
          lifetime: numericOrNull(record.lifetime),
          description:
            typeof record.description === "string" ? record.description : null,
        });
      }
      return prices;
    },

    async fetchClanTag(accountId): Promise<string | null> {
      const body = await getJson("/wot/clans/accountinfo/", {
        account_id: String(accountId),
        fields: "clan.tag",
      });
      const accounts = asRecord(body.data);
      const row = accounts?.[String(accountId)];
      if (body.status !== "ok" || accounts == null) throw new Error("clan");
      if (row == null) return null;
      const record = asRecord(row);
      const clan = asRecord(record?.clan);
      const tag = clan?.tag;
      return typeof tag === "string" && tag.length > 0 ? tag : null;
    },
  };
}
