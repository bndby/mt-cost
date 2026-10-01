export function splitMoneyDisplay(amount: number): {
  integer: string;
  minor: string;
} {
  const totalMinor = Math.round(amount * 100);
  const sign = totalMinor < 0 ? "-" : "";
  const abs = Math.abs(totalMinor);
  const integer = Math.floor(abs / 100);
  const minor = String(abs % 100).padStart(2, "0");
  return {
    integer: `${sign}${new Intl.NumberFormat("ru-RU").format(integer)}`,
    minor,
  };
}
