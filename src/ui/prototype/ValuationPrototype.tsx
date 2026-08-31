// Three variants of the valuation screen with a transparent property
// breakdown, switchable via the prototype bar, on the existing PlayerScreen.
// Fixture data; not production.

import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { PrototypeSwitcher, type VariantKey } from "./PrototypeSwitcher";
import { VariantA } from "./VariantA";
import { VariantB } from "./VariantB";
import { VariantC } from "./VariantC";

export const isUiPrototype =
  process.env.NODE_ENV !== "production" &&
  process.env.EXPO_PUBLIC_UI_PROTOTYPE === "1";

export function ValuationPrototype({
  onSignOut,
  showSignOut,
}: {
  onSignOut: () => void;
  showSignOut: boolean;
}) {
  const [variant, setVariant] = useState<VariantKey>("A");

  return (
    <View style={styles.body}>
      <View style={styles.top}>
        {showSignOut ? (
          <Pressable onPress={onSignOut} hitSlop={12}>
            <Text style={styles.textButton}>Выйти</Text>
          </Pressable>
        ) : (
          <Text style={styles.textButton}>прототип</Text>
        )}
      </View>
      {variant === "A" ? <VariantA /> : null}
      {variant === "B" ? <VariantB /> : null}
      {variant === "C" ? <VariantC /> : null}
      <View style={styles.switcherSpace} />
      <PrototypeSwitcher current={variant} onChange={setVariant} />
    </View>
  );
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
    paddingHorizontal: 22,
    paddingBottom: 12,
    paddingTop: 12,
  },
  top: {
    minHeight: 36,
    alignItems: "flex-end",
    justifyContent: "center",
  },
  textButton: {
    color: "#c9c4b6",
    fontSize: 14,
  },
  switcherSpace: {
    height: 108,
  },
});
