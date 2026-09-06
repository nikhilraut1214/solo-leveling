import { PropsWithChildren } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";

export function SectionTitle({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  const colors = useColors();
  return (
    <View style={styles.sectionHeader}>
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{title}</Text>
      {action && onAction ? (
        <Pressable onPress={onAction} style={({ pressed }) => [styles.textAction, pressed && { opacity: 0.6 }]}>
          <Text style={[styles.textActionLabel, { color: colors.primary }]}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function SurfaceCard({ children, style }: PropsWithChildren<{ style?: object }>) {
  const colors = useColors();
  return <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }, style]}>{children}</View>;
}

export function PrimaryButton({ title, onPress, icon, disabled, loading }: { title: string; onPress: () => void; icon?: "sparkles" | "plus" | "checkmark.circle.fill" | "arrow.clockwise"; disabled?: boolean; loading?: boolean }) {
  const colors = useColors();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [styles.primaryButton, { backgroundColor: colors.primary }, (pressed || disabled) && { opacity: disabled ? 0.5 : 0.86, transform: [{ scale: 0.98 }] }]}
    >
      {loading ? <ActivityIndicator color="#FFFFFF" /> : icon ? <IconSymbol name={icon} size={18} color="#FFFFFF" /> : null}
      <Text style={styles.primaryButtonText}>{title}</Text>
    </Pressable>
  );
}

export function GhostButton({ title, onPress, icon }: { title: string; onPress: () => void; icon?: "close" | "more" | "settings" | "logout" }) {
  const colors = useColors();
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.ghostButton, { borderColor: colors.border }, pressed && { opacity: 0.65 }]}>
      {icon ? <IconSymbol name={icon} size={16} color={colors.muted} /> : null}
      <Text style={[styles.ghostButtonText, { color: colors.foreground }]}>{title}</Text>
    </Pressable>
  );
}

export function ProgressBar({ value, color }: { value: number; color?: string }) {
  const colors = useColors();
  return (
    <View style={[styles.progressTrack, { backgroundColor: colors.accent }]}>
      <View style={[styles.progressFill, { backgroundColor: color ?? colors.primary, width: `${Math.min(100, Math.max(0, value))}%` }]} />
    </View>
  );
}

export function StatusPill({ label, tone = "muted" }: { label: string; tone?: "muted" | "success" | "warning" | "primary" }) {
  const colors = useColors();
  const toneColor = tone === "success" ? colors.success : tone === "warning" ? colors.warning : tone === "primary" ? colors.primary : colors.muted;
  return <View style={[styles.pill, { backgroundColor: `${toneColor}20` }]}><Text style={[styles.pillText, { color: toneColor }]}>{label}</Text></View>;
}

export function Metric({ label, value, icon }: { label: string; value: string | number; icon: "bolt.fill" | "trophy" | "target" | "clock" | "checkmark.circle.fill" }) {
  const colors = useColors();
  return (
    <View style={styles.metric}>
      <View style={[styles.metricIcon, { backgroundColor: colors.accent }]}><IconSymbol name={icon} size={17} color={colors.primary} /></View>
      <Text style={[styles.metricValue, { color: colors.foreground }]}>{value}</Text>
      <Text style={[styles.metricLabel, { color: colors.muted }]}>{label}</Text>
    </View>
  );
}

export const styles = StyleSheet.create({
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: "700", letterSpacing: -0.2 },
  textAction: { paddingVertical: 4, paddingHorizontal: 4 },
  textActionLabel: { fontSize: 13, fontWeight: "700" },
  card: { borderRadius: 22, borderWidth: 1, padding: 18, shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 2 },
  primaryButton: { minHeight: 50, paddingHorizontal: 18, borderRadius: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  primaryButtonText: { color: "#FFFFFF", fontSize: 15, fontWeight: "800" },
  ghostButton: { minHeight: 42, borderRadius: 14, borderWidth: 1, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7 },
  ghostButtonText: { fontSize: 14, fontWeight: "700" },
  progressTrack: { height: 8, borderRadius: 999, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 999 },
  pill: { alignSelf: "flex-start", borderRadius: 999, paddingHorizontal: 9, paddingVertical: 5 },
  pillText: { fontSize: 11, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.4 },
  metric: { flex: 1, gap: 3 },
  metricIcon: { width: 32, height: 32, borderRadius: 10, alignItems: "center", justifyContent: "center", marginBottom: 3 },
  metricValue: { fontSize: 18, fontWeight: "800" },
  metricLabel: { fontSize: 11, fontWeight: "600" },
});
