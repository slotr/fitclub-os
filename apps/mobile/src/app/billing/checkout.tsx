import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScreenContainer } from '../../components/ScreenContainer';
import { BackButtonRow } from '../../components/BackButton';
import { PrimaryButton } from '../../components/PrimaryButton';
import { CardIcon } from '../../components/Icons';
import { tokens } from '../../theme/tokens';
import { useAuth } from '../../lib/store';
import { activateMembership } from '../../lib/api';
import { formatMoney } from '../../lib/money';

type Method = 'card' | 'crypto';

const PLAN_LABEL: Record<string, 'Basic' | 'Premium' | 'Performance'> = {
  basic: 'Basic',
  premium: 'Premium',
  performance: 'Performance',
};

export default function CheckoutScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    plan?: string;
    price?: string;
    cycle?: string;
    next?: string;
  }>();
  const { updatePlan, member, currency } = useAuth();

  const planLabel = PLAN_LABEL[params.plan ?? ''] ?? 'Premium';
  const price = Number(params.price ?? 899);
  const cycle = params.cycle === 'yearly' ? 'year' : 'month';
  const next = params.next ?? '/(tabs)';
  const [method, setMethod] = useState<Method>('card');

  const onConfirm = async () => {
    if (method === 'card') {
      updatePlan(planLabel, price);
      // Production: kick Stripe Checkout / SetupIntent here. For now we
      // simulate the success path by activating the member + writing a
      // memberships row so the admin sees them flip from Pending to Active.
      if (member?.dbId) {
        await activateMembership(member.dbId, planLabel);
      }
      router.replace(
        next as Parameters<typeof router.replace>[0],
      );
      return;
    }
    router.push({
      pathname: '/billing/crypto-checkout',
      params: {
        plan: params.plan ?? 'premium',
        price: String(price),
        cycle: params.cycle ?? 'monthly',
        next,
      },
    });
  };

  return (
    <ScreenContainer>
      <BackButtonRow fallback={next} />
      <Text style={styles.h1}>Pay for {planLabel}.</Text>
      <Text style={styles.sub}>
        {formatMoney(price, currency)} / {cycle}. Cancel anytime.
      </Text>

      <Text style={styles.label}>Payment method</Text>
      <View style={styles.options}>
        <MethodOption
          icon={<CardIcon size={18} color={tokens.color.fg} strokeWidth={2} />}
          title="Card"
          sub="Visa, Mastercard, Troy"
          on={method === 'card'}
          onPress={() => setMethod('card')}
        />
        <MethodOption
          icon={<Text style={styles.cryptoIcon}>₿</Text>}
          title="Crypto"
          sub="USDT, USDC, BTC, ETH"
          on={method === 'crypto'}
          onPress={() => setMethod('crypto')}
          tag="New"
        />
      </View>

      <View style={styles.summary}>
        <Row label={`${planLabel} (${cycle}ly)`} value={formatMoney(price, currency)} />
        <Row label="VAT (KDV)" value="included" muted />
        <View style={styles.divider} />
        <Row label="Today" value={formatMoney(price, currency)} bold />
      </View>

      <View style={{ flex: 1 }} />
      <PrimaryButton
        label={method === 'card' ? `Pay ${formatMoney(price, currency)}` : 'Continue with crypto'}
        onPress={onConfirm}
      />
      <Text style={styles.legal}>
        By continuing you authorise FitClub to bill you on the schedule above.
        Manage anytime in Pay tab.
      </Text>
    </ScreenContainer>
  );
}

function MethodOption({
  icon,
  title,
  sub,
  on,
  onPress,
  tag,
}: {
  icon: React.ReactNode;
  title: string;
  sub: string;
  on: boolean;
  onPress: () => void;
  tag?: string;
}) {
  return (
    <Pressable
      style={[styles.option, on && styles.optionOn]}
      onPress={onPress}
    >
      <View style={styles.iconWrap}>{icon}</View>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={styles.optionTitle}>{title}</Text>
          {tag ? (
            <Text style={styles.tag}>{tag}</Text>
          ) : null}
        </View>
        <Text style={styles.optionSub}>{sub}</Text>
      </View>
      <View style={[styles.radio, on && styles.radioOn]}>
        {on ? <View style={styles.radioDot} /> : null}
      </View>
    </Pressable>
  );
}

function Row({
  label,
  value,
  muted,
  bold,
}: {
  label: string;
  value: string;
  muted?: boolean;
  bold?: boolean;
}) {
  return (
    <View style={styles.summaryRow}>
      <Text
        style={[
          styles.summaryLabel,
          muted && { color: tokens.color.fgFaint },
          bold && { color: tokens.color.fg, fontFamily: tokens.font.sansBold },
        ]}
      >
        {label}
      </Text>
      <Text
        style={[
          styles.summaryValue,
          muted && { color: tokens.color.fgFaint },
          bold && { fontFamily: tokens.font.sansExtrabold },
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  h1: {
    fontFamily: tokens.font.sansExtrabold,
    fontSize: 26,
    color: tokens.color.fg,
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  sub: {
    fontFamily: tokens.font.sansRegular,
    fontSize: 14,
    color: tokens.color.fgMuted,
    marginBottom: 22,
  },
  label: {
    fontFamily: tokens.font.sansSemibold,
    fontSize: 11,
    color: tokens.color.fgMuted,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  options: {
    gap: 8,
    marginBottom: 22,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    backgroundColor: tokens.color.surface,
    borderWidth: 2,
    borderColor: tokens.color.border,
    borderRadius: 14,
  },
  optionOn: {
    borderColor: tokens.color.fg,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: tokens.color.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cryptoIcon: {
    fontFamily: tokens.font.sansExtrabold,
    fontSize: 22,
    color: tokens.color.fg,
  },
  optionTitle: {
    fontFamily: tokens.font.sansBold,
    fontSize: 15,
    color: tokens.color.fg,
  },
  optionSub: {
    fontFamily: tokens.font.sansRegular,
    fontSize: 12,
    color: tokens.color.fgMuted,
    marginTop: 2,
  },
  tag: {
    fontFamily: tokens.font.sansSemibold,
    fontSize: 9,
    color: tokens.color.accentFg,
    backgroundColor: tokens.color.accentSoft,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: tokens.color.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOn: {
    borderColor: tokens.color.fg,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: tokens.color.fg,
  },
  summary: {
    backgroundColor: tokens.color.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: tokens.color.border,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  summaryLabel: {
    fontFamily: tokens.font.sansMedium,
    fontSize: 13,
    color: tokens.color.fg,
  },
  summaryValue: {
    fontFamily: tokens.font.monoSemibold,
    fontSize: 13,
    color: tokens.color.fg,
  },
  divider: {
    height: 1,
    backgroundColor: tokens.color.borderFaint,
    marginVertical: 4,
  },
  legal: {
    fontFamily: tokens.font.sansRegular,
    fontSize: 11,
    color: tokens.color.fgFaint,
    textAlign: 'center',
    paddingTop: 12,
    paddingBottom: 8,
  },
});
