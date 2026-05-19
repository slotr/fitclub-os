import { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '../../components/ScreenContainer';
import { QrRingCard } from '../../components/QrRingCard';
import { tokens } from '../../theme/tokens';
import { useAuth } from '../../lib/store';
import { recentActivity } from '../../mocks/activity';

export default function HomeScreen() {
  const router = useRouter();
  const { member } = useAuth();
  const { width } = useWindowDimensions();
  const cardWidth = width - 40; // 20 padding each side

  return (
    <ScreenContainer padding={20} contentStyle={{ paddingTop: 8 }}>
      {/* Greeting */}
      <View style={styles.greeting}>
        <Text style={styles.h1}>Hi {member?.firstName ?? 'there'}</Text>
        <View style={styles.statusRow}>
          <PulsingDot />
          <Text style={styles.statusText}>
            Active membership · {member?.daysLeft ?? 23} days left
          </Text>
        </View>
      </View>

      {/* QR card */}
      <Pressable
        onPress={() => router.push('/qr')}
        accessibilityLabel="Open full-screen check-in QR"
      >
        <QrRingCard width={cardWidth} />
      </Pressable>

      {/* Stats */}
      <View style={styles.stats}>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>This week</Text>
          <Text style={styles.statValue}>{member?.visitsThisWeek ?? 4} visits</Text>
          <Text style={styles.statSub}>↑ 1 vs last week</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Next class</Text>
          <Text style={[styles.statValue, styles.statValueSmall]}>Yoga · 18:00</Text>
          <Text style={styles.statSub}>in 3 hours</Text>
        </View>
      </View>

      {/* Activity */}
      <View style={styles.activity}>
        <Text style={styles.activityTitle}>Recent activity</Text>
        {recentActivity.map((entry, idx) => (
          <View
            key={entry.id}
            style={[styles.activityRow, idx === recentActivity.length - 1 && { borderBottomWidth: 0 }]}
          >
            <View
              style={[
                styles.dot,
                {
                  backgroundColor:
                    entry.kind === 'good'
                      ? tokens.color.good
                      : entry.kind === 'info'
                        ? tokens.color.info
                        : tokens.color.warn,
                },
              ]}
            />
            <Text style={styles.activityWhen}>{entry.when}</Text>
            <Text style={styles.activityWhat}>{entry.what}</Text>
          </View>
        ))}
      </View>
    </ScreenContainer>
  );
}

function PulsingDot() {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(scale, {
            toValue: 2.5,
            duration: 1400,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 1,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(opacity, {
            toValue: 0,
            duration: 1400,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0.6,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity, scale]);

  return (
    <View style={pulseStyles.wrap}>
      <View style={pulseStyles.core} />
      <Animated.View style={[pulseStyles.halo, { opacity, transform: [{ scale }] }]} />
    </View>
  );
}

const pulseStyles = StyleSheet.create({
  wrap: { width: 7, height: 7, alignItems: 'center', justifyContent: 'center' },
  core: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: tokens.color.good,
  },
  halo: {
    position: 'absolute',
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: tokens.color.good,
  },
});

const styles = StyleSheet.create({
  greeting: { marginBottom: 18 },
  h1: {
    fontFamily: tokens.font.sansExtrabold,
    fontSize: 26,
    color: tokens.color.fg,
    letterSpacing: -0.5,
  },
  statusRow: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusText: {
    fontFamily: tokens.font.sansMedium,
    fontSize: 12,
    color: tokens.color.fgMuted,
  },

  stats: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
    marginBottom: 14,
  },
  stat: {
    flex: 1,
    backgroundColor: tokens.color.surface,
    borderRadius: 16,
    padding: 14,
    ...tokens.shadow.sm,
  },
  statLabel: {
    fontFamily: tokens.font.sansSemibold,
    fontSize: 10,
    color: tokens.color.fgMuted,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  statValue: {
    fontFamily: tokens.font.sansExtrabold,
    fontSize: 22,
    color: tokens.color.fg,
    letterSpacing: -0.4,
    lineHeight: 26,
  },
  statValueSmall: {
    fontFamily: tokens.font.sansBold,
    fontSize: 14,
  },
  statSub: {
    fontFamily: tokens.font.sansMedium,
    fontSize: 11,
    color: tokens.color.fgMuted,
    marginTop: 2,
  },

  activity: {
    backgroundColor: tokens.color.surface,
    borderRadius: 16,
    padding: 14,
    paddingHorizontal: 16,
    ...tokens.shadow.sm,
  },
  activityTitle: {
    fontFamily: tokens.font.sansBold,
    fontSize: 12,
    color: tokens.color.fg,
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f4f1',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  activityWhen: {
    fontFamily: tokens.font.sansMedium,
    fontSize: 12,
    color: tokens.color.fgMuted,
    minWidth: 64,
  },
  activityWhat: {
    flex: 1,
    fontFamily: tokens.font.sansMedium,
    fontSize: 12,
    color: tokens.color.fg,
  },
});
