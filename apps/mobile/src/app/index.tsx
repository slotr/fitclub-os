import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { tokens } from '../theme/tokens';

export default function Splash() {
  const router = useRouter();
  const scale = useRef(new Animated.Value(1)).current;
  const wordmarkOpacity = useRef(new Animated.Value(0)).current;
  const tagOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.spring(scale, {
        toValue: 1.05,
        useNativeDriver: true,
        friction: 5,
        tension: 80,
      }),
      Animated.parallel([
        Animated.timing(wordmarkOpacity, {
          toValue: 1,
          duration: 320,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(tagOpacity, {
          toValue: 1,
          duration: 360,
          delay: 80,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    const t = setTimeout(() => {
      router.replace('/otp-request');
    }, 1400);
    return () => clearTimeout(t);
  }, [router, scale, tagOpacity, wordmarkOpacity]);

  return (
    <View style={styles.root}>
      {/* Soft amber radial vignette behind the mark */}
      <View style={styles.vignette} pointerEvents="none" />
      <View style={styles.center}>
        <Animated.View style={[styles.mark, { transform: [{ scale }] }]}>
          <LinearGradient
            colors={['#fef3c7', '#f59e0b']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.markInnerHighlight} pointerEvents="none" />
          <Text style={styles.markGlyph}>F</Text>
        </Animated.View>
        <Animated.Text style={[styles.brand, { opacity: wordmarkOpacity }]}>
          FitClub
        </Animated.Text>
        <Animated.Text style={[styles.tag, { opacity: tagOpacity }]}>
          Powered by FitClub OS
        </Animated.Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: tokens.color.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vignette: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
  },
  center: { alignItems: 'center', gap: 14 },
  mark: {
    width: 120,
    height: 120,
    borderRadius: 28,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#f59e0b',
    shadowOpacity: 0.25,
    shadowRadius: 40,
    shadowOffset: { width: 0, height: 18 },
    elevation: 12,
  },
  markInnerHighlight: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 28,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.5)',
  },
  markGlyph: {
    fontFamily: tokens.font.sansBlack,
    fontSize: 64,
    color: tokens.color.accentFg,
    letterSpacing: -2,
    lineHeight: 80,
  },
  brand: {
    fontFamily: tokens.font.sansBold,
    fontSize: 24,
    color: tokens.color.fg,
    letterSpacing: -0.4,
    marginTop: 4,
  },
  tag: {
    fontFamily: tokens.font.sansMedium,
    fontSize: 12,
    color: tokens.color.fgMuted,
    letterSpacing: 0.2,
  },
});
