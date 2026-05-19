import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import QRCode from 'react-native-qrcode-svg';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScreenContainer } from '../../components/ScreenContainer';
import { BackButtonRow } from '../../components/BackButton';
import { PrimaryButton } from '../../components/PrimaryButton';
import { tokens } from '../../theme/tokens';
import { useAuth } from '../../lib/store';
import { recordCryptoIntent } from '../../lib/api';
import { formatMoney } from '../../lib/money';

type Chain = 'usdt_trc20' | 'usdc_eth' | 'usdc_base' | 'btc' | 'eth';

const CHAINS: Array<{
  id: Chain;
  label: string;
  rateUsd: number;
  symbol: string;
  // Demo addresses. Replace with provider-issued addresses in production.
  address: string;
  uriScheme: string;
}> = [
  {
    id: 'usdt_trc20',
    label: 'USDT · TRC20',
    rateUsd: 1,
    symbol: 'USDT',
    address: 'TXYZ4qK9pL3aB7cD5eF8gH2iJ1kM6nO0pQrSt',
    uriScheme: 'tron',
  },
  {
    id: 'usdc_eth',
    label: 'USDC · Ethereum',
    rateUsd: 1,
    symbol: 'USDC',
    address: '0xA1b2C3d4E5f6789012345678901234abcDEF1234',
    uriScheme: 'ethereum',
  },
  {
    id: 'usdc_base',
    label: 'USDC · Base',
    rateUsd: 1,
    symbol: 'USDC',
    address: '0xC9d8B7a6E5f4321098765432109876fedCBA9876',
    uriScheme: 'ethereum',
  },
  {
    id: 'btc',
    label: 'Bitcoin',
    rateUsd: 68000,
    symbol: 'BTC',
    address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
    uriScheme: 'bitcoin',
  },
  {
    id: 'eth',
    label: 'Ethereum',
    rateUsd: 3400,
    symbol: 'ETH',
    address: '0xDeF1234567890aBcDeF1234567890aBcDeF12345',
    uriScheme: 'ethereum',
  },
];

const TRY_TO_USD = Number(process.env.EXPO_PUBLIC_TRY_USD_RATE ?? '32.5');

const PLAN_LABEL: Record<string, 'Basic' | 'Premium' | 'Performance'> = {
  basic: 'Basic',
  premium: 'Premium',
  performance: 'Performance',
};

export default function CryptoCheckoutScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    plan?: string;
    price?: string;
    cycle?: string;
    next?: string;
  }>();
  const { member, currency } = useAuth();

  const planLabel = PLAN_LABEL[params.plan ?? ''] ?? 'Premium';
  const rawPrice = Number(params.price ?? 899);
  const priceTry = Number.isFinite(rawPrice) && rawPrice > 0 ? rawPrice : 899;
  const cycle = params.cycle === 'yearly' ? 'year' : 'month';
  const next = params.next ?? '/(tabs)';
  const priceUsd = priceTry / TRY_TO_USD;

  const [chain, setChain] = useState<Chain>('usdt_trc20');
  const [pending, setPending] = useState(false);
  const [paymentId, setPaymentId] = useState<string | null>(null);

  const active = CHAINS.find((c) => c.id === chain)!;
  const cryptoAmount = useMemo(
    () =>
      active.rateUsd >= 1000
        ? (priceUsd / active.rateUsd).toFixed(6)
        : (priceUsd / active.rateUsd).toFixed(2),
    [active, priceUsd],
  );

  // Pre-create the pending payment row as soon as the user lands here so
  // we have a stable paymentId to reference in the confirm step + webhook.
  useEffect(() => {
    let cancelled = false;
    if (!member?.dbId) return;
    setPaymentId(null);
    void recordCryptoIntent(member.dbId, priceTry * 100, 'TRY', chain).then(
      (r) => {
        if (!cancelled) setPaymentId(r.paymentId);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [member?.dbId, priceTry, chain]);

  const qrValue = useMemo(() => {
    // BIP21-style URI most wallets parse; falls back to raw address.
    if (active.id === 'btc') return `bitcoin:${active.address}?amount=${cryptoAmount}`;
    if (active.uriScheme === 'ethereum')
      return `ethereum:${active.address}?value=${cryptoAmount}`;
    return active.address;
  }, [active, cryptoAmount]);

  const onCopyAddress = async () => {
    await Clipboard.setStringAsync(active.address);
    Alert.alert('Address copied', 'Paste it in your wallet to send the payment.');
  };

  const onMarkPaid = () => {
    if (pending) return;
    setPending(true);
    Alert.alert(
      'Confirm send?',
      `Have you broadcast ${cryptoAmount} ${active.symbol} on ${active.label}? We'll confirm it on-chain before unlocking your plan.`,
      [
        {
          text: 'Not yet',
          style: 'cancel',
          onPress: () => setPending(false),
        },
        {
          text: 'Yes, I sent it',
          onPress: () => {
            // Intentionally do NOT activate the membership here. The
            // crypto webhook flips the pending payment row to `paid` once
            // the tx confirms on-chain — the admin/back-end then promotes
            // the member to active. Activating client-side would hand out
            // free memberships to anyone who taps this button.
            Alert.alert(
              'We are checking',
              `We will confirm your ${active.symbol} transfer on-chain (≈2 min for USDT, ≈10 min for BTC). Your ${planLabel} plan unlocks automatically once it lands.`,
              [
                {
                  text: 'OK',
                  onPress: () =>
                    router.replace(
                      next as Parameters<typeof router.replace>[0],
                    ),
                },
              ],
            );
          },
        },
      ],
    );
  };

  return (
    <ScreenContainer>
      <BackButtonRow fallback="/billing/checkout" />
      <Text style={styles.h1}>Pay with crypto.</Text>
      <Text style={styles.sub}>
        Send {planLabel} membership ({cycle}ly · {formatMoney(priceTry, currency)})
        to the address below.
      </Text>

      <Text style={styles.label}>Chain</Text>
      <View style={styles.chainRow}>
        {CHAINS.map((c) => (
          <Pressable
            key={c.id}
            style={[styles.chainPill, chain === c.id && styles.chainPillOn]}
            onPress={() => setChain(c.id)}
          >
            <Text
              style={[styles.chainLabel, chain === c.id && styles.chainLabelOn]}
            >
              {c.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.qrCard}>
        <QRCode
          value={qrValue}
          size={200}
          backgroundColor="#fff"
          color={tokens.color.fg}
        />
        <View style={styles.amountRow}>
          <Text style={styles.amountValue}>
            {cryptoAmount} {active.symbol}
          </Text>
          <Text style={styles.amountFiat}>
            ≈ ${priceUsd.toFixed(2)} USD
          </Text>
        </View>
      </View>

      <Pressable style={styles.addressBox} onPress={onCopyAddress}>
        <Text style={styles.addressLabel}>Address · tap to copy</Text>
        <Text style={styles.addressValue} numberOfLines={1} ellipsizeMode="middle">
          {active.address}
        </Text>
      </Pressable>

      <Text style={styles.warn}>
        ⚠ Send only {active.symbol} on {active.label}. Wrong chain = lost funds.
      </Text>

      {paymentId ? (
        <Text style={styles.refId}>
          Ref: {paymentId.slice(0, 8)}
        </Text>
      ) : null}

      <View style={{ flex: 1 }} />
      <PrimaryButton
        label={pending ? 'Confirming…' : 'I have sent the payment'}
        onPress={onMarkPaid}
        disabled={pending}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  h1: {
    fontFamily: tokens.font.sansExtrabold,
    fontSize: 24,
    color: tokens.color.fg,
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  sub: {
    fontFamily: tokens.font.sansRegular,
    fontSize: 13,
    color: tokens.color.fgMuted,
    marginBottom: 16,
    lineHeight: 18,
  },
  label: {
    fontFamily: tokens.font.sansSemibold,
    fontSize: 11,
    color: tokens.color.fgMuted,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  chainRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 18,
  },
  chainPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: tokens.color.surface,
    borderWidth: 1,
    borderColor: tokens.color.border,
  },
  chainPillOn: {
    backgroundColor: tokens.color.fg,
    borderColor: tokens.color.fg,
  },
  chainLabel: {
    fontFamily: tokens.font.sansSemibold,
    fontSize: 12,
    color: tokens.color.fg,
  },
  chainLabelOn: {
    color: tokens.color.surface,
  },
  qrCard: {
    backgroundColor: tokens.color.surface,
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: tokens.color.border,
    marginBottom: 12,
  },
  amountRow: {
    marginTop: 14,
    alignItems: 'center',
  },
  amountValue: {
    fontFamily: tokens.font.monoSemibold,
    fontSize: 18,
    color: tokens.color.fg,
  },
  amountFiat: {
    fontFamily: tokens.font.sansRegular,
    fontSize: 12,
    color: tokens.color.fgMuted,
    marginTop: 2,
  },
  addressBox: {
    backgroundColor: tokens.color.surface,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: tokens.color.border,
    marginBottom: 10,
  },
  addressLabel: {
    fontFamily: tokens.font.sansSemibold,
    fontSize: 11,
    color: tokens.color.fgMuted,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  addressValue: {
    fontFamily: tokens.font.mono,
    fontSize: 13,
    color: tokens.color.fg,
  },
  warn: {
    fontFamily: tokens.font.sansMedium,
    fontSize: 11,
    color: tokens.color.warnFg,
    backgroundColor: tokens.color.warnSoft,
    padding: 10,
    borderRadius: 10,
    marginBottom: 12,
  },
  refId: {
    fontFamily: tokens.font.mono,
    fontSize: 11,
    color: tokens.color.fgFaint,
    textAlign: 'center',
    marginBottom: 4,
  },
});
