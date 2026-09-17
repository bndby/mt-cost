import { describe, expect, test } from "vitest";
import { requiredApplicationId } from "./application-ids";

describe("requiredApplicationId", () => {
  test("пустой id не проходит: WG тогда отвечает APPLICATION_ID_NOT_SPECIFIED", () => {
    expect(() => requiredApplicationId("WG_APPLICATION_ID", "")).toThrow(
      /WG_APPLICATION_ID/,
    );
    expect(() => requiredApplicationId("WG_APPLICATION_ID", undefined)).toThrow(
      /WG_APPLICATION_ID/,
    );
    expect(() => requiredApplicationId("WG_APPLICATION_ID", "   ")).toThrow(
      /WG_APPLICATION_ID/,
    );
  });

  test("непустой id возвращается без изменений", () => {
    expect(requiredApplicationId("WG_APPLICATION_ID", "abc")).toBe("abc");
  });
});
