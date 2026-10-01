import { ScrollView, StyleSheet, Text, View } from "react-native";
import {
  basketSummary,
  currencies,
  kicker,
  premiumTanks,
  researchableTanks,
  sumMoney,
} from "./fixture";
import { PrototypeAmount } from "./PrototypeAmount";
import { PrototypeLine } from "./PrototypeLine";

export function VariantC() {
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
          value={sumMoney}
          symbol="€"
          style={styles.sum}
        />
      </View>
      <View style={styles.currencyBand}>
        {rows.map((line) => (
          <PrototypeLine
            key={line.name}
            name={line.name}
            count={line.count}
            value={line.amount}
            symbol="€"
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
  currencyBand: {
    backgroundColor: "#1a1d24",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 8,
  },
});
