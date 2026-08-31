import { describe, expect, test } from "vitest";
import { splitRubDisplay } from "./rub-display";

describe("отображение рублей с копейками", () => {
  test("целые рубли всегда с ,00", () => {
    expect(splitRubDisplay(0)).toEqual({ integer: "0", kopecks: "00" });
    expect(splitRubDisplay(156)).toEqual({ integer: "156", kopecks: "00" });
  });

  test("от 5 копеечной доли вверх", () => {
    expect(splitRubDisplay(1.225).kopecks).toBe("23");
    expect(splitRubDisplay(1.235).kopecks).toBe("24");
    expect(splitRubDisplay(7800.156).kopecks).toBe("16");
    expect(splitRubDisplay(258893.641).kopecks).toBe("64");
  });

  test("группирует тысячи как ru-RU", () => {
    expect(splitRubDisplay(7800.156).integer).toBe(
      new Intl.NumberFormat("ru-RU").format(7800),
    );
  });
});
