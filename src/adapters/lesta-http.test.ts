import { describe, expect, test } from "vitest";
import { createHttpLesta } from "./lesta-http";

function jsonResponse(body: unknown, ok = true): Response {
  return {
    ok,
    json: async () => body,
  } as Response;
}

function createClient(handler: (url: URL) => Response) {
  const opened: URL[] = [];
  const client = createHttpLesta({
    applicationId: "app-id",
    fetch: async (input) => {
      const url = new URL(String(input));
      opened.push(url);
      return handler(url);
    },
  });
  return { client, opened };
}

describe("HTTP Lesta: боны и клан-тег", () => {
  test("account/info читает private.bonds вместе с серебром и золотом", async () => {
    const { client } = createClient(() =>
      jsonResponse({
        status: "ok",
        data: {
          "42": {
            private: {
              credits: 10,
              gold: 20,
              bonds: 7,
              garage: [],
            },
          },
        },
      }),
    );

    await expect(client.fetchAccount("token", 42)).resolves.toMatchObject({
      silver: 10,
      gold: 20,
      bonds: 7,
    });
  });

  test("clans/accountinfo отдаёт тег, null вне клана, без access_token", async () => {
    const { client, opened } = createClient((url) => {
      if (url.searchParams.get("account_id") === "7") {
        return jsonResponse({ status: "ok", data: { "7": null } });
      }
      return jsonResponse({
        status: "ok",
        data: {
          "42": { clan: { tag: "xYz" } },
        },
      });
    });

    await expect(client.fetchClanTag(42)).resolves.toBe("xYz");
    await expect(client.fetchClanTag(7)).resolves.toBeNull();
    expect(opened[0].searchParams.get("access_token")).toBeNull();
    expect(opened[0].searchParams.get("account_id")).toBe("42");
  });

  test("ошибка clans/accountinfo пробрасывается", async () => {
    const { client } = createClient(() =>
      jsonResponse({ status: "error", data: {} }),
    );
    await expect(client.fetchClanTag(42)).rejects.toThrow("clan");
  });
});
