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

function Section({
  title,
  lines,
}: {
  title: string;
  lines: { name: string; count: number; rubles: number }[];
}) {
  if (lines.length === 0) return null;
  const total = lines.reduce((sum, line) => sum + line.rubles, 0);
  return (
    <View style={styles.section}>
      <View style={styles.sectionHead}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <RubAmount rubles={total} style={styles.sectionTotal} />
      </View>
      {lines.map((line) => (
        <PrototypeLine
          key={line.name}
          name={line.name}
          count={line.count}
          value={line.rubles}
          symbol="₽"
        />
      ))}
    </View>
  );
}

export function VariantB() {
  return (
    <View style={styles.root}>
      <View style={styles.hero}>
        <Text style={styles.kicker}>{kicker}</Text>
        <RubAmount rubles={sumRub} style={styles.sum} />
      </View>
      <ScrollView contentContainerStyle={styles.list}>
        <View style={styles.section}>
          {currencies.map((line) => (
            <PrototypeLine
              key={line.name}
              name={line.name}
              count={line.count}
              value={line.rubles}
              symbol="₽"
            />
          ))}
        </View>
        <Section title="Премиумные танки" lines={premiumTanks} />
        <Section title="Прокачиваемые танки" lines={researchableTanks} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  hero: {
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#2a2d36",
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
  list: {
    paddingTop: 16,
    paddingBottom: 8,
    gap: 22,
  },
  section: { gap: 8 },
  sectionHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: 2,
  },
  sectionTitle: {
    fontSize: 11,
    color: "#8c887c",
    lineHeight: 14,
  },
  sectionTotal: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
});
