import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '../../components/ScreenContainer';
import { BackButtonRow } from '../../components/BackButton';
import { ChevronDownIcon } from '../../components/Icons';
import { PrimaryButton } from '../../components/PrimaryButton';
import { tokens } from '../../theme/tokens';
import { useAuth } from '../../lib/store';
import { getSupabase } from '../../lib/supabase';

export default function OtpRequestScreen() {
  const router = useRouter();
  const { setPhone } = useAuth();
  const [value, setValue] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const valid = useMemo(() => {
    const digits = value.replace(/\D/g, '');
    return digits.length >= 10;
  }, [value]);

  const onContinue = async () => {
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    const phone = `+90${value.replace(/\D/g, '')}`;
    setPhone(phone);
    const supabase = getSupabase();
    if (supabase) {
      const { error: authError } = await supabase.auth.signInWithOtp({ phone });
      if (authError) {
        setError(authError.message);
        setSubmitting(false);
        return;
      }
    }
    setSubmitting(false);
    router.push('/otp-verify');
  };

  return (
    <ScreenContainer>
      <BackButtonRow />

      <Text style={styles.h1}>Welcome back.</Text>
      <Text style={styles.sub}>Enter your phone to continue.</Text>

      <Text style={styles.label}>Phone number</Text>
      <View style={styles.row}>
        <Pressable style={styles.country} hitSlop={4}>
          <Text style={styles.flag}>🇹🇷</Text>
          <Text style={styles.code}>+90</Text>
          <View style={{ marginLeft: 'auto' }}>
            <ChevronDownIcon size={14} color={tokens.color.fgFaint} />
          </View>
        </Pressable>

        <TextInput
          value={value}
          onChangeText={setValue}
          placeholder="555 123 45 67"
          placeholderTextColor={tokens.color.fgFaint}
          keyboardType="phone-pad"
          autoComplete="tel"
          textContentType="telephoneNumber"
          style={styles.input}
        />
      </View>

      <PrimaryButton
        label={submitting ? 'Sending…' : 'Continue'}
        onPress={onContinue}
        disabled={!valid || submitting}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={{ flex: 1 }} />

      <Text style={styles.terms}>
        By continuing you agree to our{' '}
        <Text style={styles.termsLink}>Terms</Text> and{' '}
        <Text style={styles.termsLink}>Privacy</Text>.
      </Text>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  h1: {
    fontFamily: tokens.font.sansBold,
    fontSize: 28,
    color: tokens.color.fg,
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  sub: {
    fontFamily: tokens.font.sansRegular,
    fontSize: 14,
    color: tokens.color.fgMuted,
    marginBottom: 28,
  },
  label: {
    fontFamily: tokens.font.sansSemibold,
    fontSize: 11,
    color: tokens.color.fgMuted,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 22,
  },
  country: {
    width: 100,
    height: 50,
    backgroundColor: tokens.color.surface,
    borderWidth: 1,
    borderColor: tokens.color.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  flag: { fontSize: 18 },
  code: {
    fontFamily: tokens.font.monoSemibold,
    fontSize: 15,
    color: tokens.color.fg,
  },
  input: {
    flex: 1,
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
  terms: {
    fontFamily: tokens.font.sansRegular,
    fontSize: 11,
    color: tokens.color.fgFaint,
    textAlign: 'center',
    paddingHorizontal: 8,
    paddingTop: 18,
    paddingBottom: 24,
    lineHeight: 16,
  },
  termsLink: {
    color: tokens.color.fgMuted,
    textDecorationLine: 'underline',
  },
  error: {
    fontFamily: tokens.font.sansMedium,
    fontSize: 13,
    color: tokens.color.bad,
    textAlign: 'center',
    marginTop: 12,
  },
});
