import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";
import { CUSTOM_SCHEME_CALLBACK } from "../index";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "../../../..");
const callbackHtml = readFileSync(
  join(repoRoot, "docs/auth/callback/index.html"),
  "utf8",
);
const pagesWorkflow = readFileSync(
  join(repoRoot, ".github/workflows/pages.yml"),
  "utf8",
);
const privacyHtml = readFileSync(
  join(repoRoot, "docs/privacy/index.html"),
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

  test("workflow выкладывает заглушку на /auth/callback", () => {
    expect(pagesWorkflow).toContain("docs/auth/callback/index.html");
    expect(pagesWorkflow).toContain("_site/auth/callback");
    expect(pagesWorkflow).toContain("actions/deploy-pages");
  });

  test("workflow выкладывает политику конфиденциальности на /privacy", () => {
    expect(pagesWorkflow).toContain("docs/privacy/index.html");
    expect(pagesWorkflow).toContain("_site/privacy");
  });

  test("политика говорит, что пароль не собирается и своего сервера нет", () => {
    expect(privacyHtml).toMatch(/Lesta OpenID/);
    expect(privacyHtml).toMatch(/не собирает/);
    expect(privacyHtml).toMatch(/Своего сервера у MT Cost нет/);
    expect(privacyHtml).toContain("https://bndby.github.io/mt-cost/auth/callback");
  });
});
