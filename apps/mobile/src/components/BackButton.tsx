import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import { tokens } from '../theme/tokens';

export function BackButton({
  onPress,
  fallback = '/(tabs)',
}: {
  onPress?: () => void;
  fallback?: string;
}) {
  const router = useRouter();
  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace(fallback as Parameters<typeof router.replace>[0]);
    }
  };
  return (
    <Pressable
      onPress={onPress ?? goBack}
      style={({ pressed }) => [styles.btn, pressed && { opacity: 0.6 }]}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel="Go back"
    >
      <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
        <Path
          d="M15 19l-7-7 7-7"
          stroke={tokens.color.fg}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </Pressable>
  );
}

export function BackButtonRow({ fallback }: { fallback?: string } = {}) {
  return (
    <View style={styles.row}>
      <BackButton fallback={fallback} />
    </View>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: { marginTop: 4, marginBottom: 16 },
});
