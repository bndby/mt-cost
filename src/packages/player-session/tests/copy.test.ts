import { describe, expect, test } from "vitest";
import { encyclopediaLanguage, languageFromDevice } from "../lib/copy";

describe("язык устройства и энциклопедии", () => {
  test("берёт язык клиента из метки устройства, иначе русский", () => {
    expect(languageFromDevice(["pl-PL", "en-US"])).toBe("pl");
    expect(languageFromDevice(["zh-Hant-TW"])).toBe("zh-TW");
    expect(languageFromDevice(["zh-Hans-CN"])).toBe("zh-CN");
    expect(languageFromDevice(["pt-PT"])).toBe("pt-BR");
    expect(languageFromDevice(["es-MX"])).toBe("es");
    expect(languageFromDevice(["th-TH"])).toBe("ru");
    expect(languageFromDevice([])).toBe("ru");
  });

  test("нет кода энциклопедии — английский", () => {
    expect(encyclopediaLanguage("ru")).toBe("ru");
    expect(encyclopediaLanguage("zh-TW")).toBe("zh-tw");
    expect(encyclopediaLanguage("ja")).toBe("en");
    expect(encyclopediaLanguage("uk")).toBe("en");
  });
});
