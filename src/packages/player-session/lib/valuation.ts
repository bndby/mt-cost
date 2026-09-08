import type {
  AccountSnapshot,
  BoosterPrice,
  ColumnRow,
  OwnedBooster,
  PlayerSessionConfig,
  RentedTank,
  VehiclePrice,
} from "./session";

export type ValuationRates = Pick<
  PlayerSessionConfig,
  | "silverPerGold"
  | "goldPackGold"
  | "goldPackRubles"
  | "goldPerBond"
  | "freeXpPerGold"
> & {
  premiumPackages: readonly { days: number; gold: number }[];
  valueTanksByTechnicalTier: boolean;
  valueBoostersByTechnicalType: boolean;
};

function rublesFromGold(gold: number, rates: ValuationRates): number {
  return (gold * rates.goldPackRubles) / rates.goldPackGold;
}

export const LESTA_PREMIUM_PACKAGES = [
  { days: 30, gold: 2500 },
  { days: 14, gold: 1800 },
  { days: 7, gold: 1250 },
  { days: 3, gold: 650 },
  { days: 1, gold: 250 },
] as const;

export const WG_PREMIUM_PACKAGES = [
  { days: 360, gold: 20_500 },
  { days: 180, gold: 11_900 },
  { days: 90, gold: 6900 },
  { days: 30, gold: 2500 },
  { days: 14, gold: 1800 },
  { days: 7, gold: 1250 },
  { days: 3, gold: 650 },
  { days: 1, gold: 250 },
] as const;

const TANK_TIER_GOLD: Record<number, number> = {
  2: 2500,
  3: 3000,
  4: 3500,
  5: 4500,
  6: 6000,
  7: 8000,
  8: 11_000,
  9: 17_500,
  10: 25_000,
  11: 50_000,
};

function premiumAccountValue(
  premiumExpiresAt: number | null,
  nowUnixSeconds: number,
  packages: ValuationRates["premiumPackages"],
): { days: number; gold: number } {
  if (premiumExpiresAt == null || premiumExpiresAt <= nowUnixSeconds) {
    return { days: 0, gold: 0 };
  }
  let days = Math.ceil((premiumExpiresAt - nowUnixSeconds) / 86400);
  let gold = 0;
  for (const pack of packages) {
    const count = Math.floor(days / pack.days);
    days -= count * pack.days;
    gold += count * pack.gold;
  }
  const totalDays = Math.ceil(
    (premiumExpiresAt - nowUnixSeconds) / 86400,
  );
  return { days: totalDays, gold };
}

export function uniqueTankIds(
  hangarTankIds: number[],
  rented: RentedTank[],
): number[] {
  return [...new Set([...hangarTankIds, ...rented.map((tank) => tank.tankId)])];
}

function pushRow(
  rows: ColumnRow[],
  line: ColumnRow["line"],
  name: string,
  count: number,
  amount: number,
) {
  if (count > 0) rows.push({ line, name, count, amount });
}

function technicalBoosterGold(price: BoosterPrice): number | null {
  if ((price.lifetime ?? 0) !== 3600) return null;
  const desc = price.description ?? "";
  const resource = price.resource ?? "";
  if (resource === "credits" && desc.includes("+50%")) return 250;
  if (resource === "experience" && desc.includes("+100%")) return 150;
  if (resource === "experience" && desc.includes("+50%")) return 100;
  if (resource === "free_xp_and_crew_xp" && desc.includes("+300%")) return 150;
  if (resource === "free_xp_and_crew_xp" && desc.includes("+200%")) return 100;
  return null;
}

function boosterUnitGold(
  owned: OwnedBooster,
  catalog: Map<number, BoosterPrice>,
  useTechnical: boolean,
): number {
  if (owned.state === "USED" || owned.count <= 0) return 0;
  const price = catalog.get(owned.boosterId);
  const apiGold = price?.priceGold ?? 0;
  if (apiGold > 0) return apiGold;
  if (!useTechnical || !price) return 0;
  return technicalBoosterGold(price) ?? 0;
}

function tankGoldAndSilver(
  price: VehiclePrice | undefined,
  useTechnicalTier: boolean,
): { gold: number; silver: number } {
  const catalogGold = price?.priceGold ?? 0;
  const catalogSilver = price?.priceSilver ?? 0;
  if (catalogGold > 0) return { gold: catalogGold, silver: 0 };
  if (catalogSilver > 0) return { gold: 0, silver: catalogSilver };
  if (
    useTechnicalTier &&
    (price?.isPremium || price?.isGift) &&
    price.tier != null
  ) {
    const gold = TANK_TIER_GOLD[price.tier] ?? 0;
    return { gold, silver: 0 };
  }
  return { gold: 0, silver: 0 };
}

export function valueAccount(
  account: AccountSnapshot,
  tankIds: number[],
  prices: VehiclePrice[],
  boosterPrices: BoosterPrice[],
  rates: ValuationRates,
  nowUnixSeconds: number,
): {
  heroAmount: number;
  rows: ColumnRow[];
} {
  const priceById = new Map(prices.map((price) => [price.tankId, price]));
  const boosterById = new Map(
    boosterPrices.map((price) => [price.boosterId, price]),
  );
  let premiumCount = 0;
  let premiumGold = 0;
  let researchableCount = 0;
  let researchableSilver = 0;
  const premiumAccount = premiumAccountValue(
    account.premiumExpiresAt ?? null,
    nowUnixSeconds,
    rates.premiumPackages,
  );
  for (const tankId of tankIds) {
    const valued = tankGoldAndSilver(
      priceById.get(tankId),
      rates.valueTanksByTechnicalTier,
    );
    if (valued.gold > 0) {
      premiumCount += 1;
      premiumGold += valued.gold;
    } else if (valued.silver > 0) {
      researchableCount += 1;
      researchableSilver += valued.silver;
    }
  }

  let boosterCount = 0;
  let boosterGold = 0;
  for (const owned of account.boosters ?? []) {
    const unit = boosterUnitGold(
      owned,
      boosterById,
      rates.valueBoostersByTechnicalType,
    );
    if (unit <= 0) continue;
    boosterCount += owned.count;
    boosterGold += unit * owned.count;
  }

  const freeXp = account.freeXp ?? 0;
  const rows: ColumnRow[] = [];
  pushRow(
    rows,
    "bonds",
    "Боны",
    account.bonds,
    rublesFromGold(account.bonds * rates.goldPerBond, rates),
  );
  pushRow(
    rows,
    "gold",
    "Золото",
    account.gold,
    rublesFromGold(account.gold, rates),
  );
  pushRow(
    rows,
    "silver",
    "Серебро",
    account.silver,
    rublesFromGold(account.silver / rates.silverPerGold, rates),
  );
  pushRow(
    rows,
    "freeXp",
    "Свободный опыт",
    freeXp,
    rublesFromGold(freeXp / rates.freeXpPerGold, rates),
  );
  pushRow(
    rows,
    "boosters",
    "Личные резервы",
    boosterCount,
    rublesFromGold(boosterGold, rates),
  );
  pushRow(
    rows,
    "premiumAccount",
    "Прем. акк",
    premiumAccount.days,
    rublesFromGold(premiumAccount.gold, rates),
  );
  pushRow(
    rows,
    "premium",
    "Премиумные танки",
    premiumCount,
    rublesFromGold(premiumGold, rates),
  );
  pushRow(
    rows,
    "researchable",
    "Прокачиваемые танки",
    researchableCount,
    rublesFromGold(researchableSilver / rates.silverPerGold, rates),
  );

  return {
    heroAmount: rows.reduce((sum, row) => sum + row.amount, 0),
    rows,
  };
}
