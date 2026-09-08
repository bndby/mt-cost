import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, type ComponentProps, type ReactNode } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import {
  SafeAreaProvider,
  SafeAreaView,
  initialWindowMetrics,
} from "react-native-safe-area-context";
import type {
  ColumnRow,
  DisplayChip,
  Realm,
  Screen,
  ValuationSnapshot,
} from "../packages/player-session";
import { isUiPrototype, ValuationPrototype } from "./prototype/ValuationPrototype";
import { RubAmount } from "./RubAmount";

const COLUMN_GLYPH: Record<
  ColumnRow["line"],
  {
    name: ComponentProps<typeof MaterialCommunityIcons>["name"];
    color: string;
  }
> = {
  bonds: { name: "cash-multiple", color: "#c17a3a" },
  gold: { name: "circle-multiple", color: "#e6c15a" },
  silver: { name: "circle-multiple", color: "#c8d0d8" },
  premium: { name: "tank", color: "#e6c15a" },
  researchable: { name: "tank", color: "#c8d0d8" },
};

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
  const glyph = COLUMN_GLYPH[row.line];
  return (
    <View style={styles.row}>
      <MaterialCommunityIcons
        name={glyph.name}
        size={22}
        color={glyph.color}
        accessible={false}
        importantForAccessibility="no"
      />
      <Text style={styles.rowName}>
        {row.name} ({formatCount(row.count)}) ={" "}
        <RubAmount amount={row.amount} symbol={symbol} style={styles.rowPrice} />
      </Text>
    </View>
  );
}

function ChromeButton({
  icon,
  label,
  onPress,
}: {
  icon: ComponentProps<typeof MaterialCommunityIcons>["name"];
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} hitSlop={12} style={styles.chromeButton}>
      <MaterialCommunityIcons
        name={icon}
        size={18}
        color="#c9c4b6"
        accessible={false}
        importantForAccessibility="no"
      />
      <Text style={styles.textButton}>{label}</Text>
    </Pressable>
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
        <ColumnLine key={row.line} row={row} symbol={symbol} />
      ))}
    </View>
  );
}

export function PlayerScreen({
  screen,
  onSignIn,
  onSignInWg,
  onChooseRealm,
  onBackFromRealm,
  onSignOut,
  onRetry,
  onChooseDisplayCurrency,
}: {
  screen: Screen;
  onSignIn: () => void;
  onSignInWg: () => void;
  onChooseRealm: (key: Realm) => void;
  onBackFromRealm: () => void;
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
        <Pressable style={styles.ctaSecondary} onPress={onSignInWg}>
          <Text style={styles.ctaSecondaryLabel}>{screen.wgSignInLabel}</Text>
        </Pressable>
      </View>
    );
  }

  if (screen.kind === "choose-realm") {
    return (
      <View style={styles.body}>
        <View style={styles.top}>
          <Pressable onPress={onBackFromRealm} hitSlop={12}>
            <Text style={styles.textButton}>{screen.backLabel}</Text>
          </Pressable>
        </View>
        <View style={styles.realmCopy}>
          <Text style={styles.kicker}>{screen.kicker}</Text>
          <Text style={styles.realmTitle}>{screen.title}</Text>
          <View style={styles.realmRow}>
            {screen.realms.map((realm) => (
              <Pressable
                key={realm.key}
                onPress={() => onChooseRealm(realm.key)}
                style={[styles.realmChip, realm.selected && styles.realmChipOn]}
              >
                <Text
                  style={[
                    styles.realmChipLabel,
                    realm.selected && styles.realmChipLabelOn,
                  ]}
                >
                  {realm.key}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </View>
    );
  }

  const symbol = selectedSymbol(screen.snapshot);

  return (
    <View style={styles.body}>
      <View style={styles.top}>
        <View style={styles.topLeft}>
          {screen.retryLabel ? (
            <ChromeButton
              icon="refresh"
              label={screen.retryLabel}
              onPress={onRetry}
            />
          ) : null}
        </View>
        <ChromeButton
          icon="close"
          label={screen.signOutLabel}
          onPress={onSignOut}
        />
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
  chromeButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  ctaSecondary: {
    marginTop: 10,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#9a968c",
  },
  ctaSecondaryLabel: {
    color: "#f3f1ea",
    fontSize: 17,
    fontWeight: "700",
  },
  realmCopy: {
    flex: 1,
    paddingTop: 8,
  },
  realmTitle: {
    color: "#f3f1ea",
    fontSize: 22,
    fontWeight: "600",
    marginBottom: 18,
  },
  realmRow: {
    flexDirection: "row",
    gap: 8,
  },
  realmChip: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#9a968c",
  },
  realmChipOn: {
    borderWidth: 2,
    borderColor: "#e7c46a",
  },
  realmChipLabel: {
    color: "#f3f1ea",
    fontSize: 15,
    fontWeight: "700",
  },
  realmChipLabelOn: {
    color: "#e7c46a",
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
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  rowName: {
    flex: 1,
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
