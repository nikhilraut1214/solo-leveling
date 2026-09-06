import { router } from "expo-router";
import { useMemo } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { AuthGate } from "@/components/auth-gate";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Metric, PrimaryButton, ProgressBar, SectionTitle, StatusPill, SurfaceCard } from "@/components/awaken-ui";
import { ScreenContainer } from "@/components/screen-container";
import { useAuth } from "@/hooks/use-auth";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import { formatDayHeading, formatTime, idempotencyKey, priorityTone } from "@/lib/awakening";

function TodayContent() {
  const colors = useColors();
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const today = trpc.dashboard.today.useQuery();
  const completeTask = trpc.tasks.complete.useMutation({
    onSuccess: async () => {
      await Promise.all([utils.dashboard.today.invalidate(), utils.progress.summary.invalidate(), utils.progress.xpTransactions.invalidate()]);
    },
  });
  const tasks = today.data?.tasks ?? [];
  const total = tasks.length;
  const completed = tasks.filter((task) => task.status === "completed").length;
  const completion = total ? (completed / total) * 100 : 0;
  const currentXp = today.data?.user?.totalXp ?? 0;
  const level = today.data?.user?.level ?? 1;
  const rank = today.data?.user?.rank ?? "E";
  const firstName = today.data?.user?.name?.split(" ")[0] ?? user?.name?.split(" ")[0] ?? "Awakened";
  const xpToNext = Math.max(1, 100 + level * 50);
  const xpProgress = ((currentXp % xpToNext) / xpToNext) * 100;

  const header = useMemo(() => (
    <View style={styles.headerContent}>
      <View style={styles.topRow}>
        <View>
          <Text style={[styles.eyebrow, { color: colors.primary }]}>TODAY · {formatDayHeading()}</Text>
          <Text style={[styles.title, { color: colors.foreground }]}>Good morning, {firstName}.</Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>Your next level starts with one focused move.</Text>
        </View>
        <View style={[styles.rankBadge, { backgroundColor: colors.accent }]}>
          <Text style={[styles.rankText, { color: colors.primary }]}>{rank}</Text>
          <Text style={[styles.rankLabel, { color: colors.muted }]}>RANK</Text>
        </View>
      </View>

      <SurfaceCard style={styles.progressCard}>
        <View style={styles.progressTop}>
          <View>
            <Text style={[styles.cardEyebrow, { color: colors.muted }]}>CURRENT LEVEL</Text>
            <Text style={[styles.levelText, { color: colors.foreground }]}>Level {level}</Text>
          </View>
          <View style={styles.xpCopy}>
            <Text style={[styles.xpValue, { color: colors.primary }]}>{currentXp} XP</Text>
            <Text style={[styles.xpLabel, { color: colors.muted }]}>total earned</Text>
          </View>
        </View>
        <ProgressBar value={xpProgress} />
        <View style={styles.progressBottom}>
          <Text style={[styles.progressHint, { color: colors.muted }]}>{Math.round(xpProgress)}% toward next level</Text>
          <Text style={[styles.progressHint, { color: colors.muted }]}>{completed}/{total} done</Text>
        </View>
      </SurfaceCard>

      <View style={styles.metricRow}>
        <Metric label="Daily progress" value={`${Math.round(completion)}%`} icon="target" />
        <Metric label="Current streak" value={`${today.data?.streak?.currentStreak ?? 0}d`} icon="bolt.fill" />
        <Metric label="Tasks today" value={total} icon="clock" />
      </View>

      <View style={styles.aiBanner}>
        <View style={[styles.aiIcon, { backgroundColor: colors.primary }]}><IconSymbol name="sparkles" size={20} color="#FFFFFF" /></View>
        <View style={styles.aiCopy}>
          <Text style={[styles.aiTitle, { color: colors.foreground }]}>Tell AWAKEN what matters.</Text>
          <Text style={[styles.aiSubtitle, { color: colors.muted }]}>Turn a thought into a validated, conflict-free task.</Text>
        </View>
        <Pressable accessibilityRole="button" onPress={() => router.push("/ai")} style={({ pressed }) => [styles.aiArrow, pressed && { opacity: 0.6 }]}><IconSymbol name="chevron.right" size={20} color={colors.primary} /></Pressable>
      </View>

      <SectionTitle title="Today’s quests" action="View plan" onAction={() => router.push("/plan")} />
    </View>
  ), [colors, firstName, rank, level, currentXp, xpProgress, completed, total, completion, today.data?.streak?.currentStreak]);

  if (today.isLoading) return <ScreenContainer className="items-center justify-center"><ActivityIndicator color={colors.primary} /></ScreenContainer>;
  if (today.isError) return <ScreenContainer className="p-6 justify-center"><SurfaceCard><Text style={[styles.errorTitle, { color: colors.foreground }]}>Couldn’t load today.</Text><Text style={[styles.subtitle, { color: colors.muted }]}>Check your connection and try again.</Text><PrimaryButton title="Try again" icon="arrow.clockwise" onPress={() => void today.refetch()} /></SurfaceCard></ScreenContainer>;

  return (
    <ScreenContainer className="px-5">
      <FlatList
        data={tasks}
        keyExtractor={(task) => String(task.id)}
        ListHeaderComponent={header}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <SurfaceCard style={styles.taskCard}>
            <View style={styles.taskTop}>
              <View style={[styles.taskDot, { backgroundColor: item.status === "completed" ? colors.success : colors.primary }]} />
              <View style={styles.taskMain}>
                <Text style={[styles.taskTitle, { color: item.status === "completed" ? colors.muted : colors.foreground, textDecorationLine: item.status === "completed" ? "line-through" : "none" }]}>{item.title}</Text>
                <View style={styles.taskMeta}><IconSymbol name="clock" size={13} color={colors.muted} /><Text style={[styles.taskMetaText, { color: colors.muted }]}>{formatTime(item.scheduledStart, today.data?.timezone)} · {item.durationMinutes} min</Text></View>
              </View>
              <StatusPill label={item.priority} tone={priorityTone(item.priority)} />
            </View>
            {item.status !== "completed" && item.status !== "cancelled" ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => completeTask.mutate({ id: item.id, idempotencyKey: idempotencyKey(`complete-${item.id}`) })}
                style={({ pressed }) => [styles.completeButton, { borderColor: colors.border }, pressed && { opacity: 0.65 }]}
              >
                <IconSymbol name="checkmark.circle.fill" size={17} color={colors.success} />
                <Text style={[styles.completeText, { color: colors.foreground }]}>{completeTask.isPending ? "Saving…" : "Mark complete"}</Text>
              </Pressable>
            ) : <Text style={[styles.doneLabel, { color: colors.success }]}>Completed · +{item.xpReward} XP</Text>}
          </SurfaceCard>
        )}
        ListEmptyComponent={<SurfaceCard style={styles.emptyCard}><View style={[styles.emptyIcon, { backgroundColor: colors.accent }]}><IconSymbol name="sparkles" size={22} color={colors.primary} /></View><Text style={[styles.emptyTitle, { color: colors.foreground }]}>Your day is a blank canvas.</Text><Text style={[styles.subtitle, { color: colors.muted }]}>Ask AWAKEN to schedule the next thing you want to make real.</Text><PrimaryButton title="Create with AI" icon="sparkles" onPress={() => router.push("/ai")} /></SurfaceCard>}
      />
    </ScreenContainer>
  );
}

export default function TodayScreen() {
  return <AuthGate><TodayContent /></AuthGate>;
}

const styles = StyleSheet.create({
  listContent: { paddingTop: 22, paddingBottom: 32, gap: 12 },
  headerContent: { gap: 18 },
  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  eyebrow: { fontSize: 11, fontWeight: "900", letterSpacing: 1.4, marginBottom: 8 },
  title: { fontSize: 29, lineHeight: 34, fontWeight: "900", letterSpacing: -0.8 },
  subtitle: { fontSize: 14, lineHeight: 21, marginTop: 6 },
  rankBadge: { width: 54, height: 62, borderRadius: 17, alignItems: "center", justifyContent: "center", gap: 1 },
  rankText: { fontSize: 25, fontWeight: "900" },
  rankLabel: { fontSize: 9, fontWeight: "900", letterSpacing: 1 },
  progressCard: { gap: 13 },
  progressTop: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" },
  cardEyebrow: { fontSize: 10, fontWeight: "900", letterSpacing: 1.1 },
  levelText: { fontSize: 24, fontWeight: "900", marginTop: 3 },
  xpCopy: { alignItems: "flex-end" },
  xpValue: { fontSize: 18, fontWeight: "900" },
  xpLabel: { fontSize: 11, marginTop: 2 },
  progressBottom: { flexDirection: "row", justifyContent: "space-between" },
  progressHint: { fontSize: 11, fontWeight: "600" },
  metricRow: { flexDirection: "row", gap: 12 },
  aiBanner: { borderRadius: 20, padding: 15, backgroundColor: "rgba(109,93,251,0.10)", flexDirection: "row", alignItems: "center", gap: 12 },
  aiIcon: { width: 40, height: 40, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  aiCopy: { flex: 1 },
  aiTitle: { fontSize: 14, fontWeight: "800" },
  aiSubtitle: { fontSize: 12, lineHeight: 17, marginTop: 2 },
  aiArrow: { padding: 6 },
  taskCard: { gap: 15 },
  taskTop: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  taskDot: { width: 10, height: 10, borderRadius: 5, marginTop: 5 },
  taskMain: { flex: 1, gap: 5 },
  taskTitle: { fontSize: 16, fontWeight: "800", lineHeight: 21 },
  taskMeta: { flexDirection: "row", alignItems: "center", gap: 5 },
  taskMetaText: { fontSize: 12, fontWeight: "600" },
  completeButton: { minHeight: 38, borderRadius: 12, borderWidth: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7 },
  completeText: { fontSize: 13, fontWeight: "800" },
  doneLabel: { fontSize: 13, fontWeight: "800" },
  emptyCard: { gap: 10, alignItems: "flex-start" },
  emptyIcon: { width: 44, height: 44, borderRadius: 15, alignItems: "center", justifyContent: "center" },
  emptyTitle: { fontSize: 18, fontWeight: "900" },
  errorTitle: { fontSize: 18, fontWeight: "800", marginBottom: 3 },
});
