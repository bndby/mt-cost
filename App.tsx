import Constants from "expo-constants";
import { useEffect, useMemo, useSyncExternalStore } from "react";
import { AppState } from "react-native";
import { createExpoCustomTab } from "./src/adapters/expo-custom-tab";
import { createHttpWg } from "./src/adapters/wg-http";
import { systemClock } from "./src/adapters/system-clock";
import { requiredApplicationId } from "./src/config/application-ids";
import {
  WG_API_ORIGINS,
  createPlayerSession,
  type GoldPack,
  type Realm,
} from "./src/packages/player-session";
import { AppChrome, PlayerScreen } from "./src/ui/PlayerScreen";

const extra = Constants.expoConfig?.extra ?? {};

function snapshotNumber(name: string, value: unknown): number {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) {
    throw new Error(`${name} is required`);
  }
  return n;
}

function goldPack(
  goldName: string,
  gold: unknown,
  moneyName: string,
  money: unknown,
): GoldPack {
  return {
    gold: snapshotNumber(goldName, gold),
    money: snapshotNumber(moneyName, money),
  };
}

const wgApplicationId = requiredApplicationId(
  "WG_APPLICATION_ID",
  extra.wgApplicationId as string | undefined,
);

export default function App() {
  const session = useMemo(
    () =>
      createPlayerSession({
        customTab: createExpoCustomTab(),
        wgForRealm: (realm: Realm) =>
          createHttpWg({
            origin: WG_API_ORIGINS[realm],
            applicationId: wgApplicationId,
            fetch: globalThis.fetch.bind(globalThis),
          }),
        clock: systemClock,
        config: {
          wgApplicationId,
          silverPerGold: snapshotNumber(
            "WG_SILVER_PER_GOLD",
            extra.silverPerGold,
          ),
          goldPerBond: snapshotNumber("WG_GOLD_PER_BOND", extra.goldPerBond),
          freeXpPerGold: snapshotNumber(
            "WG_FREE_XP_PER_GOLD",
            extra.freeXpPerGold,
          ),
          goldPacks: {
            EU: goldPack(
              "WG_EU_GOLD_PACK_GOLD",
              extra.euGoldPackGold,
              "WG_EU_GOLD_PACK_EUR",
              extra.euGoldPackEur,
            ),
            NA: goldPack(
              "WG_NA_GOLD_PACK_GOLD",
              extra.naGoldPackGold,
              "WG_NA_GOLD_PACK_USD",
              extra.naGoldPackUsd,
            ),
            ASIA: goldPack(
              "WG_ASIA_GOLD_PACK_GOLD",
              extra.asiaGoldPackGold,
              "WG_ASIA_GOLD_PACK_CNY",
              extra.asiaGoldPackCny,
            ),
          },
        },
      }),
    [],
  );

  const screen = useSyncExternalStore(
    session.subscribe,
    session.screen,
    session.screen,
  );

  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") void session.onForeground();
    });
    return () => sub.remove();
  }, [session]);

  return (
    <AppChrome>
      <PlayerScreen
        screen={screen}
        onSignIn={() => session.signIn()}
        onChooseRealm={(key) => void session.chooseRealm(key)}
        onBackFromRealm={() => session.backFromRealm()}
        onSignOut={() => void session.signOut()}
        onRetry={() => void session.retry()}
      />
    </AppChrome>
  );
}
