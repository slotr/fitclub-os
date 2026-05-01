import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { ScreenContainer } from '../../components/ScreenContainer';
import { BellIcon, PhoneIcon, QrIcon } from '../../components/Icons';
import { tokens } from '../../theme/tokens';
import { useAuth } from '../../lib/store';

type CardState = 'idle' | 'granted' | 'skipped';

export default function PermissionsScreen() {
  const router = useRouter();
  const { member } = useAuth();
  const [whatsapp, setWhatsapp] = useState<CardState>('idle');
  const [push, setPush] = useState<CardState>('idle');

  const requestPush = async () => {
    try {
      const res = await Notifications.requestPermissionsAsync();
      setPush(res.status === 'granted' ? 'granted' : 'skipped');
    } catch {
      setPush('granted');
    }
  };

  return (
    <ScreenContainer>
      <View style={{ marginTop: 8, marginBottom: 18 }}>
        <Text style={styles.h1}>You’re in, {member?.firstName ?? 'Hakan'}.</Text>
        <Text style={styles.sub}>A few quick things before we hand over the QR.</Text>
      </View>

      <PermCard
        title="Notifications"
        body="Stay in the loop on WhatsApp — booking confirmations, class reminders and payment receipts."
        iconBg={tokens.color.accentSoft}
        iconColor={tokens.color.fg}
        primaryLabel={whatsapp === 'granted' ? 'Allowed ✓' : 'Allow'}
        secondaryLabel="Maybe later"
        primaryDisabled={whatsapp !== 'idle'}
        onPrimary={() => setWhatsapp('granted')}
        onSecondary={() => setWhatsapp('skipped')}
        icon={<BellIcon size={20} color={tokens.color.fg} />}
      />

      <PermCard
        title="Push notifications"
        body="Get push notifications too, in case WhatsApp is muted. We’ll only send the important ones."
        iconBg={tokens.color.infoSoft}
        iconColor={tokens.color.infoFg}
        primaryLabel={push === 'granted' ? 'Allowed ✓' : 'Allow'}
        secondaryLabel="Skip"
        primaryDisabled={push !== 'idle'}
        onPrimary={requestPush}
        onSecondary={() => setPush('skipped')}
        icon={<PhoneIcon size={20} color={tokens.color.infoFg} />}
      />

      <PermCard
        title="Your QR is ready"
        body="Your check-in code is in the app — just open it at the door. It rotates every 30 seconds for security."
        iconBg={tokens.color.fg}
        iconColor={tokens.color.surface}
        primaryLabel="Got it"
        full
        onPrimary={() => router.push('/notifications')}
        icon={<QrIcon size={20} color={tokens.color.surface} />}
      />
    </ScreenContainer>
  );
}

function PermCard({
  title,
  body,
  iconBg,
  iconColor: _iconColor,
  primaryLabel,
  secondaryLabel,
  full,
  primaryDisabled,
  onPrimary,
  onSecondary,
  icon,
}: {
  title: string;
  body: string;
  iconBg: string;
  iconColor: string;
  primaryLabel: string;
  secondaryLabel?: string;
  full?: boolean;
  primaryDisabled?: boolean;
  onPrimary?: () => void;
  onSecondary?: () => void;
  icon: React.ReactNode;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <View style={[styles.iconWrap, { backgroundColor: iconBg }]}>{icon}</View>
        <Text style={styles.title}>{title}</Text>
      </View>
      <Text style={styles.body}>{body}</Text>
      <View style={styles.actions}>
        <Pressable
          style={[styles.btn, full && { flex: 1 }, primaryDisabled && { opacity: 0.5 }]}
          onPress={primaryDisabled ? undefined : onPrimary}
        >
          <Text style={styles.btnLabel}>{primaryLabel}</Text>
        </Pressable>
        {secondaryLabel ? (
          <Pressable style={[styles.btn, styles.btnText]} onPress={onSecondary}>
            <Text style={styles.btnTextLabel}>{secondaryLabel}</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  h1: {
    fontFamily: tokens.font.sansExtrabold,
    fontSize: 22,
    color: tokens.color.fg,
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  sub: {
    fontFamily: tokens.font.sansRegular,
    fontSize: 13,
    color: tokens.color.fgMuted,
    lineHeight: 18,
  },

  card: {
    backgroundColor: tokens.color.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: tokens.color.borderFaint,
    ...tokens.shadow.sm,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: tokens.font.sansBold,
    fontSize: 15,
    color: tokens.color.fg,
  },
  body: {
    fontFamily: tokens.font.sansRegular,
    fontSize: 14,
    color: tokens.color.fgMuted,
    lineHeight: 20,
    marginBottom: 14,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  btn: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    backgroundColor: tokens.color.fg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnLabel: {
    fontFamily: tokens.font.sansSemibold,
    fontSize: 13,
    color: tokens.color.surface,
  },
  btnText: {
    backgroundColor: 'transparent',
  },
  btnTextLabel: {
    fontFamily: tokens.font.sansSemibold,
    fontSize: 13,
    color: tokens.color.fgMuted,
  },
});
