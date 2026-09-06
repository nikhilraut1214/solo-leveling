import { ActivityIndicator, FlatList, StyleSheet, Text, View } from "react-native";
import { AuthGate } from "@/components/auth-gate";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Metric, ProgressBar, SectionTitle, SurfaceCard } from "@/components/awaken-ui";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import { formatDate } from "@/lib/awakening";

function ProgressContent() {
  const colors = useColors();
  const progress = trpc.progress.summary.useQuery();
  if (progress.isLoading) return <ScreenContainer className="items-center justify-center"><ActivityIndicator color={colors.primary} /></ScreenContainer>;
  if (progress.isError || !progress.data) return <ScreenContainer className="p-6 justify-center"><SurfaceCard><Text style={[styles.title, { color: colors.foreground }]}>Progress is taking a breather.</Text><Text style={[styles.muted, { color: colors.muted }]}>Refresh to load your current record.</Text></SurfaceCard></ScreenContainer>;
  const data = progress.data;
  const level = data.user?.level ?? 1;
  const totalXp = data.user?.totalXp ?? data.totalXpEarned;
  const nextLevelXp = 100 + level * 50;
  const progressValue = ((totalXp % nextLevelXp) / nextLevelXp) * 100;
  return (
    <ScreenContainer className="px-5">
      <FlatList
        data={data.xpTransactions}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={<View style={styles.header}><Text style={[styles.eyebrow, { color: colors.primary }]}>PLAYER RECORD</Text><Text style={[styles.title, { color: colors.foreground }]}>Progress you can feel.</Text><Text style={[styles.muted, { color: colors.muted }]}>Every completed quest leaves a trace.</Text><SurfaceCard style={styles.heroCard}><View style={styles.heroTop}><View style={[styles.heroIcon, { backgroundColor: colors.accent }]}><IconSymbol name="trophy" size={27} color={colors.primary} /></View><View><Text style={[styles.heroRank, { color: colors.primary }]}>RANK {data.user?.rank ?? "E"}</Text><Text style={[styles.heroLevel, { color: colors.foreground }]}>Level {level}</Text></View><View style={styles.heroXp}><Text style={[styles.heroXpValue, { color: colors.foreground }]}>{totalXp}</Text><Text style={[styles.mutedSmall, { color: colors.muted }]}>XP earned</Text></View></View><ProgressBar value={progressValue} /><Text style={[styles.mutedSmall, { color: colors.muted }]}>{Math.round(progressValue)}% toward the next level</Text></SurfaceCard><View style={styles.metrics}><Metric label="Quests complete" value={data.completedTasks} icon="checkmark.circle.fill" /><Metric label="Current streak" value={`${data.streak?.currentStreak ?? 0}d`} icon="bolt.fill" /><Metric label="Longest streak" value={`${data.streak?.longestStreak ?? 0}d`} icon="trophy" /></View><SectionTitle title="XP history" /></View>}
        ListEmptyComponent={<SurfaceCard><Text style={[styles.emptyTitle, { color: colors.foreground }]}>Your first XP is waiting.</Text><Text style={[styles.muted, { color: colors.muted }]}>Complete a quest from Today to start your record.</Text></SurfaceCard>}
        renderItem={({ item }) => <View style={[styles.xpRow, { borderBottomColor: colors.border }]}><View style={[styles.xpIcon, { backgroundColor: `${colors.success}18` }]}><IconSymbol name="bolt.fill" size={16} color={colors.success} /></View><View style={styles.xpCopy}><Text style={[styles.xpReason, { color: colors.foreground }]}>{item.reason}</Text><Text style={[styles.mutedSmall, { color: colors.muted }]}>{formatDate(item.createdAt)}</Text></View><Text style={[styles.amount, { color: colors.success }]}>+{item.amount}</Text></View>}
      />
    </ScreenContainer>
  );
}

export default function ProgressScreen() { return <AuthGate><ProgressContent /></AuthGate>; }

const styles = StyleSheet.create({
  content: { paddingTop: 22, paddingBottom: 32, gap: 12 },
  header: { gap: 8, marginBottom: 8 },
  eyebrow: { fontSize: 11, fontWeight: "900", letterSpacing: 1.4 },
  title: { fontSize: 30, lineHeight: 35, fontWeight: "900", letterSpacing: -0.8 },
  muted: { fontSize: 14, lineHeight: 21 },
  mutedSmall: { fontSize: 11, lineHeight: 16 },
  heroCard: { gap: 13, marginTop: 8 },
  heroTop: { flexDirection: "row", alignItems: "center", gap: 11 },
  heroIcon: { width: 52, height: 52, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  heroRank: { fontSize: 11, fontWeight: "900", letterSpacing: 1 },
  heroLevel: { fontSize: 21, fontWeight: "900", marginTop: 2 },
  heroXp: { marginLeft: "auto", alignItems: "flex-end" },
  heroXpValue: { fontSize: 23, fontWeight: "900" },
  metrics: { flexDirection: "row", gap: 12, marginBottom: 3 },
  xpRow: { minHeight: 68, borderBottomWidth: 1, flexDirection: "row", alignItems: "center", gap: 11 },
  xpIcon: { width: 34, height: 34, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  xpCopy: { flex: 1, gap: 2 },
  xpReason: { fontSize: 14, fontWeight: "700" },
  amount: { fontSize: 15, fontWeight: "900" },
  emptyTitle: { fontSize: 17, fontWeight: "800", marginBottom: 4 },
});
