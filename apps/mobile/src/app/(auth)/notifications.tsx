import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '../../components/ScreenContainer';
import { PrimaryButton } from '../../components/PrimaryButton';
import { tokens } from '../../theme/tokens';

type Toggles = {
  reminders: boolean;
  renewals: boolean;
  promos: boolean;
};

export default function NotificationsOnboardingScreen() {
  const router = useRouter();
  const [t, setT] = useState<Toggles>({
    reminders: true,
    renewals: true,
    promos: false,
  });

  const set = (k: keyof Toggles) =>
    setT((prev) => ({ ...prev, [k]: !prev[k] }));

  return (
    <ScreenContainer>
      <Text style={styles.h1}>What should we tell you about?</Text>
      <Text style={styles.sub}>You can change these any time in Profile → Notifications.</Text>

      <View style={styles.group}>
        <Row
          label="Class reminders"
          sub="Ping me 1 hour before my next booked class."
          on={t.reminders}
          onPress={() => set('reminders')}
        />
        <Row
          label="Renewal alerts"
          sub="Heads up before my plan renews each month."
          on={t.renewals}
          onPress={() => set('renewals')}
        />
        <Row
          label="Promotions"
          sub="Occasional offers and new class drops."
          on={t.promos}
          onPress={() => set('promos')}
        />
      </View>

      <View style={{ flex: 1 }} />

      <PrimaryButton
        label="Done"
        onPress={() => router.replace('/(tabs)')}
      />
    </ScreenContainer>
  );
}

function Row({
  label,
  sub,
  on,
  onPress,
}: {
  label: string;
  sub: string;
  on: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.row} onPress={onPress}>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.rowSub}>{sub}</Text>
      </View>
      <View style={[styles.switch, on && styles.switchOn]}>
        <View style={[styles.thumb, on && styles.thumbOn]} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  h1: {
    fontFamily: tokens.font.sansExtrabold,
    fontSize: 22,
    color: tokens.color.fg,
    letterSpacing: -0.5,
    marginTop: 4,
    marginBottom: 6,
  },
  sub: {
    fontFamily: tokens.font.sansRegular,
    fontSize: 13,
    color: tokens.color.fgMuted,
    marginBottom: 18,
    lineHeight: 18,
  },
  group: {
    backgroundColor: tokens.color.surface,
    borderRadius: 14,
    overflow: 'hidden',
    ...tokens.shadow.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: tokens.color.borderFaint,
  },
  rowLabel: {
    fontFamily: tokens.font.sansSemibold,
    fontSize: 14,
    color: tokens.color.fg,
  },
  rowSub: {
    fontFamily: tokens.font.sansRegular,
    fontSize: 11,
    color: tokens.color.fgMuted,
    marginTop: 2,
  },
  switch: {
    width: 44,
    height: 26,
    borderRadius: 999,
    backgroundColor: tokens.color.border,
    padding: 2,
  },
  switchOn: { backgroundColor: tokens.color.good },
  thumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 1,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  thumbOn: { transform: [{ translateX: 18 }] },
});
