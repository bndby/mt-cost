import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";
import { CUSTOM_SCHEME_CALLBACK } from "../index";

const callbackHtml = readFileSync(
  join(
    dirname(fileURLToPath(import.meta.url)),
    "../../../../docs/auth/callback/index.html",
  ),
  "utf8",
);

describe("заглушка GitHub Pages", () => {
  test("редиректит query на mtcost://auth/callback без экрана и без хранения токена", () => {
    expect(callbackHtml).toContain(CUSTOM_SCHEME_CALLBACK);
    expect(callbackHtml).toContain("location.replace");
    expect(callbackHtml).toContain("location.search");
    expect(callbackHtml).not.toMatch(/localStorage|sessionStorage|cookie|fetch\(/i);
    expect(callbackHtml).not.toMatch(/<p|<h1|<button/i);
  });
});
