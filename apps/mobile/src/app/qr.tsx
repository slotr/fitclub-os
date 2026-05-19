import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CloseIcon } from '../components/Icons';
import { QrRingCard } from '../components/QrRingCard';
import { tokens } from '../theme/tokens';

export default function FullscreenQrScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const cardSize = Math.min(width - 80, 360);

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar style="light" />
      <Pressable
        style={styles.close}
        onPress={() => router.back()}
        accessibilityLabel="Close"
        hitSlop={10}
      >
        <CloseIcon size={20} color="#fff" />
      </Pressable>

      <View style={styles.center}>
        <QrRingCard
          width={cardSize}
          cardBackground={tokens.color.night}
          trackColor="rgba(255,255,255,0.08)"
          progressColor={tokens.color.accent}
          showHeader={false}
          showFooter={false}
          strokeWidth={5}
          qrInset={12}
        />

        <View style={{ marginTop: 32, alignItems: 'center' }}>
          <Text style={styles.title}>Show at the door</Text>
          <Text style={styles.sub}>Refreshes every 30s</Text>
        </View>
      </View>

      <View style={styles.brightness}>
        <Text style={styles.brightnessText}>☀ Brightness max</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: tokens.color.night,
    paddingHorizontal: 40,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  close: {
    position: 'absolute',
    top: 60,
    right: 28,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  title: {
    fontFamily: tokens.font.sansSemibold,
    fontSize: 16,
    color: 'rgba(255,255,255,0.85)',
    marginBottom: 6,
  },
  sub: {
    fontFamily: tokens.font.mono,
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
  },
  brightness: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  brightnessText: {
    fontFamily: tokens.font.sansMedium,
    fontSize: 11,
    color: 'rgba(255,255,255,0.6)',
  },
});
