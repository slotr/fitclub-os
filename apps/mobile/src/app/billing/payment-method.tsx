import { useMemo, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '../../components/ScreenContainer';
import { BackButtonRow } from '../../components/BackButton';
import { PrimaryButton } from '../../components/PrimaryButton';
import { tokens } from '../../theme/tokens';
import { useAuth } from '../../lib/store';

function detectBrand(raw: string): string {
  const d = raw.replace(/\D/g, '');
  if (/^4/.test(d)) return 'Visa';
  if (/^5[1-5]/.test(d)) return 'Mastercard';
  if (/^3[47]/.test(d)) return 'Amex';
  if (/^6/.test(d)) return 'Discover';
  return 'Card';
}

function formatCard(raw: string): string {
  const d = raw.replace(/\D/g, '').slice(0, 16);
  return d.replace(/(.{4})/g, '$1 ').trim();
}

function formatExp(raw: string): string {
  const d = raw.replace(/\D/g, '').slice(0, 4);
  if (d.length < 3) return d;
  return `${d.slice(0, 2)}/${d.slice(2)}`;
}

export default function PaymentMethodScreen() {
  const router = useRouter();
  const { member, updateCard } = useAuth();

  const [number, setNumber] = useState('');
  const [exp, setExp] = useState('');
  const [cvc, setCvc] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const digits = number.replace(/\D/g, '');
  const valid = useMemo(() => {
    return digits.length >= 13 && /^\d{2}\/\d{2}$/.test(exp) && cvc.length >= 3;
  }, [digits, exp, cvc]);

  const onSave = async () => {
    if (!valid || submitting) return;
    setSubmitting(true);
    setError(null);
    // TODO: real Stripe SetupIntent confirm via ${EXPO_PUBLIC_API_URL}/billing/setup-intent
    // For now, persist last4 + brand client-side so the UI reflects the change.
    await new Promise((r) => setTimeout(r, 600));
    updateCard(detectBrand(digits), digits.slice(-4));
    setSubmitting(false);
    router.back();
  };

  return (
    <ScreenContainer>
      <BackButtonRow />
      <Text style={styles.h1}>Update card</Text>
      <Text style={styles.sub}>
        Used for your monthly {member?.plan ?? 'membership'} payment.
      </Text>

      {member?.cardLast4 ? (
        <View style={styles.currentCard}>
          <Text style={styles.currentLabel}>Currently on file</Text>
          <Text style={styles.currentValue}>
            {member.cardBrand} •••• {member.cardLast4}
          </Text>
        </View>
      ) : null}

      <Field label="Card number" value={number} onChange={(v) => setNumber(formatCard(v))} placeholder="4242 4242 4242 4242" keyboardType="number-pad" />
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <View style={{ flex: 1 }}>
          <Field
            label="Expiry"
            value={exp}
            onChange={(v) => setExp(formatExp(v))}
            placeholder="MM/YY"
            keyboardType="number-pad"
          />
        </View>
        <View style={{ flex: 1 }}>
          <Field
            label="CVC"
            value={cvc}
            onChange={(v) => setCvc(v.replace(/\D/g, '').slice(0, 4))}
            placeholder="123"
            keyboardType="number-pad"
            secureTextEntry
          />
        </View>
      </View>

      <View style={{ flex: 1 }} />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <PrimaryButton
        label={submitting ? 'Saving…' : 'Save card'}
        onPress={onSave}
        disabled={!valid || submitting}
      />
      <Text style={styles.legal}>
        Card data does not leave the demo build. Production wires this through Stripe SetupIntent.
      </Text>
    </ScreenContainer>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  keyboardType,
  secureTextEntry,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  keyboardType?: 'number-pad' | 'default';
  secureTextEntry?: boolean;
}) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={tokens.color.fgFaint}
        keyboardType={keyboardType ?? 'default'}
        secureTextEntry={secureTextEntry}
        style={styles.input}
      />
    </View>
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
  currentCard: {
    backgroundColor: tokens.color.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: tokens.color.border,
  },
  currentLabel: {
    fontFamily: tokens.font.sansSemibold,
    fontSize: 11,
    color: tokens.color.fgMuted,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  currentValue: {
    fontFamily: tokens.font.monoSemibold,
    fontSize: 15,
    color: tokens.color.fg,
  },
  label: {
    fontFamily: tokens.font.sansSemibold,
    fontSize: 11,
    color: tokens.color.fgMuted,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  input: {
    height: 50,
    backgroundColor: tokens.color.surface,
    borderWidth: 1,
    borderColor: tokens.color.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 15,
    fontFamily: tokens.font.mono,
    color: tokens.color.fg,
  },
  error: {
    fontFamily: tokens.font.sansMedium,
    fontSize: 13,
    color: tokens.color.bad,
    textAlign: 'center',
    marginBottom: 12,
  },
  legal: {
    fontFamily: tokens.font.sansRegular,
    fontSize: 11,
    color: tokens.color.fgFaint,
    textAlign: 'center',
    paddingTop: 14,
    paddingBottom: 8,
  },
});
