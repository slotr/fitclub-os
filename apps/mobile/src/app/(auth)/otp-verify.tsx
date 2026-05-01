import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '../../components/ScreenContainer';
import { BackButtonRow } from '../../components/BackButton';
import { tokens } from '../../theme/tokens';
import { useAuth } from '../../lib/store';
import { getSupabase } from '../../lib/supabase';

const LENGTH = 6;
const STUB_CODE = '123456';

export default function OtpVerifyScreen() {
  const router = useRouter();
  const { phone } = useAuth();
  const inputs = useRef<(TextInput | null)[]>([]);
  const [digits, setDigits] = useState<string[]>(Array<string>(LENGTH).fill(''));
  const [active, setActive] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(60);
  const [error, setError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const id = setInterval(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearInterval(id);
  }, [secondsLeft]);

  // When all 6 digits filled, validate.
  useEffect(() => {
    const code = digits.join('');
    if (code.length !== LENGTH) {
      setError(null);
      return undefined;
    }
    let cancelled = false;
    (async () => {
      setVerifying(true);
      setError(null);
      const supabase = getSupabase();
      if (supabase && phone) {
        const { error: authError } = await supabase.auth.verifyOtp({
          phone,
          token: code,
          type: 'sms',
        });
        if (cancelled) return;
        if (authError) {
          setError('That code didn’t match. Try again.');
          setVerifying(false);
          return;
        }
        setVerifying(false);
        router.push('/profile');
        return;
      }
      // Fallback when Supabase isn't configured (demo mode).
      if (code === STUB_CODE) {
        setVerifying(false);
        router.push('/profile');
      } else {
        setVerifying(false);
        setError('That code didn’t match. Try again.');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [digits, phone, router]);

  const onResend = async () => {
    setSecondsLeft(60);
    setError(null);
    const supabase = getSupabase();
    if (supabase && phone) {
      await supabase.auth.signInWithOtp({ phone });
    }
  };

  const onChange = (idx: number, raw: string) => {
    const ch = raw.replace(/\D/g, '').slice(-1);
    const copy = [...digits];
    copy[idx] = ch;
    setDigits(copy);
    if (ch && idx < LENGTH - 1) {
      setActive(idx + 1);
      inputs.current[idx + 1]?.focus();
    }
  };

  const onKey = (idx: number, key: string) => {
    if (key === 'Backspace' && !digits[idx] && idx > 0) {
      setActive(idx - 1);
      inputs.current[idx - 1]?.focus();
    }
  };

  return (
    <ScreenContainer>
      <BackButtonRow />

      <Text style={styles.h1} numberOfLines={2}>
        Code sent to {phone ?? '+90 555 ••• 11 22'}.
      </Text>
      <Text style={styles.sub}>Enter the 6-digit code below.</Text>

      <View style={styles.row}>
        {digits.map((d, idx) => (
          <Pressable
            key={idx}
            style={[styles.cell, active === idx && styles.cellActive]}
            onPress={() => {
              setActive(idx);
              inputs.current[idx]?.focus();
            }}
          >
            <TextInput
              ref={(ref) => {
                inputs.current[idx] = ref;
              }}
              value={d}
              onChangeText={(v) => onChange(idx, v)}
              onKeyPress={({ nativeEvent }) => onKey(idx, nativeEvent.key)}
              onFocus={() => setActive(idx)}
              keyboardType="number-pad"
              maxLength={1}
              textContentType="oneTimeCode"
              style={styles.invisibleInput}
              autoFocus={idx === 0}
            />
            <Text style={[styles.digit, !d && styles.digitEmpty]}>{d || '0'}</Text>
            {/* Render a faint placeholder when empty */}
            {!d ? <View style={styles.coverEmpty} /> : null}
          </Pressable>
        ))}
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Text style={styles.resend}>
        Didn’t get it?{' '}
        {secondsLeft > 0 ? (
          <Text style={styles.resendMuted}>Resend in {secondsLeft}s</Text>
        ) : (
          <Text style={styles.resendActive} onPress={onResend}>
            Resend now
          </Text>
        )}
      </Text>
      <Text
        style={styles.wrong}
        onPress={() => router.back()}
      >
        Wrong number?
      </Text>
      {verifying ? (
        <Text style={styles.hint}>Verifying…</Text>
      ) : (
        <Text style={styles.hint}>
          {phone ? 'Code sent over SMS.' : 'Tip: enter 123456 to continue (demo mode).'}
        </Text>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  h1: {
    fontFamily: tokens.font.sansBold,
    fontSize: 24,
    color: tokens.color.fg,
    letterSpacing: -0.5,
    lineHeight: 30,
    marginBottom: 8,
  },
  sub: {
    fontFamily: tokens.font.sansRegular,
    fontSize: 14,
    color: tokens.color.fgMuted,
    marginBottom: 28,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 28,
  },
  cell: {
    flex: 1,
    height: 56,
    backgroundColor: tokens.color.surface,
    borderWidth: 1,
    borderColor: tokens.color.border,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  cellActive: {
    borderColor: tokens.color.fg,
    borderWidth: 2,
  },
  digit: {
    fontFamily: tokens.font.sansBold,
    fontSize: 22,
    color: tokens.color.fg,
  },
  digitEmpty: {
    color: 'transparent',
  },
  coverEmpty: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: tokens.color.surface,
  },
  invisibleInput: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    opacity: 0,
    color: 'transparent',
    backgroundColor: 'transparent',
    zIndex: 2,
  },
  error: {
    fontFamily: tokens.font.sansMedium,
    fontSize: 13,
    color: tokens.color.bad,
    textAlign: 'center',
    marginBottom: 12,
  },
  resend: {
    fontFamily: tokens.font.sansRegular,
    fontSize: 13,
    color: tokens.color.fgMuted,
    textAlign: 'center',
    marginBottom: 14,
  },
  resendMuted: {
    color: tokens.color.fgFaint,
    fontFamily: tokens.font.mono,
  },
  resendActive: {
    color: tokens.color.fg,
    fontFamily: tokens.font.sansSemibold,
    textDecorationLine: 'underline',
  },
  wrong: {
    fontFamily: tokens.font.sansRegular,
    fontSize: 12,
    color: tokens.color.fgMuted,
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
  hint: {
    fontFamily: tokens.font.mono,
    fontSize: 11,
    color: tokens.color.fgFaint,
    textAlign: 'center',
    marginTop: 24,
  },
});
