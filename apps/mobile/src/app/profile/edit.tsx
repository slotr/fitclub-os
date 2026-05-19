import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '../../components/ScreenContainer';
import { BackButtonRow } from '../../components/BackButton';
import { PrimaryButton } from '../../components/PrimaryButton';
import { tokens } from '../../theme/tokens';
import { useAuth } from '../../lib/store';

function deriveInitials(first: string, last: string): string {
  const f = first.trim()[0] ?? '';
  const l = last.trim()[0] ?? '';
  const init = (f + l).toUpperCase();
  return init || '??';
}

export default function ProfileEditScreen() {
  const router = useRouter();
  const { member, completeOnboarding } = useAuth();

  const [firstName, setFirstName] = useState(member?.firstName ?? '');
  const [lastName, setLastName] = useState(member?.lastName ?? '');
  const [email, setEmail] = useState(member?.email ?? '');
  const [submitting, setSubmitting] = useState(false);

  const dirty =
    firstName !== (member?.firstName ?? '') ||
    lastName !== (member?.lastName ?? '') ||
    email !== (member?.email ?? '');

  const valid =
    firstName.trim().length >= 1 &&
    lastName.trim().length >= 1 &&
    /^\S+@\S+\.\S+$/.test(email);

  const onSave = async () => {
    if (!dirty || !valid || submitting) return;
    setSubmitting(true);
    // TODO: real PATCH /me via Supabase / @fitness/api once backend is wired.
    await new Promise((r) => setTimeout(r, 400));
    completeOnboarding({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      initials: deriveInitials(firstName, lastName),
    });
    setSubmitting(false);
    router.back();
  };

  return (
    <ScreenContainer>
      <BackButtonRow />
      <Text style={styles.h1}>Edit profile</Text>
      <Text style={styles.sub}>
        These show up on your membership card and receipts.
      </Text>

      <View style={styles.avatarRow}>
        <LinearGradient
          colors={['#fef3c7', '#f59e0b']}
          style={styles.avatar}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.avatarText}>
            {deriveInitials(firstName, lastName)}
          </Text>
        </LinearGradient>
        <Pressable style={styles.changePhoto}>
          <Text style={styles.changePhotoLabel}>Change photo</Text>
        </Pressable>
      </View>

      <Field label="First name" value={firstName} onChange={setFirstName} placeholder="Hakan" />
      <Field label="Last name" value={lastName} onChange={setLastName} placeholder="Karaca" />
      <Field
        label="Email"
        value={email}
        onChange={setEmail}
        placeholder="you@example.com"
        keyboardType="email-address"
      />

      <View style={styles.readOnly}>
        <Text style={styles.readOnlyLabel}>Phone (verified)</Text>
        <Text style={styles.readOnlyValue}>{member?.phoneMasked ?? '—'}</Text>
      </View>

      <View style={{ flex: 1 }} />
      <PrimaryButton
        label={submitting ? 'Saving…' : 'Save changes'}
        onPress={onSave}
        disabled={!dirty || !valid || submitting}
      />
    </ScreenContainer>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  keyboardType,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'email-address';
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
        autoCapitalize={keyboardType === 'email-address' ? 'none' : 'words'}
        autoCorrect={false}
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
    marginBottom: 18,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 22,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: tokens.font.sansBold,
    fontSize: 22,
    color: tokens.color.accentFg,
    letterSpacing: -0.5,
  },
  changePhoto: {
    height: 36,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: tokens.color.border,
    backgroundColor: tokens.color.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  changePhotoLabel: {
    fontFamily: tokens.font.sansSemibold,
    fontSize: 12,
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
    height: 48,
    backgroundColor: tokens.color.surface,
    borderWidth: 1,
    borderColor: tokens.color.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 15,
    fontFamily: tokens.font.sansRegular,
    color: tokens.color.fg,
  },
  readOnly: {
    marginTop: 4,
    backgroundColor: tokens.color.bg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: tokens.color.border,
    padding: 14,
  },
  readOnlyLabel: {
    fontFamily: tokens.font.sansSemibold,
    fontSize: 11,
    color: tokens.color.fgMuted,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  readOnlyValue: {
    fontFamily: tokens.font.monoSemibold,
    fontSize: 14,
    color: tokens.color.fg,
  },
});
