import type {
  AccountSnapshot,
  ColumnRow,
  PlayerSessionConfig,
  RentedTank,
  VehiclePrice,
} from "./session";

export type ValuationRates = Pick<
  PlayerSessionConfig,
  "silverPerGold" | "goldPackGold" | "goldPackRubles" | "goldPerBond"
>;

function rublesFromGold(gold: number, rates: ValuationRates): number {
  return (gold * rates.goldPackRubles) / rates.goldPackGold;
}

export function uniqueTankIds(
  hangarTankIds: number[],
  rented: RentedTank[],
): number[] {
  return [...new Set([...hangarTankIds, ...rented.map((tank) => tank.tankId)])];
}

function pushRow(
  rows: ColumnRow[],
  name: string,
  count: number,
  amount: number,
) {
  if (count > 0) rows.push({ name, count, amount });
}

export function valueAccount(
  account: AccountSnapshot,
  tankIds: number[],
  prices: VehiclePrice[],
  rates: ValuationRates,
): {
  heroAmount: number;
  rows: ColumnRow[];
} {
  const priceById = new Map(prices.map((price) => [price.tankId, price]));
  let premiumCount = 0;
  let premiumGold = 0;
  let researchableCount = 0;
  let researchableSilver = 0;
  for (const tankId of tankIds) {
    const price = priceById.get(tankId);
    const gold = price?.priceGold ?? 0;
    const silver = price?.priceSilver ?? 0;
    if (gold > 0) {
      premiumCount += 1;
      premiumGold += gold;
    } else if (silver > 0) {
      researchableCount += 1;
      researchableSilver += silver;
    }
  }

  const rows: ColumnRow[] = [];
  pushRow(
    rows,
    "Боны",
    account.bonds,
    rublesFromGold(account.bonds * rates.goldPerBond, rates),
  );
  pushRow(rows, "Золото", account.gold, rublesFromGold(account.gold, rates));
  pushRow(
    rows,
    "Серебро",
    account.silver,
    rublesFromGold(account.silver / rates.silverPerGold, rates),
  );
  pushRow(
    rows,
    "Премиумные танки",
    premiumCount,
    rublesFromGold(premiumGold, rates),
  );
  pushRow(
    rows,
    "Прокачиваемые танки",
    researchableCount,
    rublesFromGold(researchableSilver / rates.silverPerGold, rates),
  );

  return {
    heroAmount: rows.reduce((sum, row) => sum + row.amount, 0),
    rows,
  };
}
