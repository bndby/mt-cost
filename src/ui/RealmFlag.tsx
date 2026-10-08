import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import type { Realm } from "../packages/player-session";

const RATIO: Record<Realm, number> = {
  NA: 1.9,
  EU: 1.5,
  ASIA: 1.5,
};

function coverBox(boxW: number, boxH: number, ratio: number) {
  if (boxW / boxH > ratio) {
    const height = boxW / ratio;
    return { width: boxW, height, left: 0, top: (boxH - height) / 2 };
  }
  const width = boxH * ratio;
  return { width, height: boxH, left: (boxW - width) / 2, top: 0 };
}

function Star({
  size,
  color,
  left,
  top,
  rotate = 0,
}: {
  size: number;
  color: string;
  left: number;
  top: number;
  rotate?: number;
}) {
  return (
    <Text
      style={{
        position: "absolute",
        left: left - size / 2,
        top: top - size / 2,
        width: size,
        height: size,
        color,
        fontSize: size,
        lineHeight: size,
        textAlign: "center",
        transform: [{ rotate: `${rotate}deg` }],
      }}
    >
      ★
    </Text>
  );
}

function NaFlag({ width, height }: { width: number; height: number }) {
  const cantonW = width * 0.4;
  const cantonH = height * (7 / 13);
  const starRows = [6, 5, 6, 5, 6, 5, 6, 5, 6];
  const star = Math.min(cantonW / 14, cantonH / 12);
  return (
    <View style={{ width, height, backgroundColor: "#ffffff" }}>
      {Array.from({ length: 13 }, (_, index) => (
        <View
          key={index}
          style={{
            height: height / 13,
            backgroundColor: index % 2 === 0 ? "#b22234" : "#ffffff",
          }}
        />
      ))}
      <View
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: cantonW,
          height: cantonH,
          backgroundColor: "#3c3b6e",
        }}
      >
        {starRows.map((count, row) =>
          Array.from({ length: count }, (_, col) => {
            const x =
              count === 6
                ? ((col + 0.5) * cantonW) / 6
                : ((col + 1) * cantonW) / 6;
            const y = ((row + 0.5) * cantonH) / 9;
            return (
              <Star
                key={`${row}-${col}`}
                size={star}
                color="#ffffff"
                left={x}
                top={y}
              />
            );
          }),
        )}
      </View>
    </View>
  );
}

function EuFlag({ width, height }: { width: number; height: number }) {
  const radius = Math.min(width, height) * 0.3;
  const star = Math.min(width, height) * 0.1;
  return (
    <View style={{ width, height, backgroundColor: "#003399" }}>
      {Array.from({ length: 12 }, (_, index) => {
        const angle = -Math.PI / 2 + (index * 2 * Math.PI) / 12;
        return (
          <Star
            key={index}
            size={star}
            color="#fc0"
            left={width / 2 + radius * Math.cos(angle)}
            top={height / 2 + radius * Math.sin(angle)}
          />
        );
      })}
    </View>
  );
}

function AsiaFlag({ width, height }: { width: number; height: number }) {
  const big = { x: width * (5 / 30), y: height * (5 / 20), size: height * 0.3 };
  const smallSize = height * 0.1;
  const small = [
    { x: width * (10 / 30), y: height * (2 / 20) },
    { x: width * (12 / 30), y: height * (4 / 20) },
    { x: width * (12 / 30), y: height * (7 / 20) },
    { x: width * (10 / 30), y: height * (9 / 20) },
  ];
  return (
    <View style={{ width, height, backgroundColor: "#de2910" }}>
      <Star size={big.size} color="#ffde00" left={big.x} top={big.y} />
      {small.map((star) => {
        const rotate =
          (Math.atan2(big.y - star.y, big.x - star.x) * 180) / Math.PI + 90;
        return (
          <Star
            key={`${star.x}-${star.y}`}
            size={smallSize}
            color="#ffde00"
            left={star.x}
            top={star.y}
            rotate={rotate}
          />
        );
      })}
    </View>
  );
}

export function RealmFlag({ realm }: { realm: Realm }) {
  const [box, setBox] = useState({ width: 0, height: 0 });
  const art =
    box.width > 0 && box.height > 0 ? coverBox(box.width, box.height, RATIO[realm]) : null;
  return (
    <View
      style={StyleSheet.absoluteFill}
      onLayout={(event) => {
        const { width, height } = event.nativeEvent.layout;
        setBox((prev) =>
          prev.width === width && prev.height === height ? prev : { width, height },
        );
      }}
    >
      {art ? (
        <View style={{ position: "absolute", ...art }}>
          {realm === "NA" ? <NaFlag width={art.width} height={art.height} /> : null}
          {realm === "EU" ? <EuFlag width={art.width} height={art.height} /> : null}
          {realm === "ASIA" ? <AsiaFlag width={art.width} height={art.height} /> : null}
        </View>
      ) : null}
    </View>
  );
}
