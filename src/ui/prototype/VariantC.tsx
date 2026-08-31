import Constants from "expo-constants";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import {
  basketSummary,
  currencies,
  DISPLAY_MONEY,
  kicker,
  premiumTanks,
  researchableTanks,
  sumRub,
  toDisplay,
  type DisplayMoney,
} from "./fixture";
import { PrototypeAmount } from "./PrototypeAmount";
import { PrototypeLine } from "./PrototypeLine";

const extra = Constants.expoConfig?.extra ?? {};
const RUB_PER_BYN = Number(extra.rubPerByn ?? "28.1618");
const RUB_PER_USD = Number(extra.rubPerUsd ?? "85.6007");

const MONEY: DisplayMoney[] = DISPLAY_MONEY.map((item) =>
  item.id === "byn"
    ? { ...item, rubPerUnit: RUB_PER_BYN }
    : item.id === "usd"
      ? { ...item, rubPerUnit: RUB_PER_USD }
      : item,
);

export function VariantC() {
  const [money, setMoney] = useState<DisplayMoney>(MONEY[0]);
  const rows = [
    ...currencies,
    basketSummary("Премиумные танки", premiumTanks),
    basketSummary("Прокачиваемые танки", researchableTanks),
  ].filter((line) => line != null);

  return (
    <ScrollView contentContainerStyle={styles.root}>
      <View style={styles.hero}>
        <Text style={styles.kicker}>{kicker}</Text>
        <PrototypeAmount
          value={toDisplay(sumRub, money)}
          symbol={money.symbol}
          style={styles.sum}
        />
        <View style={styles.switcher}>
          {MONEY.map((item) => {
            const on = item.id === money.id;
            return (
              <Pressable
                key={item.id}
                onPress={() => setMoney(item)}
                style={[styles.chip, on && styles.chipOn]}
              >
                <Text style={[styles.chipLabel, on && styles.chipLabelOn]}>
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
      <View style={styles.currencyBand}>
        {rows.map((line) => (
          <PrototypeLine
            key={line.name}
            name={line.name}
            count={line.count}
            value={toDisplay(line.rubles, money)}
            symbol={money.symbol}
          />
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    paddingBottom: 8,
    gap: 18,
  },
  hero: {
    paddingBottom: 4,
  },
  kicker: {
    fontSize: 13,
    letterSpacing: 0.4,
    color: "#8c887c",
    marginBottom: 6,
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
  currencyBand: {
    backgroundColor: "#1a1d24",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 8,
  },
});
