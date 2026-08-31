import { StyleSheet, Text, type StyleProp, type TextStyle } from "react-native";
import { splitRubDisplay } from "./rub-display";

const KOPECK_SIZE = 0.7;
const KOPECK_OPACITY = 0.55;

export function RubAmount({
  amount,
  symbol = "₽",
  style,
}: {
  amount: number;
  symbol?: string;
  style?: StyleProp<TextStyle>;
}) {
  const { integer, kopecks } = splitRubDisplay(amount);
  const fontSize = StyleSheet.flatten(style)?.fontSize;
  return (
    <Text style={style}>
      {integer}
      <Text
        style={{
          fontSize:
            fontSize != null ? Math.round(fontSize * KOPECK_SIZE) : undefined,
          opacity: KOPECK_OPACITY,
        }}
      >
        ,{kopecks}
      </Text>
      {` ${symbol}`}
    </Text>
  );
}
