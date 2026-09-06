import { useMemo } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { AuthGate } from "@/components/auth-gate";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { PrimaryButton, SectionTitle, StatusPill, SurfaceCard } from "@/components/awaken-ui";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import { formatDate, formatTime, idempotencyKey, priorityTone } from "@/lib/awakening";
import { router } from "expo-router";

function PlanContent() {
  const colors = useColors();
  const utils = trpc.useUtils();
  const now = useMemo(() => new Date(), []);
  const nextWeek = useMemo(() => new Date(now.getTime() + 14 * 86_400_000), [now]);
  const tasks = trpc.tasks.list.useQuery({ from: now.toISOString(), to: nextWeek.toISOString() });
  const completeTask = trpc.tasks.complete.useMutation({ onSuccess: () => void Promise.all([utils.tasks.list.invalidate(), utils.dashboard.today.invalidate(), utils.progress.summary.invalidate()]) });

  if (tasks.isLoading) return <ScreenContainer className="items-center justify-center"><ActivityIndicator color={colors.primary} /></ScreenContainer>;
  if (tasks.isError) return <ScreenContainer className="p-6 justify-center"><SurfaceCard><Text style={[styles.title, { color: colors.foreground }]}>Plan unavailable.</Text><Text style={[styles.muted, { color: colors.muted }]}>Try refreshing your schedule.</Text><PrimaryButton title="Refresh" icon="arrow.clockwise" onPress={() => void tasks.refetch()} /></SurfaceCard></ScreenContainer>;

  return (
    <ScreenContainer className="px-5">
      <FlatList
        data={tasks.data ?? []}
        keyExtractor={(task) => String(task.id)}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={<View style={styles.header}><Text style={[styles.eyebrow, { color: colors.primary }]}>YOUR HORIZON</Text><Text style={[styles.title, { color: colors.foreground }]}>Plan with intention.</Text><Text style={[styles.muted, { color: colors.muted }]}>A clear view of what’s coming next, without the clutter.</Text><SectionTitle title="Next 14 days" /></View>}
        ListEmptyComponent={<SurfaceCard style={styles.empty}><View style={[styles.emptyIcon, { backgroundColor: colors.accent }]}><IconSymbol name="calendar" size={22} color={colors.primary} /></View><Text style={[styles.emptyTitle, { color: colors.foreground }]}>No upcoming quests.</Text><Text style={[styles.muted, { color: colors.muted }]}>Use AI to turn your next goal into a plan.</Text><PrimaryButton title="Plan with AI" icon="sparkles" onPress={() => router.push("/ai")} /></SurfaceCard>}
        renderItem={({ item }) => (
          <SurfaceCard style={styles.taskCard}>
            <View style={styles.taskRow}>
              <View style={[styles.dateBlock, { backgroundColor: colors.accent }]}><Text style={[styles.dateText, { color: colors.primary }]}>{formatDate(item.scheduledStart)}</Text><Text style={[styles.timeText, { color: colors.muted }]}>{formatTime(item.scheduledStart)}</Text></View>
              <View style={styles.taskCopy}><View style={styles.taskHeading}><Text style={[styles.taskTitle, { color: colors.foreground }]}>{item.title}</Text><StatusPill label={item.priority} tone={priorityTone(item.priority)} /></View><Text style={[styles.taskMeta, { color: colors.muted }]}>{item.category} · {item.durationMinutes} min · +{item.xpReward} XP</Text></View>
            </View>
            {item.status !== "completed" && item.status !== "cancelled" ? <Pressable onPress={() => completeTask.mutate({ id: item.id, idempotencyKey: idempotencyKey(`plan-${item.id}`) })} style={({ pressed }) => [styles.completeButton, { borderColor: colors.border }, pressed && { opacity: 0.6 }]}><IconSymbol name="checkmark.circle.fill" size={16} color={colors.success} /><Text style={[styles.completeText, { color: colors.foreground }]}>Complete quest</Text></Pressable> : <Text style={[styles.completed, { color: colors.success }]}>Completed</Text>}
          </SurfaceCard>
        )}
      />
    </ScreenContainer>
  );
}

export default function PlanScreen() { return <AuthGate><PlanContent /></AuthGate>; }

const styles = StyleSheet.create({
  content: { paddingTop: 22, paddingBottom: 32, gap: 12 },
  header: { gap: 7, marginBottom: 8 },
  eyebrow: { fontSize: 11, fontWeight: "900", letterSpacing: 1.4 },
  title: { fontSize: 30, lineHeight: 35, fontWeight: "900", letterSpacing: -0.8 },
  muted: { fontSize: 14, lineHeight: 21 },
  taskCard: { gap: 15 },
  taskRow: { flexDirection: "row", gap: 12, alignItems: "center" },
  dateBlock: { width: 76, minHeight: 60, borderRadius: 15, padding: 9, justifyContent: "center" },
  dateText: { fontSize: 12, fontWeight: "900" },
  timeText: { fontSize: 11, fontWeight: "700", marginTop: 4 },
  taskCopy: { flex: 1, gap: 6 },
  taskHeading: { gap: 7 },
  taskTitle: { fontSize: 16, lineHeight: 21, fontWeight: "800" },
  taskMeta: { fontSize: 12, fontWeight: "600" },
  completeButton: { borderWidth: 1, minHeight: 38, borderRadius: 12, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 7 },
  completeText: { fontSize: 13, fontWeight: "800" },
  completed: { fontSize: 13, fontWeight: "800" },
  empty: { gap: 10, alignItems: "flex-start" },
  emptyIcon: { width: 44, height: 44, borderRadius: 15, alignItems: "center", justifyContent: "center" },
  emptyTitle: { fontSize: 18, fontWeight: "900" },
});
