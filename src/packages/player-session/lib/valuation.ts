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
  "silverPerGold" | "goldPerBond" | "freeXpPerGold"
> & {
  goldPackGold: number;
  goldPackMoney: number;
  premiumPackages: readonly { days: number; gold: number }[];
};

function moneyFromGold(gold: number, rates: ValuationRates): number {
  return (gold * rates.goldPackMoney) / rates.goldPackGold;
}

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

function boosterUnitGold(
  owned: OwnedBooster,
  catalog: Map<number, BoosterPrice>,
): number {
  if (owned.state === "USED" || owned.count <= 0) return 0;
  const price = catalog.get(owned.boosterId);
  const apiGold = price?.priceGold ?? 0;
  return apiGold > 0 ? apiGold : 0;
}

function tankGoldAndSilver(price: VehiclePrice | undefined): {
  gold: number;
  silver: number;
} {
  const catalogGold = price?.priceGold ?? 0;
  const catalogSilver = price?.priceSilver ?? 0;
  if (catalogGold > 0) return { gold: catalogGold, silver: 0 };
  if (catalogSilver > 0) return { gold: 0, silver: catalogSilver };
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
    const valued = tankGoldAndSilver(priceById.get(tankId));
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
    const unit = boosterUnitGold(owned, boosterById);
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
    moneyFromGold(account.bonds * rates.goldPerBond, rates),
  );
  pushRow(
    rows,
    "gold",
    "Золото",
    account.gold,
    moneyFromGold(account.gold, rates),
  );
  pushRow(
    rows,
    "silver",
    "Серебро",
    account.silver,
    moneyFromGold(account.silver / rates.silverPerGold, rates),
  );
  pushRow(
    rows,
    "freeXp",
    "Своб. опыт",
    freeXp,
    moneyFromGold(freeXp / rates.freeXpPerGold, rates),
  );
  pushRow(
    rows,
    "boosters",
    "Резервы",
    boosterCount,
    moneyFromGold(boosterGold, rates),
  );
  pushRow(
    rows,
    "premiumAccount",
    "Прем. акк",
    premiumAccount.days,
    moneyFromGold(premiumAccount.gold, rates),
  );
  pushRow(
    rows,
    "premium",
    "Прем. танки",
    premiumCount,
    moneyFromGold(premiumGold, rates),
  );
  pushRow(
    rows,
    "researchable",
    "Танки",
    researchableCount,
    moneyFromGold(researchableSilver / rates.silverPerGold, rates),
  );

  return {
    heroAmount: rows.reduce((sum, row) => sum + row.amount, 0),
    rows,
  };
}
