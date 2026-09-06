import { PropsWithChildren } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { useAuth } from "@/hooks/use-auth";
import { startOAuthLogin } from "@/constants/oauth";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { PrimaryButton } from "@/components/awaken-ui";
import { useColors } from "@/hooks/use-colors";

export function AuthGate({ children }: PropsWithChildren) {
  const { loading, isAuthenticated } = useAuth();
  const colors = useColors();

  if (loading) {
    return <ScreenContainer className="items-center justify-center"><ActivityIndicator color={colors.primary} /></ScreenContainer>;
  }

  if (!isAuthenticated) {
    return (
      <ScreenContainer className="px-6 justify-center">
        <View style={styles.hero}>
          <View style={[styles.logo, { backgroundColor: colors.primary }]}><IconSymbol name="sparkles" size={30} color="#FFFFFF" /></View>
          <Text style={[styles.eyebrow, { color: colors.primary }]}>AWAKEN</Text>
          <Text style={[styles.title, { color: colors.foreground }]}>Make progress feel inevitable.</Text>
          <Text style={[styles.body, { color: colors.muted }]}>Turn a thought into a validated plan, complete the work, and level up one focused action at a time.</Text>
          <PrimaryButton title="Sign in to awaken" icon="sparkles" onPress={() => void startOAuthLogin()} />
          <Text style={[styles.caption, { color: colors.muted }]}>Your plans stay private and are protected by your account.</Text>
        </View>
      </ScreenContainer>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  hero: { alignItems: "center", gap: 16 },
  logo: { width: 72, height: 72, borderRadius: 24, alignItems: "center", justifyContent: "center", shadowColor: "#6D5DFB", shadowOpacity: 0.3, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 5 },
  eyebrow: { fontSize: 13, fontWeight: "900", letterSpacing: 3, marginTop: 4 },
  title: { fontSize: 34, lineHeight: 39, fontWeight: "900", letterSpacing: -1, textAlign: "center" },
  body: { maxWidth: 310, textAlign: "center", fontSize: 16, lineHeight: 24, marginBottom: 10 },
  caption: { fontSize: 12, textAlign: "center", marginTop: 4 },
});
