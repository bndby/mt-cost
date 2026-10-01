import { StyleSheet, Text, type StyleProp, type TextStyle } from "react-native";
import { splitMoneyDisplay } from "./money-display";

const MINOR_SIZE = 0.7;
const MINOR_OPACITY = 0.55;

export function MoneyAmount({
  amount,
  symbol = "€",
  style,
}: {
  amount: number;
  symbol?: string;
  style?: StyleProp<TextStyle>;
}) {
  const { integer, minor } = splitMoneyDisplay(amount);
  const fontSize = StyleSheet.flatten(style)?.fontSize;
  return (
    <Text style={style}>
      {integer}
      <Text
        style={{
          fontSize:
            fontSize != null ? Math.round(fontSize * MINOR_SIZE) : undefined,
          opacity: MINOR_OPACITY,
        }}
      >
        ,{minor}
      </Text>
      {` ${symbol}`}
    </Text>
  );
}
