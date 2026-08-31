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

export function VariantA() {
  return (
    <View style={styles.root}>
      <View style={styles.hero}>
        <Text style={styles.kicker}>{kicker}</Text>
        <RubAmount amount={sumRub} style={styles.sum} />
      </View>
      <ScrollView
        style={styles.column}
        contentContainerStyle={styles.columnInner}
      >
        {currencies.map((line) => (
          <PrototypeLine
            key={line.name}
            name={line.name}
            count={line.count}
            value={line.rubles}
            symbol="₽"
          />
        ))}
        {premiumTanks.map((line) => (
          <PrototypeLine
            key={line.name}
            name={line.name}
            count={line.count}
            value={line.rubles}
            symbol="₽"
          />
        ))}
        {researchableTanks.map((line) => (
          <PrototypeLine
            key={line.name}
            name={line.name}
            count={line.count}
            value={line.rubles}
            symbol="₽"
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
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
    fontSize: 56,
    fontWeight: "600",
    letterSpacing: -1.5,
    lineHeight: 60,
    fontVariant: ["tabular-nums"],
  },
  column: {
    flexGrow: 0,
    flexShrink: 1,
    maxHeight: "42%",
    borderTopWidth: 1,
    borderTopColor: "#2a2d36",
    marginTop: 8,
  },
  columnInner: {
    paddingTop: 16,
    paddingBottom: 8,
    gap: 8,
  },
});
