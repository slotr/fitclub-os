import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { useFocusEffect } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { BackButton } from "../components/BackButton";
import { ScreenContainer } from "../components/ScreenContainer";
import {
  HealthStatusBadge,
  type HealthStatus,
} from "../components/HealthStatusBadge";
import { HealthPermissionPrompt } from "../components/HealthPermissionPrompt";
import { HealthBackfillPrompt } from "../components/HealthBackfillPrompt";
import { HealthDisconnectPrompt } from "../components/HealthDisconnectPrompt";
import { tokens } from "../theme/tokens";
import { useTheme } from "../lib/theme-provider";
import { useAuth } from "../lib/store";
import {
  isHealthAvailable,
  requestHealthPermission,
} from "../lib/health";
import {
  backfillHealthWorkouts,
  countPendingHealthSync,
  syncPendingHealthWorkouts,
} from "../lib/health/sync";
import { HEALTH_OPT_IN_KEY } from "../lib/health/storage-keys";

const PLATFORM_LABEL = Platform.OS === "ios" ? "Apple Health" : "Health Connect";
const PLATFORM_ICON = Platform.OS === "ios" ? "🏥" : "🩺";

export default function HealthIntegrationsScreen() {
  const theme = useTheme();
  const { member } = useAuth();
  const memberId = member?.dbId ?? "";

  const [available, setAvailable] = useState<boolean | null>(null);
  const [optIn, setOptIn] = useState(false);
  const [status, setStatus] = useState<HealthStatus>("not-determined");
  const [pending, setPending] = useState(0);
  const [showPrePrompt, setShowPrePrompt] = useState(false);
  const [showBackfill, setShowBackfill] = useState(false);
  const [showDisconnect, setShowDisconnect] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [lastResult, setLastResult] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const a = await isHealthAvailable();
    setAvailable(a);
    const stored = await SecureStore.getItemAsync(HEALTH_OPT_IN_KEY).catch(
      () => null,
    );
    const on = stored === "true";
    setOptIn(on);
    if (!a) setStatus("unavailable");
    else if (on) setStatus("granted");
    else setStatus("not-determined");
    if (memberId) setPending(countPendingHealthSync(memberId));
  }, [memberId]);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const onToggle = async (next: boolean) => {
    if (next) {
      if (!available) {
        Alert.alert(
          "Not supported",
          `${PLATFORM_LABEL} is not available on this device.`,
        );
        return;
      }
      setShowPrePrompt(true);
    } else {
      setShowDisconnect(true);
    }
  };

  const onPromptContinue = async () => {
    setShowPrePrompt(false);
    setStatus("requesting");
    const granted = await requestHealthPermission();
    if (granted) {
      await SecureStore.setItemAsync(HEALTH_OPT_IN_KEY, "true");
      setOptIn(true);
      setStatus("granted");
      const count = memberId ? countPendingHealthSync(memberId) : 0;
      setPending(count);
      if (count > 0) setShowBackfill(true);
    } else {
      setStatus("denied");
    }
  };

  const onDisconnect = async () => {
    setShowDisconnect(false);
    await SecureStore.setItemAsync(HEALTH_OPT_IN_KEY, "false");
    setOptIn(false);
    setStatus("granted-paused");
  };

  const onBackfill = async () => {
    setShowBackfill(false);
    if (!memberId) return;
    setSyncing(true);
    const r = await backfillHealthWorkouts(memberId);
    setLastResult(`Backfilled ${r.synced} of ${r.total} workouts.`);
    setPending(countPendingHealthSync(memberId));
    setSyncing(false);
  };

  const onSyncNow = async () => {
    setSyncing(true);
    const r = await syncPendingHealthWorkouts();
    setLastResult(
      `Synced ${r.synced} of ${r.total}. ${r.failed} failed.`,
    );
    if (memberId) setPending(countPendingHealthSync(memberId));
    setSyncing(false);
  };

  return (
    <ScreenContainer padding={20}>
      <BackButton />
      <Text style={styles.title}>Health Integrations</Text>

      <View style={styles.section}>
        <Text style={styles.platformTitle}>
          {PLATFORM_ICON} {PLATFORM_LABEL}
        </Text>
        <Text style={styles.platformBody}>
          Save your workouts to {PLATFORM_LABEL} automatically.
        </Text>

        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>Sync workouts</Text>
          <Switch
            value={optIn}
            disabled={!available || status === "requesting"}
            onValueChange={onToggle}
            trackColor={{ false: tokens.color.border, true: theme.accent }}
          />
        </View>

        <View style={styles.statusRow}>
          <HealthStatusBadge status={status} />
        </View>

        {status === "denied" && (
          <Pressable
            onPress={() => Linking.openSettings()}
            style={[styles.settingsBtn, { backgroundColor: theme.accent }]}
          >
            <Text style={styles.settingsBtnText}>Open Settings</Text>
          </Pressable>
        )}
      </View>

      <Text style={styles.sectionHeader}>What we sync</Text>
      <View style={styles.list}>
        <Text style={styles.listItem}>✓ Workout duration</Text>
        <Text style={styles.listItem}>✓ Strength training type</Text>
        <Text style={styles.listItem}>✓ Estimated calories</Text>
        <Text style={[styles.listItem, styles.listItemMuted]}>
          ✗ Heart rate (not yet)
        </Text>
        <Text style={[styles.listItem, styles.listItemMuted]}>
          ✗ Weight (not yet)
        </Text>
      </View>

      <Text style={styles.sectionHeader}>Manual sync</Text>
      <Text style={styles.pendingText}>
        {pending} workout{pending === 1 ? "" : "s"} pending
      </Text>
      <Pressable
        onPress={onSyncNow}
        disabled={!optIn || syncing || pending === 0}
        style={[
          styles.syncBtn,
          { backgroundColor: theme.accent },
          (!optIn || syncing || pending === 0) && { opacity: 0.4 },
        ]}
      >
        <Text style={styles.syncBtnText}>
          {syncing ? "Syncing..." : "Sync now"}
        </Text>
      </Pressable>
      {lastResult && <Text style={styles.lastResult}>{lastResult}</Text>}

      <Text style={styles.sectionHeader}>Privacy</Text>
      <Text style={styles.privacy}>
        Your data stays on your device except the workout summary we already
        store on our server.
      </Text>

      <HealthPermissionPrompt
        visible={showPrePrompt}
        platformLabel={PLATFORM_LABEL}
        onContinue={onPromptContinue}
        onCancel={() => setShowPrePrompt(false)}
      />
      <HealthBackfillPrompt
        visible={showBackfill}
        count={pending}
        platformLabel={PLATFORM_LABEL}
        onConfirm={onBackfill}
        onSkip={() => setShowBackfill(false)}
      />
      <HealthDisconnectPrompt
        visible={showDisconnect}
        platformLabel={PLATFORM_LABEL}
        onConfirm={onDisconnect}
        onCancel={() => setShowDisconnect(false)}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: {
    fontFamily: tokens.font.sansExtrabold,
    fontSize: 24,
    color: tokens.color.fg,
    marginVertical: 8,
  },
  section: {
    backgroundColor: tokens.color.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: tokens.color.border,
    marginBottom: 20,
  },
  platformTitle: {
    fontFamily: tokens.font.sansExtrabold,
    fontSize: 16,
    color: tokens.color.fg,
  },
  platformBody: {
    fontFamily: tokens.font.sansRegular,
    fontSize: 13,
    color: tokens.color.fgMuted,
    marginTop: 4,
    marginBottom: 16,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  toggleLabel: { fontFamily: tokens.font.sansBold, fontSize: 14, color: tokens.color.fg },
  statusRow: { marginBottom: 8 },
  settingsBtn: {
    marginTop: 12,
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  settingsBtnText: { color: "white", fontFamily: tokens.font.sansBold, fontSize: 13 },
  sectionHeader: {
    fontFamily: tokens.font.sansExtrabold,
    fontSize: 11,
    color: tokens.color.fgMuted,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginTop: 8,
    marginBottom: 8,
  },
  list: { marginBottom: 20 },
  listItem: {
    fontFamily: tokens.font.sansRegular,
    fontSize: 13,
    color: tokens.color.fg,
    paddingVertical: 4,
  },
  listItemMuted: { color: tokens.color.fgMuted },
  pendingText: {
    fontFamily: tokens.font.sansMedium,
    fontSize: 13,
    color: tokens.color.fgMuted,
    marginBottom: 10,
  },
  syncBtn: {
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  syncBtnText: { color: "white", fontFamily: tokens.font.sansExtrabold, fontSize: 14 },
  lastResult: {
    fontFamily: tokens.font.sansRegular,
    fontSize: 12,
    color: tokens.color.fgMuted,
    marginTop: 8,
    textAlign: "center",
  },
  privacy: {
    fontFamily: tokens.font.sansRegular,
    fontSize: 13,
    color: tokens.color.fgMuted,
    lineHeight: 18,
    marginBottom: 32,
  },
});
