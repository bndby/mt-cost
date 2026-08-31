import { ScrollView, StyleSheet, Text, View } from "react-native";
import { RubAmount } from "../RubAmount";
import {
  currencies,
  kicker,
  premiumTanks,
  researchableTanks,
  sumRub,
} from "./fixture";
import { PrototypeLine } from "./PrototypeLine";

function Basket({
  title,
  lines,
}: {
  title: string;
  lines: { name: string; count: number; rubles: number }[];
}) {
  if (lines.length === 0) return null;
  return (
    <View style={styles.basket}>
      <Text style={styles.basketTitle}>{title}</Text>
      {lines.map((line) => (
        <PrototypeLine key={line.name} {...line} />
      ))}
    </View>
  );
}

export function VariantC() {
  return (
    <ScrollView contentContainerStyle={styles.root}>
      <View style={styles.hero}>
        <Text style={styles.kicker}>{kicker}</Text>
        <RubAmount rubles={sumRub} style={styles.sum} />
      </View>
      <View style={styles.currencyBand}>
        {currencies.map((line) => (
          <PrototypeLine key={line.name} {...line} />
        ))}
      </View>
      <View style={styles.baskets}>
        <Basket title="Премиумные танки" lines={premiumTanks} />
        <Basket title="Прокачиваемые танки" lines={researchableTanks} />
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
  currencyBand: {
    backgroundColor: "#1a1d24",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 8,
  },
  baskets: {
    flexDirection: "row",
    gap: 14,
    alignItems: "flex-start",
  },
  basket: {
    flex: 1,
    minWidth: 0,
    gap: 8,
  },
  basketTitle: {
    fontSize: 11,
    color: "#8c887c",
    lineHeight: 14,
    marginBottom: 2,
  },
});
