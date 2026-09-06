import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import { AuthGate } from "@/components/auth-gate";
import { GhostButton, PrimaryButton, SectionTitle, SurfaceCard } from "@/components/awaken-ui";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { ScreenContainer } from "@/components/screen-container";
import { useAuth } from "@/hooks/use-auth";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";

function ProfileContent() {
  const colors = useColors();
  const { user, logout } = useAuth();
  const profile = trpc.me.profile.useQuery();
  const preferences = trpc.me.preferences.useQuery();
  const utils = trpc.useUtils();
  const update = trpc.me.updatePreferences.useMutation({ onSuccess: () => void utils.me.preferences.invalidate() });
  const [timezone, setTimezone] = useState("UTC");
  const [capacity, setCapacity] = useState("120");
  const [notifications, setNotifications] = useState(true);
  useEffect(() => {
    if (preferences.data) {
      setTimezone(preferences.data.timezone);
      setCapacity(String(preferences.data.dailyCapacityMinutes));
      try { setNotifications(JSON.parse(preferences.data.notificationPreferences).enabled !== false); } catch { setNotifications(true); }
    }
  }, [preferences.data]);

  if (profile.isLoading || preferences.isLoading) return <ScreenContainer className="items-center justify-center"><ActivityIndicator color={colors.primary} /></ScreenContainer>;
  return (
    <ScreenContainer className="px-5">
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.eyebrow, { color: colors.primary }]}>YOUR AWAKENING</Text><Text style={[styles.title, { color: colors.foreground }]}>Shape the system around you.</Text><Text style={[styles.muted, { color: colors.muted }]}>Simple inputs now. Smarter planning later.</Text>
        <SurfaceCard style={styles.profileCard}><View style={[styles.avatar, { backgroundColor: colors.accent }]}><Text style={[styles.avatarText, { color: colors.primary }]}>{(profile.data?.name ?? user?.name ?? "A").slice(0, 1).toUpperCase()}</Text></View><View style={styles.profileCopy}><Text style={[styles.name, { color: colors.foreground }]}>{profile.data?.name ?? user?.name ?? "Awakened player"}</Text><Text style={[styles.email, { color: colors.muted }]}>{profile.data?.email ?? user?.email ?? "Account connected"}</Text></View><View style={styles.rank}><Text style={[styles.rankValue, { color: colors.primary }]}>L{profile.data?.level ?? 1}</Text><Text style={[styles.rankLabel, { color: colors.muted }]}>{profile.data?.rank ?? "E"}</Text></View></SurfaceCard>
        <SectionTitle title="Planning preferences" />
        <SurfaceCard style={styles.formCard}><Text style={[styles.label, { color: colors.muted }]}>Timezone</Text><TextInput value={timezone} onChangeText={setTimezone} placeholder="Asia/Kolkata" placeholderTextColor={colors.muted} style={[styles.input, { color: colors.foreground, borderColor: colors.border }]} /><Text style={[styles.label, { color: colors.muted }]}>Daily capacity (minutes)</Text><TextInput value={capacity} onChangeText={setCapacity} keyboardType="number-pad" placeholder="120" placeholderTextColor={colors.muted} style={[styles.input, { color: colors.foreground, borderColor: colors.border }]} /><View style={styles.settingRow}><View style={styles.settingCopy}><Text style={[styles.settingTitle, { color: colors.foreground }]}>Quest reminders</Text><Text style={[styles.mutedSmall, { color: colors.muted }]}>Keep your next action visible.</Text></View><Switch value={notifications} onValueChange={setNotifications} trackColor={{ false: colors.border, true: colors.accent }} thumbColor={notifications ? colors.primary : colors.muted} /></View><PrimaryButton title={update.isPending ? "Saving…" : "Save preferences"} onPress={() => update.mutate({ timezone: timezone.trim() || "UTC", availabilityWindows: preferences.data?.availabilityWindows ?? "[]", dailyCapacityMinutes: Math.max(15, Number(capacity) || 120), notificationPreferences: JSON.stringify({ enabled: notifications }) })} loading={update.isPending} /></SurfaceCard>
        <SectionTitle title="Account & privacy" />
        <SurfaceCard style={styles.menuCard}><Pressable style={({ pressed }) => [styles.menuRow, pressed && { opacity: 0.6 }]} onPress={() => undefined}><IconSymbol name="info" size={19} color={colors.primary} /><View style={styles.menuCopy}><Text style={[styles.menuTitle, { color: colors.foreground }]}>How AWAKEN works</Text><Text style={[styles.mutedSmall, { color: colors.muted }]}>AI recommends. The app validates and executes.</Text></View><IconSymbol name="chevron.right" size={18} color={colors.muted} /></Pressable><Pressable style={({ pressed }) => [styles.menuRow, pressed && { opacity: 0.6 }]} onPress={() => undefined}><IconSymbol name="settings" size={19} color={colors.primary} /><View style={styles.menuCopy}><Text style={[styles.menuTitle, { color: colors.foreground }]}>Data controls</Text><Text style={[styles.mutedSmall, { color: colors.muted }]}>Export or delete your account in the next release.</Text></View><IconSymbol name="chevron.right" size={18} color={colors.muted} /></Pressable></SurfaceCard>
        <GhostButton title="Log out" icon="logout" onPress={() => void logout()} />
        {update.isError ? <Text style={[styles.error, { color: colors.error }]}>{update.error.message}</Text> : null}
      </ScrollView>
    </ScreenContainer>
  );
}

export default function ProfileScreen() { return <AuthGate><ProfileContent /></AuthGate>; }

const styles = StyleSheet.create({
  content: { paddingTop: 22, paddingBottom: 40, gap: 12 },
  eyebrow: { fontSize: 11, fontWeight: "900", letterSpacing: 1.4 },
  title: { fontSize: 30, lineHeight: 35, fontWeight: "900", letterSpacing: -0.8 },
  muted: { fontSize: 14, lineHeight: 21 },
  mutedSmall: { fontSize: 11, lineHeight: 16 },
  profileCard: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 8 },
  avatar: { width: 52, height: 52, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 22, fontWeight: "900" },
  profileCopy: { flex: 1 },
  name: { fontSize: 17, fontWeight: "900" },
  email: { fontSize: 12, marginTop: 3 },
  rank: { alignItems: "flex-end" },
  rankValue: { fontSize: 16, fontWeight: "900" },
  rankLabel: { fontSize: 10, fontWeight: "800", letterSpacing: 1 },
  formCard: { gap: 10 },
  label: { fontSize: 11, fontWeight: "800", letterSpacing: 0.3, marginTop: 2 },
  input: { minHeight: 46, borderWidth: 1, borderRadius: 13, paddingHorizontal: 13, fontSize: 14 },
  settingRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 3, marginBottom: 3 },
  settingCopy: { flex: 1, gap: 2 },
  settingTitle: { fontSize: 14, fontWeight: "800" },
  menuCard: { paddingVertical: 4 },
  menuRow: { minHeight: 68, flexDirection: "row", alignItems: "center", gap: 11, borderBottomWidth: 0.5, borderBottomColor: "rgba(120,130,160,0.18)" },
  menuCopy: { flex: 1, gap: 2 },
  menuTitle: { fontSize: 14, fontWeight: "800" },
  error: { fontSize: 12, textAlign: "center" },
});
