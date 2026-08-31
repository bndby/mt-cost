import Constants from "expo-constants";
import { useEffect, useMemo, useSyncExternalStore } from "react";
import { AppState } from "react-native";
import { createExpoCustomTab } from "./src/adapters/expo-custom-tab";
import { createHttpLesta } from "./src/adapters/lesta-http";
import { systemClock } from "./src/adapters/system-clock";
import { createPlayerSession } from "./src/packages/player-session";
import { AppChrome, PlayerScreen } from "./src/ui/PlayerScreen";

const extra = Constants.expoConfig?.extra ?? {};

function snapshotNumber(value: unknown): number {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) {
    throw new Error("rate snapshot");
  }
  return n;
}

const applicationId =
  (extra.lestaApplicationId as string | undefined) ?? "";

export default function App() {
  const session = useMemo(
    () =>
      createPlayerSession({
        customTab: createExpoCustomTab(),
        lesta: createHttpLesta({
          applicationId,
          fetch: globalThis.fetch.bind(globalThis),
        }),
        clock: systemClock,
        config: {
          applicationId,
          silverPerGold: snapshotNumber(extra.silverPerGold),
          goldPackGold: snapshotNumber(extra.goldPackGold),
          goldPackRubles: snapshotNumber(extra.goldPackRubles),
          goldPerBond: snapshotNumber(extra.goldPerBond),
          rubPerByn: snapshotNumber(extra.rubPerByn),
          rubPerUsd: snapshotNumber(extra.rubPerUsd),
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
        onSignIn={() => void session.signIn()}
        onSignOut={() => void session.signOut()}
        onRetry={() => void session.retry()}
        onChooseDisplayCurrency={(label) => session.chooseDisplayCurrency(label)}
      />
    </AppChrome>
  );
}
