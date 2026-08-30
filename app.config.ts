import type { ExpoConfig } from "expo/config";

const config: ExpoConfig = {
  name: "MT Cost",
  slug: "mt-cost",
  scheme: "mtcost",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "dark",
  ios: {
    supportsTablet: false,
  },
  android: {
    package: "su.bndby.mtcost",
    adaptiveIcon: {
      backgroundColor: "#12141a",
      foregroundImage: "./assets/android-icon-foreground.png",
      backgroundImage: "./assets/android-icon-background.png",
      monochromeImage: "./assets/android-icon-monochrome.png",
    },
    predictiveBackGestureEnabled: false,
  },
  plugins: ["expo-web-browser"],
  web: {
    favicon: "./assets/favicon.png",
  },
  extra: {
    lestaApplicationId: process.env.LESTA_APPLICATION_ID ?? "",
  },
};

export default config;
