import * as WebBrowser from "expo-web-browser";
import {
  CUSTOM_SCHEME_CALLBACK,
  type CustomTab,
} from "../packages/player-session";

export function createExpoCustomTab(): CustomTab {
  return {
    async open(url) {
      await WebBrowser.warmUpAsync();
      try {
        const result = await WebBrowser.openAuthSessionAsync(
          url,
          CUSTOM_SCHEME_CALLBACK,
        );
        if (result.type === "success") {
          return { type: "success", url: result.url };
        }
        return { type: "dismiss" };
      } finally {
        await WebBrowser.coolDownAsync();
      }
    },
  };
}
