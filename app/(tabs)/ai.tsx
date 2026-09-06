import { useState } from "react";
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { AuthGate } from "@/components/auth-gate";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { GhostButton, PrimaryButton, StatusPill, SurfaceCard } from "@/components/awaken-ui";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import { formatDate, formatTime, idempotencyKey, priorityTone } from "@/lib/awakening";
import type { AiPreviewResponse } from "@/shared/types";

 type ChatMessage = { id: string; role: "user" | "assistant"; text: string };

function AiContent() {
  const colors = useColors();
  const utils = trpc.useUtils();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: "welcome", role: "assistant", text: "Tell me what you want to accomplish. I’ll turn it into a clear task, check the timing, and show you the plan before anything is saved." },
  ]);
  const [preview, setPreview] = useState<AiPreviewResponse | null>(null);
  const ai = trpc.ai.message.useMutation();
  const commit = trpc.plans.commit.useMutation({
    onSuccess: async () => {
      setMessages((current) => [...current, { id: `saved-${Date.now()}`, role: "assistant", text: "Your quest is confirmed and ready for execution. It’s now on your Plan." }]);
      setPreview(null);
      await Promise.all([utils.tasks.list.invalidate(), utils.dashboard.today.invalidate(), utils.progress.summary.invalidate()]);
    },
  });

  const send = () => {
    const message = input.trim();
    if (!message || ai.isPending) return;
    setMessages((current) => [...current, { id: `user-${Date.now()}`, role: "user", text: message }]);
    setInput("");
    ai.mutate({ message }, { onSuccess: (result) => { setPreview(result); setMessages((current) => [...current, { id: `assistant-${Date.now()}`, role: "assistant", text: result.status === "clarification" ? result.question : "I’ve prepared a validated preview. Review it below before confirming." }]); } });
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={12}>
      <ScreenContainer className="px-5">
        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={<View style={styles.header}><View style={styles.aiMark}><IconSymbol name="sparkles" size={20} color="#FFFFFF" /></View><Text style={[styles.eyebrow, { color: colors.primary }]}>AWAKEN AI</Text><Text style={[styles.title, { color: colors.foreground }]}>What are you ready to make real?</Text><Text style={[styles.subtitle, { color: colors.muted }]}>AI recommends. AWAKEN validates, schedules, and waits for your confirmation.</Text></View>}
          renderItem={({ item }) => <View style={[styles.messageRow, item.role === "user" && styles.userRow]}><View style={[styles.messageBubble, { backgroundColor: item.role === "user" ? colors.primary : colors.surface, borderColor: colors.border }]}><Text style={[styles.messageText, { color: item.role === "user" ? "#FFFFFF" : colors.foreground }]}>{item.text}</Text></View></View>}
          ListFooterComponent={<View style={styles.footer}><PreviewCard preview={preview} onConfirm={(proposal) => commit.mutate({ proposal, confirmationKey: idempotencyKey("plan-confirm") })} confirming={commit.isPending} /><View style={styles.exampleRow}><Text style={[styles.exampleLabel, { color: colors.muted }]}>Try</Text><Pressable onPress={() => setInput("Study Java tomorrow at 7 PM for two hours")} style={({ pressed }) => [styles.example, { backgroundColor: colors.accent }, pressed && { opacity: 0.7 }]}><Text style={[styles.exampleText, { color: colors.primary }]}>Study Java tomorrow at 7 PM</Text></Pressable></View></View>}
        />
        <View style={[styles.composer, { backgroundColor: colors.surface, borderColor: colors.border }]}><TextInput value={input} onChangeText={setInput} onSubmitEditing={send} returnKeyType="send" placeholder="Tell AWAKEN what you need to do…" placeholderTextColor={colors.muted} multiline style={[styles.input, { color: colors.foreground }]} /><Pressable accessibilityRole="button" onPress={send} disabled={!input.trim() || ai.isPending} style={({ pressed }) => [styles.sendButton, { backgroundColor: colors.primary }, (!input.trim() || ai.isPending) && { opacity: 0.45 }, pressed && { transform: [{ scale: 0.94 }] }]}>{ai.isPending ? <ActivityIndicator color="#FFFFFF" size="small" /> : <IconSymbol name="chevron.right" size={20} color="#FFFFFF" />}</Pressable></View>
        {ai.isError ? <Text style={[styles.error, { color: colors.error }]}>{ai.error.message}</Text> : null}
      </ScreenContainer>
    </KeyboardAvoidingView>
  );
}

function PreviewCard({ preview, onConfirm, confirming }: { preview: AiPreviewResponse | null; onConfirm: (proposal: Extract<AiPreviewResponse, { status: "preview" }>['proposal']) => void; confirming: boolean }) {
  const colors = useColors();
  if (!preview) return null;
  if (preview.status === "clarification") return <SurfaceCard style={styles.previewCard}><View style={styles.previewHeader}><IconSymbol name="info" size={18} color={colors.warning} /><Text style={[styles.previewTitle, { color: colors.foreground }]}>One detail needed</Text></View><Text style={[styles.previewText, { color: colors.muted }]}>{preview.question}</Text><StatusPill label="Nothing saved" tone="warning" /></SurfaceCard>;
  const { proposal, schedule } = preview;
  return <SurfaceCard style={styles.previewCard}><View style={styles.previewHeader}><View><Text style={[styles.previewEyebrow, { color: colors.primary }]}>PROPOSED QUEST</Text><Text style={[styles.previewTitle, { color: colors.foreground }]}>{proposal.title}</Text></View><StatusPill label={schedule.priority} tone={priorityTone(schedule.priority)} /></View><View style={styles.previewMeta}><View style={styles.previewMetaItem}><IconSymbol name="calendar" size={15} color={colors.muted} /><Text style={[styles.previewText, { color: colors.foreground }]}>{formatDate(proposal.scheduled_start)} at {formatTime(proposal.scheduled_start)}</Text></View><View style={styles.previewMetaItem}><IconSymbol name="clock" size={15} color={colors.muted} /><Text style={[styles.previewText, { color: colors.foreground }]}>{proposal.duration_minutes} minutes · +{schedule.xpReward} XP</Text></View></View>{schedule.warnings.map((warning) => <View key={warning} style={styles.warningRow}><IconSymbol name="warning" size={15} color={colors.warning} /><Text style={[styles.previewText, { color: colors.warning }]}>{warning}</Text></View>)}{schedule.reasons.slice(0, 3).map((reason) => <View key={reason} style={styles.reasonRow}><IconSymbol name="checkmark.circle.fill" size={15} color={colors.success} /><Text style={[styles.previewText, { color: colors.muted }]}>{reason}</Text></View>)}<View style={styles.previewActions}>{schedule.canCommit ? <PrimaryButton title="Confirm quest" icon="checkmark.circle.fill" onPress={() => onConfirm(proposal)} loading={confirming} /> : <GhostButton title="Adjust the request" icon="close" onPress={() => undefined} />}</View></SurfaceCard>;
}

export default function AiScreen() { return <AuthGate><AiContent /></AuthGate>; }

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingTop: 22, paddingBottom: 20, gap: 12 },
  header: { gap: 8, marginBottom: 8 },
  aiMark: { width: 44, height: 44, borderRadius: 15, alignItems: "center", justifyContent: "center", backgroundColor: "#6D5DFB", marginBottom: 3 },
  eyebrow: { fontSize: 11, fontWeight: "900", letterSpacing: 1.4 },
  title: { fontSize: 29, lineHeight: 34, fontWeight: "900", letterSpacing: -0.8 },
  subtitle: { fontSize: 14, lineHeight: 21 },
  messageRow: { alignItems: "flex-start" },
  userRow: { alignItems: "flex-end" },
  messageBubble: { maxWidth: "88%", borderRadius: 18, borderWidth: 1, paddingHorizontal: 15, paddingVertical: 12 },
  messageText: { fontSize: 14, lineHeight: 21 },
  footer: { gap: 12, marginTop: 2 },
  previewCard: { gap: 13 },
  previewHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 10 },
  previewEyebrow: { fontSize: 10, fontWeight: "900", letterSpacing: 1.1, marginBottom: 3 },
  previewTitle: { fontSize: 18, lineHeight: 23, fontWeight: "900", flexShrink: 1 },
  previewMeta: { gap: 8 },
  previewMetaItem: { flexDirection: "row", alignItems: "center", gap: 7 },
  previewText: { fontSize: 13, lineHeight: 19, flexShrink: 1 },
  warningRow: { flexDirection: "row", gap: 7, alignItems: "flex-start" },
  reasonRow: { flexDirection: "row", gap: 7, alignItems: "flex-start" },
  previewActions: { marginTop: 2 },
  exampleRow: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
  exampleLabel: { fontSize: 12, fontWeight: "700" },
  example: { borderRadius: 999, paddingHorizontal: 11, paddingVertical: 7 },
  exampleText: { fontSize: 12, fontWeight: "800" },
  composer: { borderWidth: 1, borderRadius: 18, minHeight: 58, maxHeight: 120, paddingLeft: 15, paddingRight: 8, paddingVertical: 8, flexDirection: "row", alignItems: "flex-end", gap: 8 },
  input: { flex: 1, fontSize: 14, lineHeight: 20, maxHeight: 90, paddingTop: 8, paddingBottom: 7 },
  sendButton: { width: 42, height: 42, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  error: { fontSize: 12, textAlign: "center", marginBottom: 4 },
});
