import { describe, expect, test } from "vitest";
import { createHttpLesta } from "./lesta-http";
import { LESTA_API_ORIGIN } from "../packages/player-session";

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
              is_premium: true,
              premium_expires_at: 1_700_086_400,
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
      premiumExpiresAt: 1_700_086_400,
    });
  });

  test("account/info читает free_xp, extra boosters и словарь резервов по id", async () => {
    const { client, opened } = createClient((url) => {
      if (url.pathname.includes("encyclopedia/boosters")) {
        return jsonResponse({
          status: "ok",
          data: {
            "121001": {
              booster_id: 121001,
              price_gold: 150,
              price_credit: 0,
              resource: "experience",
              lifetime: 3600,
              description: "+100%",
            },
          },
        });
      }
      if (url.pathname.includes("encyclopedia/vehicles")) {
        return jsonResponse({
          status: "ok",
          data: {
            "8": {
              tank_id: 8,
              price_credit: 0,
              price_gold: 0,
              tier: 8,
              is_premium: false,
              is_gift: true,
            },
          },
        });
      }
      return jsonResponse({
        status: "ok",
        data: {
          "42": {
            private: {
              credits: 0,
              gold: 0,
              bonds: 0,
              free_xp: 25000,
              garage: [8],
              boosters: {
                "121001": {
                  count: 2,
                  expiration_time: 0,
                  state: "INACTIVE",
                },
                "9": { count: 1, expiration_time: 0, state: "USED" },
              },
            },
          },
        },
      });
    });

    await expect(client.fetchAccount("token", 42)).resolves.toMatchObject({
      freeXp: 25_000,
      hangarTankIds: [8],
      boosters: [
        { boosterId: 9, count: 1, state: "USED" },
        { boosterId: 121001, count: 2, state: "INACTIVE" },
      ],
    });
    expect(opened[0].searchParams.get("extra")).toContain("private.boosters");

    await expect(client.fetchBoosterPrices()).resolves.toEqual([
      {
        boosterId: 121001,
        priceGold: 150,
        resource: "experience",
        lifetime: 3600,
        description: "+100%",
      },
    ]);

    await expect(client.fetchVehiclePrices([8])).resolves.toEqual([
      {
        tankId: 8,
        priceSilver: 0,
        priceGold: 0,
        tier: 8,
        isPremium: false,
        isGift: true,
      },
    ]);
    expect(opened[2].searchParams.get("fields")).toContain("tier");
    expect(opened[2].searchParams.get("fields")).toContain("is_gift");
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

  test("запросы идут на переданный origin, иначе на Lesta", async () => {
    const lesta = createClient(() => jsonResponse({ status: "ok", data: { "1": null } }));
    await lesta.client.fetchClanTag(1);
    expect(lesta.opened[0].origin).toBe(new URL(LESTA_API_ORIGIN).origin);

    const opened: URL[] = [];
    const wg = createHttpLesta({
      origin: "https://api.worldoftanks.eu",
      applicationId: "wg-id",
      fetch: async (input) => {
        const url = new URL(String(input));
        opened.push(url);
        return jsonResponse({ status: "ok", data: { "1": null } });
      },
    });
    await wg.fetchClanTag(1);
    expect(opened[0].origin).toBe("https://api.worldoftanks.eu");
    expect(opened[0].searchParams.get("application_id")).toBe("wg-id");
  });
});
