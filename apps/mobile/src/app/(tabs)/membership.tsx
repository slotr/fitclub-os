import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '../../components/ScreenContainer';
import { CardIcon } from '../../components/Icons';
import { tokens } from '../../theme/tokens';
import { useAuth } from '../../lib/store';
import { paymentHistory as mockPayments } from '../../mocks/activity';
import { fetchPaymentHistory, type LivePayment } from '../../lib/api';
import { formatMoney } from '../../lib/money';

type PayRow = { id: string; date: string; what: string; amount: number; pending?: boolean };

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export default function MembershipScreen() {
  const router = useRouter();
  const { member, setMembershipState, currency } = useAuth();
  const state = member?.membershipState ?? 'active';
  const [history, setHistory] = useState<PayRow[]>(
    mockPayments.map((p) => ({ id: p.id, date: p.date, what: p.what, amount: p.amount })),
  );

  useEffect(() => {
    if (!member?.dbId) return;
    let active = true;
    fetchPaymentHistory(member.dbId).then((rows: LivePayment[]) => {
      if (!active) return;
      if (rows.length === 0) return;
      setHistory(
        rows.map((p) => ({
          id: p.id,
          date: fmtDate(p.createdAt),
          what:
            p.method === 'crypto'
              ? `Crypto · ${p.status === 'pending' ? 'awaiting confirmation' : p.status}`
              : `Card · ${p.status}`,
          amount: p.amount,
          pending: p.status === 'pending',
        })),
      );
    });
    return () => {
      active = false;
    };
  }, [member?.dbId]);

  const onPause = () => {
    Alert.alert(
      state === 'paused' ? 'Resume membership?' : 'Pause membership?',
      state === 'paused'
        ? 'Your monthly payments will resume on the next billing date.'
        : 'You can resume anytime. Billing pauses immediately.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: state === 'paused' ? 'Resume' : 'Pause',
          onPress: () => setMembershipState(state === 'paused' ? 'active' : 'paused'),
        },
      ],
    );
  };

  const onCancel = () => {
    Alert.alert(
      'Cancel membership?',
      'Access stays active until the end of your current billing cycle. This action cannot be undone.',
      [
        { text: 'Keep membership', style: 'cancel' },
        {
          text: 'Cancel anyway',
          style: 'destructive',
          onPress: () => setMembershipState('cancelled'),
        },
      ],
    );
  };

  const onActions = () => {
    Alert.alert('Manage membership', undefined, [
      { text: state === 'paused' ? 'Resume' : 'Pause', onPress: onPause },
      { text: 'Cancel', style: 'destructive', onPress: onCancel },
      { text: 'Close', style: 'cancel' },
    ]);
  };

  return (
    <ScreenContainer padding={20}>
      <Text style={styles.h1}>Membership & Payment</Text>

      <View style={styles.planCardWrap}>
        <LinearGradient
          colors={['#1a1a1a', '#2a2a2a']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.planCard}
        >
          <View style={styles.glow} pointerEvents="none" />
          <Text style={styles.planLabel}>{member?.plan ?? 'Premium'} plan</Text>
          <Text style={styles.planPrice}>
            {formatMoney(member?.planPriceTry ?? 899, currency)}
            <Text style={styles.planPriceSmall}>/month</Text>
          </Text>
          <Text style={styles.planNext}>
            {state === 'cancelled'
              ? 'Cancelled — access until 15 May 2026'
              : state === 'paused'
                ? 'Paused — resume anytime'
                : 'Next payment: 15 May 2026'}
            {member?.cardLast4 ? ` · ${member.cardBrand} •••• ${member.cardLast4}` : ''}
          </Text>
          <Pressable
            style={styles.manage}
            onPress={() => router.push('/billing/payment-method')}
          >
            <CardIcon size={14} color="#fff" strokeWidth={2} />
            <Text style={styles.manageText}>Update card</Text>
          </Pressable>
        </LinearGradient>
      </View>

      <Text style={styles.sectionLabel}>Payment history</Text>

      <View style={styles.payList}>
        {history.map((row, idx) => (
          <View
            key={row.id}
            style={[
              styles.payRow,
              idx === history.length - 1 && { borderBottomWidth: 0 },
            ]}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.payWhen}>{row.date}</Text>
              <Text style={styles.payWhat}>{row.what}</Text>
            </View>
            <Text
              style={[
                styles.payAmount,
                row.pending && { color: tokens.color.warnFg },
              ]}
            >
              {formatMoney(row.amount, currency)}
            </Text>
          </View>
        ))}
        {history.length === 0 && (
          <View style={styles.payRow}>
            <Text style={styles.payWhat}>No payments yet.</Text>
          </View>
        )}
      </View>

      <View style={styles.actions}>
        <Pressable
          style={styles.ghost}
          onPress={() => router.push('/billing/change-plan')}
        >
          <Text style={styles.ghostLabel}>Change plan</Text>
        </Pressable>
        <Pressable style={styles.ghost} onPress={onActions}>
          <Text style={[styles.ghostLabel, { color: tokens.color.bad }]}>
            {state === 'paused' ? 'Resume / Cancel' : 'Pause / Cancel'}
          </Text>
        </Pressable>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  h1: {
    fontFamily: tokens.font.sansExtrabold,
    fontSize: 22,
    color: tokens.color.fg,
    letterSpacing: -0.5,
    marginTop: 4,
    marginBottom: 14,
  },

  planCardWrap: {
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 12 },
    elevation: 6,
  },
  planCard: {
    padding: 18,
    borderRadius: 18,
    overflow: 'hidden',
    position: 'relative',
  },
  glow: {
    position: 'absolute',
    top: -40,
    right: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(245,158,11,0.4)',
    opacity: 0.5,
  },
  planLabel: {
    fontFamily: tokens.font.sansSemibold,
    fontSize: 10,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.5)',
  },
  planPrice: {
    fontFamily: tokens.font.sansExtrabold,
    fontSize: 30,
    color: '#fff',
    letterSpacing: -0.6,
    marginTop: 6,
    marginBottom: 6,
  },
  planPriceSmall: {
    fontFamily: tokens.font.sansMedium,
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 0,
  },
  planNext: {
    fontFamily: tokens.font.sansRegular,
    fontSize: 12,
    color: 'rgba(255,255,255,0.65)',
    marginBottom: 14,
  },
  manage: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  manageText: {
    fontFamily: tokens.font.sansSemibold,
    fontSize: 12,
    color: '#fff',
  },

  sectionLabel: {
    fontFamily: tokens.font.sansSemibold,
    fontSize: 11,
    color: tokens.color.fgMuted,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginTop: 14,
    marginBottom: 6,
    marginLeft: 4,
  },
  payList: {
    backgroundColor: tokens.color.surface,
    borderRadius: 14,
    ...tokens.shadow.sm,
  },
  payRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: tokens.color.borderFaint,
  },
  payWhen: {
    fontFamily: tokens.font.sansSemibold,
    fontSize: 13,
    color: tokens.color.fg,
  },
  payWhat: {
    fontFamily: tokens.font.sansRegular,
    fontSize: 11,
    color: tokens.color.fgMuted,
    marginTop: 1,
  },
  payAmount: {
    fontFamily: tokens.font.monoSemibold,
    fontSize: 13,
    color: tokens.color.fg,
  },

  actions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
  },
  ghost: {
    flex: 1,
    backgroundColor: tokens.color.surface,
    borderWidth: 1,
    borderColor: tokens.color.border,
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: 'center',
  },
  ghostLabel: {
    fontFamily: tokens.font.sansSemibold,
    fontSize: 13,
    color: tokens.color.fg,
  },
});
