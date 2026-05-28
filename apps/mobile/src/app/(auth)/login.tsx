import React, { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "../../components/ScreenContainer";
import { PrimaryButton } from "../../components/PrimaryButton";
import { tokens } from "../../theme/tokens";
import { sendLoginCode } from "../../lib/auth";

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const validEmail = /^\S+@\S+\.\S+$/.test(email.trim());

  const onSubmit = async () => {
    if (submitting || !validEmail) return;
    setSubmitting(true);
    try {
      await sendLoginCode(email.trim());
      router.push({
        pathname: "/(auth)/otp-verify",
        params: { email: email.trim().toLowerCase() },
      } as Parameters<typeof router.push>[0]);
    } catch (e: any) {
      Alert.alert("Could not send code", e?.message ?? String(e));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScreenContainer padding={24} contentStyle={{ paddingTop: 64 }}>
      <Text style={styles.title}>FitClub</Text>
      <Text style={styles.subtitle}>Sign in with your email</Text>

      <TextInput
        value={email}
        onChangeText={setEmail}
        placeholder="you@example.com"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        style={styles.input}
      />

      <PrimaryButton
        label={submitting ? "Sending…" : "Send code"}
        onPress={onSubmit}
        variant="primary"
        disabled={!validEmail || submitting}
        style={{ marginTop: 16 }}
      />

      <Text style={styles.helper}>
        We&apos;ll email you a 6-digit code. Ask your gym&apos;s front desk
        if you haven&apos;t been added yet.
      </Text>

      <Pressable onPress={() => router.push("/(auth)/otp-request" as Parameters<typeof router.push>[0])} style={styles.fallback}>
        <Text style={styles.fallbackText}>Use phone instead</Text>
      </Pressable>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: {
    fontFamily: tokens.font.sansExtrabold,
    fontSize: 32,
    color: tokens.color.fg,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: tokens.font.sansMedium,
    fontSize: 15,
    color: tokens.color.fgMuted,
    marginBottom: 32,
  },
  input: {
    padding: 14,
    borderWidth: 1,
    borderColor: tokens.color.border,
    borderRadius: 10,
    backgroundColor: tokens.color.surface,
    fontFamily: tokens.font.sansRegular,
    fontSize: 16,
  },
  helper: {
    fontFamily: tokens.font.sansRegular,
    fontSize: 13,
    color: tokens.color.fgMuted,
    marginTop: 16,
    lineHeight: 18,
  },
  fallback: {
    marginTop: 24,
    alignItems: "center",
  },
  fallbackText: {
    fontFamily: tokens.font.sansMedium,
    fontSize: 13,
    color: tokens.color.fgMuted,
    textDecorationLine: "underline",
  },
});
