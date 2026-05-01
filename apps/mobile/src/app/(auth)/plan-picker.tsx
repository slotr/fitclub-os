import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '../../components/ScreenContainer';
import { tokens } from '../../theme/tokens';

type Plan = {
  id: 'basic' | 'premium' | 'performance';
  name: string;
  monthlyTry: number;
  desc: string;
  features: string[];
  featured?: boolean;
};

const PLANS: Plan[] = [
  {
    id: 'basic',
    name: 'Basic',
    monthlyTry: 499,
    desc: 'For walk-in members',
    features: ['Open gym access', 'Locker room', 'Mobile QR check-in'],
  },
  {
    id: 'premium',
    name: 'Premium',
    monthlyTry: 899,
    desc: 'Open gym + classes + sauna',
    features: [
      'Everything in Basic',
      'Unlimited group classes',
      'Sauna + steam access',
      'Towel service',
    ],
    featured: true,
  },
  {
    id: 'performance',
    name: 'Performance',
    monthlyTry: 1499,
    desc: '+ 4 PT sessions / month',
    features: ['Everything in Premium', '4 personal training sessions'],
  },
];

export default function PlanPickerScreen() {
  const router = useRouter();
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('monthly');

  const formatPrice = useMemo(
    () => (monthly: number) => {
      const v = billing === 'monthly' ? monthly : Math.round(monthly * 10);
      return `₺${v.toLocaleString('en-US')}`;
    },
    [billing],
  );
  const cadence = billing === 'monthly' ? '/month' : '/year';

  return (
    <ScreenContainer padding={20}>
      <Text style={styles.h1}>Pick your plan.</Text>
      <Text style={styles.sub}>Change or cancel any time from the app.</Text>

      <View style={styles.toggle}>
        {(['monthly', 'yearly'] as const).map((opt) => {
          const active = billing === opt;
          return (
            <Pressable
              key={opt}
              style={[styles.toggleItem, active && styles.toggleItemActive]}
              onPress={() => setBilling(opt)}
            >
              <Text style={[styles.toggleLabel, active && styles.toggleLabelActive]}>
                {opt === 'monthly' ? 'Monthly' : 'Yearly · save 17%'}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {PLANS.map((p) => {
        const featured = !!p.featured;
        return (
          <View
            key={p.id}
            style={[
              styles.plan,
              featured && styles.planFeatured,
            ]}
          >
            {featured ? (
              <View style={styles.ribbon}>
                <Text style={styles.ribbonText}>Most popular</Text>
              </View>
            ) : null}
            <Text style={styles.name}>{p.name}</Text>
            <Text style={styles.price}>
              {formatPrice(p.monthlyTry)}
              <Text style={styles.priceSmall}>{cadence}</Text>
            </Text>
            <Text style={styles.desc}>{p.desc}</Text>
            <View style={{ marginBottom: 14 }}>
              {p.features.map((f) => (
                <View key={f} style={styles.featureRow}>
                  <Text style={styles.check}>✓</Text>
                  <Text style={styles.featureText}>{f}</Text>
                </View>
              ))}
            </View>
            <Pressable
              onPress={() => router.push('/permissions')}
              style={[
                styles.cta,
                featured ? styles.ctaAccent : styles.ctaDark,
              ]}
            >
              <Text
                style={[
                  styles.ctaLabel,
                  featured ? { color: tokens.color.accentFg } : { color: tokens.color.surface },
                ]}
              >
                Choose {p.name}
              </Text>
            </Pressable>
          </View>
        );
      })}

      <Text style={styles.footer}>
        Need something custom?{' '}
        <Text style={styles.footerLink}>Contact us</Text>
      </Text>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  h1: {
    fontFamily: tokens.font.sansExtrabold,
    fontSize: 24,
    color: tokens.color.fg,
    letterSpacing: -0.5,
    marginTop: 4,
    marginBottom: 4,
  },
  sub: {
    fontFamily: tokens.font.sansRegular,
    fontSize: 13,
    color: tokens.color.fgMuted,
    marginBottom: 14,
  },
  toggle: {
    flexDirection: 'row',
    backgroundColor: tokens.color.borderFaint,
    borderRadius: 10,
    padding: 3,
    gap: 4,
    marginBottom: 14,
  },
  toggleItem: {
    flex: 1,
    height: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleItemActive: {
    backgroundColor: tokens.color.surface,
    ...tokens.shadow.sm,
  },
  toggleLabel: {
    fontFamily: tokens.font.sansSemibold,
    fontSize: 12,
    color: tokens.color.fgMuted,
  },
  toggleLabelActive: { color: tokens.color.fg },

  plan: {
    backgroundColor: tokens.color.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: tokens.color.border,
    padding: 18,
    marginBottom: 12,
    ...tokens.shadow.sm,
    position: 'relative',
  },
  planFeatured: {
    borderColor: tokens.color.accent,
    borderWidth: 2,
    shadowColor: '#f59e0b',
    shadowOpacity: 0.18,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  ribbon: {
    position: 'absolute',
    top: -10,
    right: 16,
    backgroundColor: tokens.color.accent,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
  },
  ribbonText: {
    fontFamily: tokens.font.sansBold,
    fontSize: 10,
    color: tokens.color.accentFg,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  name: {
    fontFamily: tokens.font.sansBold,
    fontSize: 15,
    color: tokens.color.fg,
  },
  price: {
    fontFamily: tokens.font.sansExtrabold,
    fontSize: 28,
    color: tokens.color.fg,
    marginVertical: 2,
    letterSpacing: -0.5,
  },
  priceSmall: {
    fontFamily: tokens.font.sansMedium,
    fontSize: 12,
    color: tokens.color.fgMuted,
    letterSpacing: 0,
  },
  desc: {
    fontFamily: tokens.font.sansRegular,
    fontSize: 12,
    color: tokens.color.fgMuted,
    marginBottom: 12,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    gap: 8,
  },
  check: {
    fontFamily: tokens.font.sansBold,
    color: tokens.color.good,
    fontSize: 14,
    width: 14,
    textAlign: 'center',
  },
  featureText: {
    fontFamily: tokens.font.sansRegular,
    fontSize: 12,
    color: tokens.color.fg,
  },
  cta: {
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaDark: { backgroundColor: tokens.color.fg },
  ctaAccent: { backgroundColor: tokens.color.accent },
  ctaLabel: {
    fontFamily: tokens.font.sansSemibold,
    fontSize: 13,
  },
  footer: {
    fontFamily: tokens.font.sansRegular,
    fontSize: 12,
    color: tokens.color.fgMuted,
    textAlign: 'center',
    marginTop: 14,
  },
  footerLink: {
    color: tokens.color.accent,
    fontFamily: tokens.font.sansSemibold,
  },
});
