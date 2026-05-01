import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ScreenContainer } from '../../components/ScreenContainer';
import { CardIcon } from '../../components/Icons';
import { tokens } from '../../theme/tokens';
import { useAuth } from '../../lib/store';
import { paymentHistory } from '../../mocks/activity';

export default function MembershipScreen() {
  const { member } = useAuth();

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
            ₺{(member?.planPriceTry ?? 899).toLocaleString('en-US')}
            <Text style={styles.planPriceSmall}>/month</Text>
          </Text>
          <Text style={styles.planNext}>Next payment: 15 May 2026</Text>
          <View style={styles.manage}>
            <CardIcon size={14} color="#fff" strokeWidth={2} />
            <Text style={styles.manageText}>Update card</Text>
          </View>
        </LinearGradient>
      </View>

      <Text style={styles.sectionLabel}>Payment history</Text>

      <View style={styles.payList}>
        {paymentHistory.map((row, idx) => (
          <View
            key={row.id}
            style={[
              styles.payRow,
              idx === paymentHistory.length - 1 && { borderBottomWidth: 0 },
            ]}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.payWhen}>{row.date}</Text>
              <Text style={styles.payWhat}>{row.what}</Text>
            </View>
            <Text style={styles.payAmount}>₺{row.amount.toLocaleString('en-US')}</Text>
          </View>
        ))}
      </View>

      <View style={styles.actions}>
        <Pressable style={styles.ghost}>
          <Text style={styles.ghostLabel}>Change plan</Text>
        </Pressable>
        <Pressable style={styles.ghost}>
          <Text style={[styles.ghostLabel, { color: tokens.color.bad }]}>Pause / Cancel</Text>
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
