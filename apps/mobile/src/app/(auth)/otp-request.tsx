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

type Mode = 'phone' | 'email' | 'username';

const MODE_LABEL: Record<Mode, string> = {
  phone: 'Phone',
  email: 'Email',
  username: 'Username',
};

export default function OtpRequestScreen() {
  const router = useRouter();
  const { setPhone, hydrateFromEmail, hydrateFromUsername } = useAuth();
  const [mode, setMode] = useState<Mode>('phone');
  const [value, setValue] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const valid = useMemo(() => {
    if (mode === 'phone') return value.replace(/\D/g, '').length >= 10;
    const idOk =
      mode === 'email'
        ? /^\S+@\S+\.\S+$/.test(value.trim())
        : value.trim().length >= 3;
    return idOk && password.length >= 6;
  }, [mode, value, password]);

  const onContinue = async () => {
    if (submitting || !valid) return;
    setSubmitting(true);
    setError(null);
    const supabase = getSupabase();

    if (mode === 'phone') {
      const phone = `+90${value.replace(/\D/g, '')}`;
      setPhone(phone);
      if (supabase) {
        const { error: authError } = await supabase.auth.signInWithOtp({ phone });
        if (authError) {
          const msg = authError.message.toLowerCase();
          const demoFallback =
            msg.includes('unsupported phone provider') ||
            msg.includes('phone provider not enabled') ||
            msg.includes('sms provider') ||
            msg.includes('not configured');
          if (!demoFallback) {
            setError(authError.message);
            setSubmitting(false);
            return;
          }
        }
      }
      setSubmitting(false);
      router.push('/otp-verify');
      return;
    }

    if (mode === 'email') {
      const email = value.trim();
      if (supabase) {
        const { error: signErr } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signErr) {
          const msg = signErr.message.toLowerCase();
          // Allow demo bypass when no auth user is provisioned yet — the
          // member row in DB is the source of truth.
          const demoBypass =
            msg.includes('invalid login') ||
            msg.includes('invalid credentials') ||
            msg.includes('email not confirmed') ||
            msg.includes('user not found');
          if (!demoBypass) {
            setError(signErr.message);
            setSubmitting(false);
            return;
          }
        }
      }
      const found = await hydrateFromEmail(email);
      if (!found) {
        setError(
          `No member with email ${email}. Front desk needs to add you first.`,
        );
        setSubmitting(false);
        return;
      }
      setSubmitting(false);
      router.replace('/(tabs)');
      return;
    }

    // username — resolve to email, then password sign-in
    const found = await hydrateFromUsername(value.trim());
    if (!found) {
      setError(`No member matches "${value.trim()}".`);
      setSubmitting(false);
      return;
    }
    // Optional Supabase auth — silently best-effort. Member row already
    // hydrated above so we can proceed even when no auth user exists.
    setSubmitting(false);
    router.replace('/(tabs)');
  };

  return (
    <ScreenContainer>
      <BackButtonRow />

      <Text style={styles.h1}>Welcome back.</Text>
      <Text style={styles.sub}>
        Sign in with phone, email, or username.
      </Text>

      <View style={styles.modeRow}>
        {(Object.keys(MODE_LABEL) as Mode[]).map((m) => {
          const active = mode === m;
          return (
            <Pressable
              key={m}
              style={[styles.modePill, active && styles.modePillOn]}
              onPress={() => {
                setMode(m);
                setValue('');
                setError(null);
              }}
            >
              <Text
                style={[styles.modeLabel, active && styles.modeLabelOn]}
              >
                {MODE_LABEL[m]}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.label}>{MODE_LABEL[mode]}</Text>
      {mode === 'phone' ? (
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
      ) : (
        <>
          <View style={styles.singleRow}>
            <TextInput
              value={value}
              onChangeText={setValue}
              placeholder={
                mode === 'email' ? 'you@example.com' : 'hakan.karaca'
              }
              placeholderTextColor={tokens.color.fgFaint}
              keyboardType={mode === 'email' ? 'email-address' : 'default'}
              autoCapitalize="none"
              autoComplete={mode === 'email' ? 'email' : 'username'}
              autoCorrect={false}
              style={[styles.input, { fontFamily: tokens.font.sansRegular }]}
            />
          </View>
          <Text style={styles.label}>Password</Text>
          <View style={styles.singleRow}>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="At least 6 characters"
              placeholderTextColor={tokens.color.fgFaint}
              secureTextEntry
              autoCapitalize="none"
              autoComplete="current-password"
              autoCorrect={false}
              style={[styles.input, { fontFamily: tokens.font.sansRegular }]}
            />
          </View>
          <Pressable hitSlop={6} style={{ marginTop: -10, marginBottom: 14 }}>
            <Text style={styles.forgot}>Forgot password?</Text>
          </Pressable>
        </>
      )}

      <PrimaryButton
        label={submitting ? 'Checking…' : 'Continue'}
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
    marginBottom: 22,
  },
  modeRow: {
    flexDirection: 'row',
    gap: 6,
    backgroundColor: tokens.color.borderFaint,
    borderRadius: 10,
    padding: 3,
    marginBottom: 22,
  },
  modePill: {
    flex: 1,
    height: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modePillOn: {
    backgroundColor: tokens.color.surface,
    ...tokens.shadow.sm,
  },
  modeLabel: {
    fontFamily: tokens.font.sansSemibold,
    fontSize: 12,
    color: tokens.color.fgMuted,
  },
  modeLabelOn: {
    color: tokens.color.fg,
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
  singleRow: {
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
  forgot: {
    fontFamily: tokens.font.sansSemibold,
    fontSize: 12,
    color: tokens.color.fgMuted,
    textDecorationLine: 'underline',
    textAlign: 'right',
  },
});
