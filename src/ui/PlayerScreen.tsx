import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, type ReactNode } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import {
  SafeAreaProvider,
  SafeAreaView,
  initialWindowMetrics,
} from "react-native-safe-area-context";
import type { Screen } from "../packages/player-session";
import { isUiPrototype, ValuationPrototype } from "./prototype/ValuationPrototype";
import { RubAmount } from "./RubAmount";

function formatCount(value: number): string {
  return new Intl.NumberFormat("ru-RU").format(value);
}

function SlotValue({
  slots,
  kind,
}: {
  slots: Extract<Screen, { kind: "valuation" }>["slots"];
  kind: "sum" | "tanks" | "tanksRub" | "other";
}) {
  if (slots.kind === "waiting") {
    return <WaitingPulse hero={kind === "sum"} />;
  }
  if (slots.kind === "dashes") {
    return <Text style={kind === "sum" ? styles.sum : styles.dockValue}>—</Text>;
  }
  if (kind === "tanks") {
    return (
      <Text style={styles.dockValue}>{formatCount(slots.tankCount)}</Text>
    );
  }
  const rubles =
    kind === "sum"
      ? slots.sumRub
      : kind === "tanksRub"
        ? slots.tanksRub
        : slots.otherRub;
  return (
    <RubAmount
      rubles={rubles}
      style={kind === "sum" ? styles.sum : styles.dockValue}
    />
  );
}

function WaitingPulse({ hero }: { hero: boolean }) {
  const opacity = useRef(new Animated.Value(0.35)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.85,
          duration: 550,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.35,
          duration: 550,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);
  return (
    <Animated.View
      style={[hero ? styles.heroPulse : styles.dockPulse, { opacity }]}
    />
  );
}

export function PlayerScreen({
  screen,
  onSignIn,
  onSignOut,
  onRetry,
}: {
  screen: Screen;
  onSignIn: () => void;
  onSignOut: () => void;
  onRetry: () => void;
}) {
  if (isUiPrototype) {
    return (
      <ValuationPrototype
        onSignOut={onSignOut}
        showSignOut={screen.kind === "valuation"}
      />
    );
  }

  if (screen.kind === "signed-out") {
    return (
      <View style={styles.body}>
        <View style={styles.top} />
        <View style={styles.loginCopy}>
          <Text style={styles.title}>{screen.title}</Text>
          <Text style={styles.subtitle}>{screen.subtitle}</Text>
        </View>
        <Pressable style={styles.cta} onPress={onSignIn}>
          <Text style={styles.ctaLabel}>{screen.signInLabel}</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.body}>
      <View style={styles.top}>
        <Pressable onPress={onSignOut} hitSlop={12}>
          <Text style={styles.textButton}>{screen.signOutLabel}</Text>
        </Pressable>
      </View>
      <View style={styles.hero}>
        <Text style={styles.kicker}>{screen.heroLabel}</Text>
        <SlotValue slots={screen.slots} kind="sum" />
        {screen.retryLabel ? (
          <Pressable onPress={onRetry} hitSlop={12} style={styles.retryWrap}>
            <Text style={styles.textButton}>{screen.retryLabel}</Text>
          </Pressable>
        ) : null}
      </View>
      <View style={styles.dock}>
        <View style={styles.dockCol}>
          <Text style={styles.dockLabel}>{screen.tanksLabel}</Text>
          <SlotValue slots={screen.slots} kind="tanks" />
        </View>
        <View style={styles.dockCol}>
          <Text style={styles.dockLabel}>{screen.tanksRubLabel}</Text>
          <SlotValue slots={screen.slots} kind="tanksRub" />
        </View>
        <View style={styles.dockCol}>
          <Text style={styles.dockLabel}>{screen.otherLabel}</Text>
          <SlotValue slots={screen.slots} kind="other" />
        </View>
      </View>
    </View>
  );
}

export function AppChrome({ children }: { children: ReactNode }) {
  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <SafeAreaView style={styles.screen}>
        <StatusBar style="light" />
        {children}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#12141a",
  },
  body: {
    flex: 1,
    paddingHorizontal: 22,
    paddingBottom: 28,
    paddingTop: 12,
  },
  top: {
    minHeight: 36,
    alignItems: "flex-end",
    justifyContent: "center",
  },
  loginCopy: {
    flex: 1,
    justifyContent: "flex-end",
    paddingBottom: 36,
  },
  title: {
    color: "#f3f1ea",
    fontSize: 40,
    fontWeight: "600",
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  subtitle: {
    color: "#9a968c",
    fontSize: 16,
    lineHeight: 22,
    maxWidth: 280,
  },
  cta: {
    backgroundColor: "#e7c46a",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },
  ctaLabel: {
    color: "#1a1408",
    fontSize: 17,
    fontWeight: "700",
  },
  textButton: {
    color: "#c9c4b6",
    fontSize: 14,
  },
  hero: {
    flex: 1,
    justifyContent: "center",
  },
  kicker: {
    fontSize: 13,
    letterSpacing: 2.4,
    textTransform: "uppercase",
    color: "#8c887c",
    marginBottom: 10,
  },
  sum: {
    color: "#f3f1ea",
    fontSize: 56,
    fontWeight: "600",
    letterSpacing: -1.5,
    lineHeight: 60,
    fontVariant: ["tabular-nums"],
  },
  retryWrap: {
    paddingTop: 12,
    alignSelf: "flex-start",
  },
  dock: {
    flexDirection: "row",
    gap: 8,
    paddingTop: 28,
    borderTopWidth: 1,
    borderTopColor: "#2a2d36",
    marginTop: 8,
  },
  dockCol: {
    flex: 1,
    minWidth: 0,
  },
  dockLabel: {
    fontSize: 11,
    color: "#8c887c",
    marginBottom: 4,
    lineHeight: 14,
  },
  dockValue: {
    color: "#f3f1ea",
    fontSize: 14,
    fontVariant: ["tabular-nums"],
  },
  heroPulse: {
    height: 48,
    width: 220,
    borderRadius: 4,
    backgroundColor: "#3a3e4a",
  },
  dockPulse: {
    height: 14,
    width: 72,
    borderRadius: 4,
    backgroundColor: "#3a3e4a",
    marginTop: 4,
  },
});
