import { useState } from "react";
import { View, Text, StyleSheet, TextInput, ScrollView } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useAuthStore } from "../../src/stores/authStore";
import {
  AnimatedChipCount,
  PressableButton,
  GlassCard,
} from "../../src/components/ui";
import { colors } from "../../src/theme/tokens";

export default function ProfileScreen() {
  const { user, logout, upgradeAccount, isLoading, error } = useAuthStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 100 }}
    >
      <Text style={styles.header}>Profile</Text>

      <Animated.View entering={FadeInDown.delay(100)}>
        <GlassCard style={styles.profileCard} pressable={false}>
          <View
            style={[
              styles.avatar,
              user?.equippedItems?.AVATAR_FRAME
                ? { borderWidth: 3, borderColor: "#E8B04A" }
                : undefined,
            ]}
          >
            <Text style={styles.avatarText}>
              {user?.username?.[0]?.toUpperCase() || "G"}
            </Text>
          </View>
          <Text style={styles.name}>{user?.username || "Guest"}</Text>
          {user?.equippedItems?.PROFILE_TITLE && (
            <Text style={styles.beli}>Mehfil Host</Text>
          )}
          <Text style={styles.level}>Level {user?.level || 1}</Text>
          <View style={styles.chipsRow}>
            <Text style={styles.chipsLabel}>Play chips: </Text>
            <AnimatedChipCount
              value={user?.chips || 0}
              prefix="◉ "
              style={styles.chipsValue}
            />
          </View>
          <Text style={styles.beli}>
            {user?.beliBalance || 0} Club Points • extras in Invite
          </Text>
        </GlassCard>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(300)} style={styles.statsRow}>
        {[
          { label: "Games", value: user?.totalGames || 0 },
          { label: "Wins", value: user?.gamesWon || 0 },
          { label: "Streak", value: user?.currentStreak || 0 },
        ].map((stat) => (
          <GlassCard key={stat.label} style={styles.statCard} pressable={false}>
            <Text style={styles.statValue}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </GlassCard>
        ))}
      </Animated.View>

      {user?.isGuest && (
        <View style={{ gap: 12 }}>
          <Text style={{ color: "#fff" }}>
            Save your guest account and keep your chips
          </Text>
          <TextInput
            accessibilityLabel="Email"
            placeholder="Email"
            placeholderTextColor="#aaa"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            style={{
              color: "#fff",
              borderWidth: 1,
              borderColor: "#888",
              padding: 12,
            }}
          />
          <TextInput
            accessibilityLabel="Password, at least 12 characters"
            placeholder="Password (12+ characters)"
            placeholderTextColor="#aaa"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            style={{
              color: "#fff",
              borderWidth: 1,
              borderColor: "#888",
              padding: 12,
            }}
          />
          <PressableButton
            disabled={isLoading}
            onPress={() => void upgradeAccount(email, password)}
          >
            <Text style={{ color: "#fff" }}>Save account</Text>
          </PressableButton>
          {error && (
            <Text accessibilityRole="alert" style={{ color: "#fca5a5" }}>
              {error}
            </Text>
          )}
        </View>
      )}
      <Animated.View entering={FadeInDown.delay(500)} style={{ marginTop: 24 }}>
        <PressableButton
          onPress={logout}
          variant="danger"
          style={{ width: "100%" }}
        >
          <Text style={{ color: "#fff", fontWeight: "600" }}>Sign Out</Text>
        </PressableButton>
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: 16,
    paddingTop: 60,
  },
  header: { fontSize: 22, fontWeight: "700", color: "#fff", marginBottom: 20 },
  profileCard: { alignItems: "center", padding: 24, marginBottom: 16 },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#d97706",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "rgba(234,179,8,0.5)",
    marginBottom: 12,
  },
  avatarText: { color: "#fff", fontSize: 32, fontWeight: "700" },
  name: { color: "#fff", fontSize: 20, fontWeight: "700", marginBottom: 4 },
  level: {
    color: colors.yellow,
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 12,
  },
  chipsRow: { flexDirection: "row", alignItems: "center" },
  chipsLabel: { color: colors.white50, fontSize: 14 },
  chipsValue: { color: colors.yellow, fontSize: 18, fontWeight: "700" },
  beli: { color: "#FFD66B", fontSize: 13, fontWeight: "700", marginTop: 8 },
  statsRow: { flexDirection: "row", gap: 8 },
  statCard: { flex: 1, alignItems: "center", padding: 16 },
  statValue: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 4,
  },
  statLabel: {
    color: colors.white40,
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
});
