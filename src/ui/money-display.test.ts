import { describe, expect, test } from "vitest";
import { splitMoneyDisplay } from "./money-display";

describe("отображение суммы с двумя дробными цифрами", () => {
  test("целое всегда с ,00", () => {
    expect(splitMoneyDisplay(0)).toEqual({ integer: "0", minor: "00" });
    expect(splitMoneyDisplay(156)).toEqual({ integer: "156", minor: "00" });
  });

  test("от 5 тысячных вверх", () => {
    expect(splitMoneyDisplay(1.225).minor).toBe("23");
    expect(splitMoneyDisplay(1.235).minor).toBe("24");
    expect(splitMoneyDisplay(99.994).minor).toBe("99");
    expect(splitMoneyDisplay(258893.641).minor).toBe("64");
  });

  test("группирует тысячи как ru-RU", () => {
    expect(splitMoneyDisplay(99.994).integer).toBe(
      new Intl.NumberFormat("ru-RU").format(99),
    );
  });
});
