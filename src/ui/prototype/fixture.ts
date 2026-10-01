// Throwaway fixture for the transparent-breakdown UI prototype. Not production data.

export type PrototypeLine = {
  name: string;
  count: number;
  amount: number;
};

export const nick = "Red_Baron";
export const clanTag = "RED";
export const kicker = `[${clanTag}] ${nick}`;

export const currencies: PrototypeLine[] = [
  { name: "Боны", count: 12_400, amount: 1_934.4 },
  { name: "Золото", count: 8_150, amount: 1_271.4 },
  { name: "Серебро", count: 12_450_000, amount: 4_855.5 },
];

export const premiumTanks: PrototypeLine[] = [
  { name: "Type 59", count: 1, amount: 1_170 },
  { name: "Löwe", count: 1, amount: 1_950 },
  { name: "Объект 279 (р)", count: 1, amount: 2_340 },
  { name: "Т-22 ср.", count: 1, amount: 1_840.8 },
];

export const researchableTanks: PrototypeLine[] = [
  { name: "ИС-7", count: 1, amount: 2_379 },
  { name: "Объект 140", count: 1, amount: 2_379 },
  { name: "Т-54", count: 1, amount: 1_390.35 },
  { name: "ИС-3", count: 1, amount: 998.4 },
  { name: "Объект 277", count: 1, amount: 2_379 },
  { name: "Т-62А", count: 1, amount: 1_390.35 },
  { name: "ИС-4", count: 1, amount: 2_379 },
  { name: "Т-34-85", count: 1, amount: 528.84 },
  { name: "КВ-1С", count: 1, amount: 390.0 },
  { name: "Т-44", count: 1, amount: 1_050.6 },
];

export function basketSummary(
  name: string,
  lines: PrototypeLine[],
): PrototypeLine | null {
  if (lines.length === 0) return null;
  return {
    name,
    count: lines.reduce((sum, line) => sum + line.count, 0),
    amount: lines.reduce((sum, line) => sum + line.amount, 0),
  };
}

const allLines = [...currencies, ...premiumTanks, ...researchableTanks];

export const sumMoney = allLines.reduce((sum, line) => sum + line.amount, 0);

export function formatCount(value: number): string {
  return new Intl.NumberFormat("ru-RU").format(value);
}

export type DisplayMoney = {
  id: "eur";
  label: string;
  symbol: string;
};

export const DISPLAY_MONEY: DisplayMoney[] = [
  { id: "eur", label: "евро", symbol: "€" },
];

export function toDisplay(amount: number, _money: DisplayMoney): number {
  return amount;
}

export const fixtureDump = {
  kicker,
  sumMoney,
  currencyLines: currencies.length,
  premiumTanks: premiumTanks.length,
  researchableTanks: researchableTanks.length,
};
