import { Text } from "react-native";
import { formatCount } from "./fixture";
import { PrototypeAmount } from "./PrototypeAmount";

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

export function PrototypeLine({
  name,
  count,
  value,
  symbol,
}: {
  name: string;
  count: number;
  value: number;
  symbol: string;
}) {
  return (
    <Text style={NAME}>
      {name} ({formatCount(count)}) ={" "}
      <PrototypeAmount value={value} symbol={symbol} style={PRICE} />
    </Text>
  );
}
