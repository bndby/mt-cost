import { Pressable, StyleSheet, Text, View } from "react-native";
import { fixtureDump } from "./fixture";

export const VARIANTS = [
  { key: "A", name: "Чек" },
  { key: "B", name: "Смета" },
  { key: "C", name: "Две корзины" },
] as const;

export type VariantKey = (typeof VARIANTS)[number]["key"];

export function PrototypeSwitcher({
  current,
  onChange,
}: {
  current: VariantKey;
  onChange: (next: VariantKey) => void;
}) {
  const index = VARIANTS.findIndex((item) => item.key === current);
  const meta = VARIANTS[index] ?? VARIANTS[0];

  function cycle(step: number) {
    const next = VARIANTS[(index + step + VARIANTS.length) % VARIANTS.length];
    onChange(next.key);
  }

  return (
    <View style={styles.wrap} pointerEvents="box-none">
      <View style={styles.dump}>
        <Text style={styles.dumpText}>
          PROTOTYPE {JSON.stringify({ variant: current, ...fixtureDump })}
        </Text>
      </View>
      <View style={styles.bar}>
        <Pressable onPress={() => cycle(-1)} hitSlop={12} style={styles.arrow}>
          <Text style={styles.arrowLabel}>←</Text>
        </Pressable>
        <Text style={styles.label}>
          {meta.key} ({meta.name})
        </Text>
        <Pressable onPress={() => cycle(1)} hitSlop={12} style={styles.arrow}>
          <Text style={styles.arrowLabel}>→</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 12,
    alignItems: "center",
    gap: 8,
  },
  dump: {
    alignSelf: "stretch",
    backgroundColor: "#000000aa",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  dumpText: {
    color: "#9a968c",
    fontSize: 10,
    fontVariant: ["tabular-nums"],
  },
  bar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f3f1ea",
    borderRadius: 999,
    paddingHorizontal: 6,
    paddingVertical: 6,
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
    gap: 4,
  },
  arrow: {
    width: 40,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  arrowLabel: {
    color: "#12141a",
    fontSize: 18,
    fontWeight: "700",
  },
  label: {
    color: "#12141a",
    fontSize: 13,
    fontWeight: "700",
    minWidth: 128,
    textAlign: "center",
  },
});
