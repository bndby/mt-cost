import { Text } from "react-native";
import { RubAmount } from "../RubAmount";
import { formatCount, type PrototypeLine as Line } from "./fixture";

const NAME = {
  color: "#f3f1ea",
  fontSize: 14,
  lineHeight: 20,
} as const;

const PRICE: {
  color: string;
  fontSize: number;
  fontWeight: "700";
  fontVariant: Array<"tabular-nums">;
} = {
  color: "#ffffff",
  fontSize: 14,
  fontWeight: "700",
  fontVariant: ["tabular-nums"],
};

export function PrototypeLine({ name, count, rubles }: Line) {
  return (
    <Text style={NAME}>
      {name} ({formatCount(count)}) ={" "}
      <RubAmount rubles={rubles} style={PRICE} />
    </Text>
  );
}
