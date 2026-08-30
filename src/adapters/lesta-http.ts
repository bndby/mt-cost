import {
  LESTA_API_ORIGIN,
  type AccountSnapshot,
  type LestaClient,
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

function numericOrNull(value: unknown): number | null {
  if (value == null) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export function createHttpLesta(deps: {
  applicationId: string;
  fetch: typeof fetch;
}): LestaClient {
  async function getJson(
    path: string,
    params: Record<string, string>,
  ): Promise<LestaJson> {
    const url = new URL(path, `${LESTA_API_ORIGIN}/`);
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
        extra: "private.garage,private.rented",
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
        hangarTankIds: hangar,
        rented: parseRented(privateBlock.rented),
      };
    },

    async fetchVehiclePrices(tankIds): Promise<VehiclePrice[]> {
      const prices: VehiclePrice[] = [];
      for (let i = 0; i < tankIds.length; i += 100) {
        const chunk = tankIds.slice(i, i + 100);
        const body = await getJson("/wot/encyclopedia/vehicles/", {
          tank_id: chunk.join(","),
          fields: "tank_id,price_credit,price_gold",
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
          });
        }
      }
      return prices;
    },
  };
}
