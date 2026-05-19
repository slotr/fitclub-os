import { useState } from 'react';
import { Alert, Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { ScreenContainer } from '../../components/ScreenContainer';
import { BackButtonRow } from '../../components/BackButton';
import { CalendarIcon, PlusIcon } from '../../components/Icons';
import { PrimaryButton } from '../../components/PrimaryButton';
import { tokens } from '../../theme/tokens';
import { useAuth } from '../../lib/store';

const GENDERS = ['Male', 'Female', 'Other', 'Prefer not'] as const;

export default function ProfileSetupScreen() {
  const router = useRouter();
  const { member, completeOnboarding, setPhoto } = useAuth();
  const [name, setName] = useState('Hakan Karaca');
  const [birthdate, setBirthdate] = useState('14.05.1992');
  const [email, setEmail] = useState('');
  const [gender, setGender] = useState<(typeof GENDERS)[number]>('Female');
  const [localPhoto, setLocalPhoto] = useState<string | null>(member?.photoUri ?? null);

  const pickPhoto = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission needed', 'Allow photo library access in Settings to add a profile photo.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      setLocalPhoto(result.assets[0].uri);
      setPhoto(result.assets[0].uri);
    }
  };

  return (
    <ScreenContainer>
      <BackButtonRow />

      <Text style={styles.h1}>Tell us about you.</Text>
      <Text style={styles.sub}>Takes 30 seconds.</Text>

      <View style={styles.field}>
        <Text style={styles.label}>Full name</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          style={styles.input}
          placeholder="Your name"
          placeholderTextColor={tokens.color.fgFaint}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Birthdate</Text>
        <View style={[styles.input, styles.inputRow]}>
          <TextInput
            value={birthdate}
            onChangeText={setBirthdate}
            style={[styles.inlineInput, { fontFamily: tokens.font.mono }]}
            placeholder="DD.MM.YYYY"
            placeholderTextColor={tokens.color.fgFaint}
            keyboardType="numbers-and-punctuation"
          />
          <CalendarIcon size={18} color={tokens.color.fgFaint} />
        </View>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>
          Email{' '}
          <Text style={styles.optional}>(optional)</Text>
        </Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          style={styles.input}
          placeholder="hakan@example.com"
          placeholderTextColor={tokens.color.fgFaint}
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Gender</Text>
        <View style={styles.seg}>
          {GENDERS.map((g) => {
            const active = gender === g;
            return (
              <Pressable
                key={g}
                style={[styles.segItem, active && styles.segItemActive]}
                onPress={() => setGender(g)}
              >
                <Text
                  style={[styles.segLabel, active && styles.segLabelActive]}
                >
                  {g}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>
          Photo{' '}
          <Text style={styles.optional}>(optional)</Text>
        </Text>
        <Pressable
          style={styles.photoRow}
          onPress={pickPhoto}
          accessibilityRole="button"
          accessibilityLabel="Add a profile photo"
        >
          <View style={styles.avatar}>
            {localPhoto ? (
              <Image source={{ uri: localPhoto }} style={styles.avatarImg} />
            ) : (
              <PlusIcon size={22} color={tokens.color.fgFaint} />
            )}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.photoTitle}>
              {localPhoto ? 'Change photo' : 'Add a photo'}
            </Text>
            <Text style={styles.photoBody}>
              Helps the front desk recognise you.
            </Text>
          </View>
        </Pressable>
      </View>

      <View style={{ height: 8 }} />
      <PrimaryButton
        label="Continue"
        onPress={() => {
          const [first, ...rest] = name.trim().split(' ');
          completeOnboarding({
            firstName: first || 'Hakan',
            lastName: rest.join(' ') || 'Karaca',
          });
          router.push('/plan-picker');
        }}
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
    marginBottom: 6,
  },
  sub: {
    fontFamily: tokens.font.sansRegular,
    fontSize: 13,
    color: tokens.color.fgMuted,
    marginBottom: 18,
  },
  field: { marginBottom: 12 },
  label: {
    fontFamily: tokens.font.sansSemibold,
    fontSize: 11,
    color: tokens.color.fgMuted,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  optional: {
    fontFamily: tokens.font.sansMedium,
    color: tokens.color.fgFaint,
    letterSpacing: 0,
    textTransform: 'none',
  },
  input: {
    height: 44,
    backgroundColor: tokens.color.surface,
    borderWidth: 1,
    borderColor: tokens.color.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    fontFamily: tokens.font.sansMedium,
    fontSize: 14,
    color: tokens.color.fg,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 12,
  },
  inlineInput: {
    flex: 1,
    height: '100%',
    color: tokens.color.fg,
    fontSize: 14,
  },
  seg: {
    flexDirection: 'row',
    backgroundColor: tokens.color.borderFaint,
    borderRadius: 10,
    padding: 3,
    gap: 4,
  },
  segItem: {
    flex: 1,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  segItemActive: {
    backgroundColor: tokens.color.surface,
    ...tokens.shadow.sm,
  },
  segLabel: {
    fontFamily: tokens.font.sansSemibold,
    fontSize: 11,
    color: tokens.color.fgMuted,
  },
  segLabelActive: {
    color: tokens.color.fg,
  },
  photoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: tokens.color.border,
    backgroundColor: tokens.color.surface,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: {
    width: 64,
    height: 64,
  },
  photoTitle: {
    fontFamily: tokens.font.sansSemibold,
    fontSize: 12,
    color: tokens.color.fg,
  },
  photoBody: {
    fontFamily: tokens.font.sansRegular,
    fontSize: 12,
    color: tokens.color.fgMuted,
    lineHeight: 16,
  },
});
