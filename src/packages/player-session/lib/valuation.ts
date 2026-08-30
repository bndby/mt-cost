import type { AccountSnapshot, RentedTank, VehiclePrice } from "./session";

/** Official in-game rate: 1 gold = 400 silver. */
const SILVER_PER_GOLD = 400;
/** Snapshot of the largest undiscounted gold pack: 50 000 gold for 7800 ₽. */
const GOLD_PACK_GOLD = 50_000;
const GOLD_PACK_RUBLES = 7_800;

export function rublesFromGold(gold: number): number {
  return (gold * GOLD_PACK_RUBLES) / GOLD_PACK_GOLD;
}

export function uniqueTankIds(
  hangarTankIds: number[],
  rented: RentedTank[],
): number[] {
  return [...new Set([...hangarTankIds, ...rented.map((tank) => tank.tankId)])];
}

function tankRubles(
  priceSilver: number | null,
  priceGold: number | null,
): number {
  const silver = priceSilver ?? 0;
  const gold = priceGold ?? 0;
  if (gold > 0) return rublesFromGold(gold);
  if (silver > 0) return rublesFromGold(silver / SILVER_PER_GOLD);
  return 0;
}

export function valueAccount(
  account: AccountSnapshot,
  tankIds: number[],
  prices: VehiclePrice[],
): {
  tankCount: number;
  tanksRub: number;
  otherRub: number;
  sumRub: number;
} {
  const priceById = new Map(prices.map((price) => [price.tankId, price]));
  let tanksRub = 0;
  for (const tankId of tankIds) {
    const price = priceById.get(tankId);
    tanksRub += tankRubles(price?.priceSilver ?? null, price?.priceGold ?? null);
  }
  const otherRub =
    rublesFromGold(account.silver / SILVER_PER_GOLD) +
    rublesFromGold(account.gold);
  return {
    tankCount: tankIds.length,
    tanksRub,
    otherRub,
    sumRub: tanksRub + otherRub,
  };
}
