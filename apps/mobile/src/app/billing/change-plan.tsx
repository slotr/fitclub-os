import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '../../components/ScreenContainer';
import { BackButtonRow } from '../../components/BackButton';
import { PrimaryButton } from '../../components/PrimaryButton';
import { tokens } from '../../theme/tokens';
import { useAuth } from '../../lib/store';
import { fetchPlans, type LivePlan } from '../../lib/api';
import { formatMoney } from '../../lib/money';
import type { Member } from '../../mocks/member';

type LocalPlan = {
  id: Member['plan'];
  priceMinor: number;
  perks: string[];
  highlight: boolean;
};

const FALLBACK_PLANS: LocalPlan[] = [
  {
    id: 'Basic',
    priceMinor: 49900,
    perks: ['Open gym access', 'Locker', 'Mobile QR check-in'],
    highlight: false,
  },
  {
    id: 'Premium',
    priceMinor: 89900,
    perks: [
      'Everything in Basic',
      'Unlimited classes',
      'Sauna + steam',
      'Towel service',
    ],
    highlight: true,
  },
  {
    id: 'Performance',
    priceMinor: 149900,
    perks: ['Everything in Premium', '4 PT sessions / month'],
    highlight: false,
  },
];

function toLocal(p: LivePlan): LocalPlan {
  return {
    id: p.shortName,
    priceMinor: p.priceMinor,
    perks: p.features,
    highlight: p.highlight,
  };
}

export default function ChangePlanScreen() {
  const router = useRouter();
  const { member, currency } = useAuth();
  const current = member?.plan ?? 'Premium';

  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<LocalPlan[]>(FALLBACK_PLANS);
  const [picked, setPicked] = useState<Member['plan']>(current);

  useEffect(() => {
    let active = true;
    fetchPlans().then((rows) => {
      if (!active) return;
      if (rows.length > 0) setPlans(rows.map(toLocal));
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  const target = plans.find((p) => p.id === picked) ?? plans[0];
  const dirty = picked !== current;

  const onConfirm = () => {
    if (!dirty || !target) return;
    router.replace({
      pathname: '/billing/checkout',
      params: {
        plan: target.id.toLowerCase(),
        price: String(target.priceMinor / 100),
        cycle: 'monthly',
        next: '/(tabs)/membership',
      },
    });
  };

  return (
    <ScreenContainer>
      <BackButtonRow />
      <Text style={styles.h1}>Change plan</Text>
      <Text style={styles.sub}>
        Switch takes effect on your next billing cycle.
      </Text>

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator color={tokens.color.fg} />
        </View>
      ) : null}

      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        {plans.map((p) => {
          const isCurrent = p.id === current;
          const isPicked = p.id === picked;
          return (
            <Pressable
              key={p.id}
              style={[
                styles.card,
                isPicked && styles.cardPicked,
                p.highlight && !isPicked && styles.cardHighlight,
              ]}
              onPress={() => setPicked(p.id)}
            >
              <View style={styles.cardHead}>
                <Text style={styles.cardName}>{p.id}</Text>
                {isCurrent ? (
                  <Text style={styles.tag}>Current</Text>
                ) : p.highlight ? (
                  <Text style={[styles.tag, styles.tagFeatured]}>
                    Most popular
                  </Text>
                ) : null}
              </View>
              <Text style={styles.cardPrice}>
                {formatMoney(p.priceMinor / 100, currency)}
                <Text style={styles.cardPriceSmall}> / month</Text>
              </Text>
              <View style={{ marginTop: 10 }}>
                {p.perks.map((perk) => (
                  <Text key={perk} style={styles.perk}>
                    • {perk}
                  </Text>
                ))}
              </View>
            </Pressable>
          );
        })}
      </ScrollView>

      <PrimaryButton
        label={
          dirty && target
            ? `Switch to ${target.id} (${formatMoney(target.priceMinor / 100, currency)})`
            : 'Pick a different plan'
        }
        onPress={onConfirm}
        disabled={!dirty}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  h1: {
    fontFamily: tokens.font.sansExtrabold,
    fontSize: 26,
    color: tokens.color.fg,
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  sub: {
    fontFamily: tokens.font.sansRegular,
    fontSize: 13,
    color: tokens.color.fgMuted,
    marginBottom: 16,
  },
  loader: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  card: {
    backgroundColor: tokens.color.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: tokens.color.border,
  },
  cardPicked: {
    borderColor: tokens.color.fg,
  },
  cardHighlight: {
    borderColor: tokens.color.accent,
  },
  cardHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  cardName: {
    fontFamily: tokens.font.sansExtrabold,
    fontSize: 17,
    color: tokens.color.fg,
    letterSpacing: -0.3,
  },
  tag: {
    fontFamily: tokens.font.sansSemibold,
    fontSize: 10,
    color: tokens.color.fgMuted,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    backgroundColor: tokens.color.bg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  tagFeatured: {
    color: '#92400e',
    backgroundColor: tokens.color.accentSoft,
  },
  cardPrice: {
    fontFamily: tokens.font.sansExtrabold,
    fontSize: 24,
    color: tokens.color.fg,
    letterSpacing: -0.4,
  },
  cardPriceSmall: {
    fontFamily: tokens.font.sansMedium,
    fontSize: 12,
    color: tokens.color.fgMuted,
  },
  perk: {
    fontFamily: tokens.font.sansRegular,
    fontSize: 13,
    color: tokens.color.fg,
    marginTop: 4,
  },
});
