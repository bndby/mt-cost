import type { ExpoConfig } from "expo/config";

const config: ExpoConfig = {
  name: "MT Cost",
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
    package: "by.bnd.mtcost",
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
    eas: {
      projectId: "ebf6a76d-6556-4ecb-93ab-f5af979ae0df",
    },
    lestaApplicationId: process.env.LESTA_APPLICATION_ID ?? "",
  },
};

export default config;
