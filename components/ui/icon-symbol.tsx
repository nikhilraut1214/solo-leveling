import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { SymbolWeight } from "expo-symbols";
import { ComponentProps } from "react";
import { OpaqueColorValue, type StyleProp, type TextStyle } from "react-native";

export type IconSymbolName =
  | "house.fill"
  | "calendar"
  | "sparkles"
  | "chart.bar.fill"
  | "person.crop.circle"
  | "checkmark.circle.fill"
  | "plus"
  | "arrow.clockwise"
  | "clock"
  | "flag.fill"
  | "bolt.fill"
  | "target"
  | "chevron.right"
  | "close"
  | "settings"
  | "logout"
  | "info"
  | "warning"
  | "trophy"
  | "more";

type MaterialIconName = ComponentProps<typeof MaterialIcons>["name"];

const MAPPING: Record<IconSymbolName, MaterialIconName> = {
  "house.fill": "home",
  calendar: "calendar-today",
  sparkles: "auto-awesome",
  "chart.bar.fill": "bar-chart",
  "person.crop.circle": "account-circle",
  "checkmark.circle.fill": "check-circle",
  plus: "add",
  "arrow.clockwise": "refresh",
  clock: "schedule",
  "flag.fill": "flag",
  "bolt.fill": "bolt",
  target: "track-changes",
  "chevron.right": "chevron-right",
  close: "close",
  settings: "settings",
  logout: "logout",
  info: "info-outline",
  warning: "warning-amber",
  trophy: "emoji-events",
  more: "more-horiz",
};

export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return <MaterialIcons color={color} size={size} name={MAPPING[name]} style={style} />;
}
