import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, type ComponentProps, type ReactNode } from "react";
import { Animated, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import {
  SafeAreaProvider,
  SafeAreaView,
  initialWindowMetrics,
} from "react-native-safe-area-context";
import type {
  ColumnRow,
  LanguageId,
  Realm,
  Screen,
  ValuationSnapshot,
} from "../packages/player-session";
import { isUiPrototype, ValuationPrototype } from "./prototype/ValuationPrototype";
import { MoneyAmount } from "./MoneyAmount";
import { RealmFlag } from "./RealmFlag";

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
  freeXp: { name: "star-four-points", color: "#c8d0d8" },
  boosters: { name: "flash", color: "#e6c15a" },
  premium: { name: "tank", color: "#e6c15a" },
  premiumAccount: { name: "clock-outline", color: "#e6c15a" },
  researchable: { name: "tank", color: "#c8d0d8" },
};

function formatCount(value: number): string {
  return new Intl.NumberFormat("ru-RU").format(value);
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
    <MoneyAmount amount={snapshot.heroAmount} symbol={symbol} style={styles.sum} />
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
        <MoneyAmount amount={row.amount} symbol={symbol} style={styles.rowPrice} />
      </Text>
    </View>
  );
}

function GearButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={12}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <MaterialCommunityIcons name="cog" size={22} color="#c9c4b6" />
    </Pressable>
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
  onChooseRealm,
  onSignOut,
  onRetry,
  onOpenSettings,
  onCloseSettings,
  onChooseLanguage,
}: {
  screen: Screen;
  onChooseRealm: (key: Realm) => void;
  onSignOut: () => void;
  onRetry: () => void;
  onOpenSettings: () => void;
  onCloseSettings: () => void;
  onChooseLanguage: (id: LanguageId) => void;
}) {
  if (isUiPrototype) {
    return (
      <ValuationPrototype
        onSignOut={onSignOut}
        showSignOut={screen.kind === "valuation"}
      />
    );
  }

  if (screen.kind === "choose-realm") {
    return (
      <View style={styles.body}>
        <View style={styles.top}>
          <View />
          <GearButton label={screen.settingsLabel} onPress={onOpenSettings} />
        </View>
        <Text style={styles.realmTitle}>{screen.title}</Text>
        <View style={styles.realmStack}>
          {screen.realms.map((realm) => (
            <Pressable
              key={realm.key}
              accessibilityRole="button"
              accessibilityLabel={`${realm.key}. ${realm.name}`}
              accessibilityState={{ selected: realm.selected }}
              onPress={() => onChooseRealm(realm.key)}
              style={[styles.realmCard, realm.selected && styles.realmCardOn]}
            >
              <RealmFlag realm={realm.key} />
              <View style={styles.realmScrim} />
              <View style={styles.realmLabel}>
                <Text style={styles.realmCode}>{realm.key}</Text>
                <Text style={styles.realmName}>{realm.name}</Text>
              </View>
            </Pressable>
          ))}
        </View>
      </View>
    );
  }

  if (screen.kind === "settings") {
    return (
      <View style={styles.body}>
        <View style={styles.top}>
          <Pressable onPress={onCloseSettings} hitSlop={12}>
            <Text style={styles.textButton}>{screen.backLabel}</Text>
          </Pressable>
        </View>
        <Text style={styles.realmTitle}>{screen.title}</Text>
        <ScrollView contentContainerStyle={styles.languageList}>
          {screen.languages.map((item) => (
            <Pressable
              key={item.id}
              onPress={() => onChooseLanguage(item.id)}
              style={[styles.languageRow, item.selected && styles.languageRowOn]}
            >
              <Text
                style={[
                  styles.languageLabel,
                  item.selected && styles.languageLabelOn,
                ]}
              >
                {item.native}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>
    );
  }

  const symbol = screen.symbol;

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
        <View style={styles.topRight}>
          <GearButton label={screen.settingsLabel} onPress={onOpenSettings} />
          <ChromeButton
            icon="close"
            label={screen.signOutLabel}
            onPress={onSignOut}
          />
        </View>
      </View>
      <View style={styles.hero}>
        <Text style={styles.kicker}>{screen.kicker}</Text>
        <HeroAmount snapshot={screen.snapshot} symbol={symbol} />
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
  topRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  chromeButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  realmTitle: {
    color: "#f3f1ea",
    fontSize: 22,
    fontWeight: "600",
    marginBottom: 18,
  },
  realmStack: {
    flex: 1,
    gap: 10,
  },
  realmCard: {
    flex: 1,
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "transparent",
  },
  realmCardOn: {
    borderColor: "#e7c46a",
  },
  realmScrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  realmLabel: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 14,
  },
  realmCode: {
    color: "#ffffff",
    fontSize: 28,
    fontWeight: "700",
    letterSpacing: 0.4,
  },
  realmName: {
    color: "#f3f1ea",
    fontSize: 15,
    marginTop: 2,
  },
  languageList: {
    gap: 8,
    paddingBottom: 24,
  },
  languageRow: {
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: "#1a1d24",
  },
  languageRowOn: {
    backgroundColor: "#2a2618",
  },
  languageLabel: {
    color: "#f3f1ea",
    fontSize: 16,
  },
  languageLabelOn: {
    color: "#e7c46a",
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
