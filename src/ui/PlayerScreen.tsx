import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, type ReactNode } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import {
  SafeAreaProvider,
  SafeAreaView,
  initialWindowMetrics,
} from "react-native-safe-area-context";
import type {
  ColumnRow,
  DisplayChip,
  Screen,
  ValuationSnapshot,
} from "../packages/player-session";
import { isUiPrototype, ValuationPrototype } from "./prototype/ValuationPrototype";
import { RubAmount } from "./RubAmount";

function formatCount(value: number): string {
  return new Intl.NumberFormat("ru-RU").format(value);
}

function selectedSymbol(snapshot: ValuationSnapshot): string {
  if (snapshot.kind !== "numbers") return "₽";
  return snapshot.chips.find((chip) => chip.selected)?.symbol ?? "₽";
}

function Switcher({
  chips,
  onChoose,
}: {
  chips: DisplayChip[];
  onChoose: (label: string) => void;
}) {
  return (
    <View style={styles.switcher}>
      {chips.map((chip) => (
        <Pressable
          key={chip.label}
          onPress={() => onChoose(chip.label)}
          style={[styles.chip, chip.selected && styles.chipOn]}
        >
          <Text style={[styles.chipLabel, chip.selected && styles.chipLabelOn]}>
            {chip.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

function WaitingPulse({ style }: { style: object }) {
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
  return <Animated.View style={[style, { opacity }]} />;
}

function HeroAmount({
  snapshot,
  symbol,
}: {
  snapshot: ValuationSnapshot;
  symbol: string;
}) {
  if (snapshot.kind === "waiting") {
    return <WaitingPulse style={styles.heroPulse} />;
  }
  if (snapshot.kind === "dashes") {
    return <Text style={styles.sum}>—</Text>;
  }
  return (
    <RubAmount amount={snapshot.heroAmount} symbol={symbol} style={styles.sum} />
  );
}

function ColumnLine({
  row,
  symbol,
}: {
  row: ColumnRow;
  symbol: string;
}) {
  return (
    <Text style={styles.rowName}>
      {row.name} ({formatCount(row.count)}) ={" "}
      <RubAmount amount={row.amount} symbol={symbol} style={styles.rowPrice} />
    </Text>
  );
}

function Column({ snapshot, symbol }: { snapshot: ValuationSnapshot; symbol: string }) {
  if (snapshot.kind === "waiting") {
    return <WaitingPulse style={styles.columnPulse} />;
  }
  if (snapshot.kind === "dashes" || snapshot.rows.length === 0) {
    return null;
  }
  return (
    <View style={styles.column}>
      {snapshot.rows.map((row) => (
        <ColumnLine key={row.name} row={row} symbol={symbol} />
      ))}
    </View>
  );
}

export function PlayerScreen({
  screen,
  onSignIn,
  onSignOut,
  onRetry,
  onChooseDisplayCurrency,
}: {
  screen: Screen;
  onSignIn: () => void;
  onSignOut: () => void;
  onRetry: () => void;
  onChooseDisplayCurrency: (label: string) => void;
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

  const symbol = selectedSymbol(screen.snapshot);

  return (
    <View style={styles.body}>
      <View style={styles.top}>
        <View style={styles.topLeft}>
          {screen.retryLabel ? (
            <Pressable onPress={onRetry} hitSlop={12}>
              <Text style={styles.textButton}>{screen.retryLabel}</Text>
            </Pressable>
          ) : null}
        </View>
        <Pressable onPress={onSignOut} hitSlop={12}>
          <Text style={styles.textButton}>{screen.signOutLabel}</Text>
        </Pressable>
      </View>
      <View style={styles.hero}>
        <Text style={styles.kicker}>{screen.kicker}</Text>
        <HeroAmount snapshot={screen.snapshot} symbol={symbol} />
        {screen.snapshot.kind === "numbers" ? (
          <Switcher
            chips={screen.snapshot.chips}
            onChoose={onChooseDisplayCurrency}
          />
        ) : null}
      </View>
      <Column snapshot={screen.snapshot} symbol={symbol} />
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  topLeft: {
    minHeight: 36,
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
    letterSpacing: 0.4,
    color: "#8c887c",
    marginBottom: 10,
  },
  sum: {
    color: "#f3f1ea",
    fontSize: 40,
    fontWeight: "600",
    letterSpacing: -1.2,
    lineHeight: 44,
    fontVariant: ["tabular-nums"],
  },
  switcher: {
    flexDirection: "row",
    gap: 6,
    marginTop: 12,
  },
  chip: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: "center",
    backgroundColor: "#1a1d24",
  },
  chipOn: {
    backgroundColor: "#e7c46a",
  },
  chipLabel: {
    color: "#9a968c",
    fontSize: 11,
    fontWeight: "600",
  },
  chipLabelOn: {
    color: "#1a1408",
  },
  column: {
    backgroundColor: "#1a1d24",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 8,
  },
  rowName: {
    color: "#f3f1ea",
    fontSize: 14,
    lineHeight: 20,
  },
  rowPrice: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  heroPulse: {
    height: 48,
    width: 220,
    borderRadius: 4,
    backgroundColor: "#3a3e4a",
  },
  columnPulse: {
    height: 120,
    borderRadius: 12,
    backgroundColor: "#3a3e4a",
  },
});
