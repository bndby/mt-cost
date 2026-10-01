import type { ExpoConfig } from "expo/config";

function requiredApplicationId(
  name: string,
  value: string | undefined,
): string {
  const id = value?.trim() ?? "";
  if (!id) {
    throw new Error(`${name} is required`);
  }
  return id;
}

const config: ExpoConfig = {
  name: "WoT Cost",
  slug: "mt-cost",
  owner: "bndby",
  scheme: "mtcost",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "dark",
  ios: {
    supportsTablet: false,
  },
  android: {
    package: "by.bnd.wotcost",
    versionCode: 1,
    adaptiveIcon: {
      backgroundColor: "#000000",
      foregroundImage: "./assets/android-icon-foreground.png",
      backgroundImage: "./assets/android-icon-background.png",
      monochromeImage: "./assets/android-icon-monochrome.png",
    },
    predictiveBackGestureEnabled: false,
  },
  plugins: [
    "expo-localization",
    "expo-web-browser",
    [
      "expo-build-properties",
      {
        android: {
          enableMinifyInReleaseBuilds: true,
          enableShrinkResourcesInReleaseBuilds: true,
        },
      },
    ],
  ],
  web: {
    favicon: "./assets/favicon.png",
  },
  extra: {
    eas: {
      projectId: "ebf6a76d-6556-4ecb-93ab-f5af979ae0df",
    },
    wgApplicationId: requiredApplicationId(
      "WG_APPLICATION_ID",
      process.env.WG_APPLICATION_ID,
    ),
    silverPerGold: process.env.WG_SILVER_PER_GOLD ?? "400",
    goldPerBond: process.env.WG_GOLD_PER_BOND ?? "1.6",
    freeXpPerGold: process.env.WG_FREE_XP_PER_GOLD ?? "25",
    // EU: permanent_gold30500, снимок 2026-10-01, скидки нет.
    euGoldPackGold: process.env.WG_EU_GOLD_PACK_GOLD ?? "30500",
    euGoldPackEur: process.env.WG_EU_GOLD_PACK_EUR ?? "99.99",
    // NA: permanent_gold25000, снимок 2026-10-01, страна US, скидки нет.
    naGoldPackGold: process.env.WG_NA_GOLD_PACK_GOLD || "25000",
    naGoldPackUsd: process.env.WG_NA_GOLD_PACK_USD || "99.99",
    // ASIA: ps_p_51, снимок 2026-10-01, страна CN, титул sg.wot, скидки нет.
    asiaGoldPackGold: process.env.WG_ASIA_GOLD_PACK_GOLD || "25000",
    asiaGoldPackCny: process.env.WG_ASIA_GOLD_PACK_CNY || "625",
  },
};

export default config;
