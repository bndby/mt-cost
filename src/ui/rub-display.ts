export function splitRubDisplay(rubles: number): {
  integer: string;
  kopecks: string;
} {
  const totalKopecks = Math.round(rubles * 100);
  const sign = totalKopecks < 0 ? "-" : "";
  const abs = Math.abs(totalKopecks);
  const integer = Math.floor(abs / 100);
  const kopecks = String(abs % 100).padStart(2, "0");
  return {
    integer: `${sign}${new Intl.NumberFormat("ru-RU").format(integer)}`,
    kopecks,
  };
}
