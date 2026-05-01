import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BackIcon, HeartIcon, MapPinIcon } from '../../../components/Icons';
import { Pill } from '../../../components/Pill';
import { tokens } from '../../../theme/tokens';
import { classById, type ClassCategory } from '../../../mocks/classes';

const CAT_BG: Record<ClassCategory, string> = {
  yoga: tokens.color.cat.yoga,
  cross: tokens.color.cat.cross,
  pilates: tokens.color.cat.pilates,
  strength: tokens.color.cat.strength,
  cardio: tokens.color.cat.cardio,
  pt: tokens.color.cat.pt,
};
const CAT_FG: Record<ClassCategory, string> = {
  yoga: tokens.color.cat.yogaFg,
  cross: tokens.color.cat.crossFg,
  pilates: tokens.color.cat.pilatesFg,
  strength: tokens.color.cat.strengthFg,
  cardio: tokens.color.cat.cardioFg,
  pt: tokens.color.cat.ptFg,
};

const TOTAL_DOTS = 12;

export default function ClassDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const cls = id ? classById(id) : undefined;

  if (!cls) {
    return (
      <SafeAreaView style={styles.notFound}>
        <Text style={styles.notFoundText}>Class not found.</Text>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Text style={styles.backLink}>Go back</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const heroBg = CAT_BG[cls.category];
  const heroFg = CAT_FG[cls.category];
  const ratio = Math.min(cls.booked / cls.capacity, 1);
  const filledDots = Math.round(ratio * TOTAL_DOTS);
  const spotsLeft = Math.max(cls.capacity - cls.booked, 0);
  const isFull = cls.status !== 'open';

  return (
    <SafeAreaView style={styles.root} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={[styles.hero, { backgroundColor: heroBg }]}>
          <View style={[styles.heroBlobA]} />
          <View style={[styles.heroBlobB]} />
          <Text style={[styles.heroLetter, { color: heroFg, opacity: 0.55 }]}>{cls.badge}</Text>

          <Pressable style={styles.heroBack} onPress={() => router.back()}>
            <BackIcon size={18} color={tokens.color.fg} />
          </Pressable>
          <Pressable style={styles.heroHeart}>
            <HeartIcon size={18} color={tokens.color.fg} />
          </Pressable>
        </View>

        <View style={styles.body}>
          <Text style={styles.title}>{cls.name}</Text>
          <Text style={styles.subtitle}>
            {cls.date} · {cls.startsAt} · {cls.durationMin} min
          </Text>

          <View style={styles.instructor}>
            <View style={styles.insAvatar}>
              <Text style={styles.insAvatarText}>{cls.instructorInitials}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.insLabel}>Instructor</Text>
              <Text style={styles.insName}>{cls.instructor}</Text>
            </View>
            <Text style={styles.insLink}>View profile →</Text>
          </View>

          <Text style={styles.desc}>{cls.description}</Text>

          <View style={styles.capacity}>
            <View style={styles.capRow}>
              <Text style={styles.capLeft}>Capacity</Text>
              <Text style={styles.capRight}>
                {cls.booked} / {cls.capacity} booked · {spotsLeft} spots left
              </Text>
            </View>

            <View style={styles.dotsRow}>
              {Array.from({ length: TOTAL_DOTS }).map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.capDot,
                    {
                      backgroundColor:
                        i < filledDots ? tokens.color.accent : tokens.color.borderFaint,
                    },
                  ]}
                />
              ))}
            </View>
          </View>

          <View style={styles.chipsRow}>
            <View style={styles.chip}>
              <MapPinIcon size={12} color={tokens.color.fgMuted} />
              <Text style={styles.chipLabel}>{cls.studio}</Text>
            </View>
            <Pill label="Free with your plan" tone="good" />
          </View>
        </View>
      </ScrollView>

      <View style={styles.ctaBar}>
        <Pressable
          style={styles.cta}
          onPress={() => router.push(`/class/${cls.id}/confirm`)}
        >
          <Text style={styles.ctaLabel}>
            {isFull ? 'Join waitlist' : 'Book this class'}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: tokens.color.bg },
  scroll: { paddingBottom: 16 },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, backgroundColor: tokens.color.bg },
  notFoundText: { fontFamily: tokens.font.sansSemibold, fontSize: 14, color: tokens.color.fg },
  backLink: { fontFamily: tokens.font.sansSemibold, color: tokens.color.accent },

  hero: {
    height: 220,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  heroBlobA: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    top: -80,
    right: -60,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  heroBlobB: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    bottom: -40,
    left: -30,
    backgroundColor: 'rgba(245,158,11,0.15)',
  },
  heroLetter: {
    fontFamily: tokens.font.sansExtrabold,
    fontSize: 140,
    letterSpacing: -6,
    lineHeight: 150,
  },
  heroBack: {
    position: 'absolute',
    top: 14,
    left: 14,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroHeart: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  body: { padding: 20, paddingTop: 18 },
  title: {
    fontFamily: tokens.font.sansExtrabold,
    fontSize: 24,
    color: tokens.color.fg,
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: tokens.font.sansMedium,
    fontSize: 13,
    color: tokens.color.fgMuted,
    marginBottom: 16,
  },

  instructor: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: tokens.color.surface,
    borderRadius: 14,
    padding: 12,
    ...tokens.shadow.sm,
    marginBottom: 16,
  },
  insAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: tokens.color.cat.pt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  insAvatarText: {
    fontFamily: tokens.font.sansBold,
    fontSize: 14,
    color: tokens.color.accentFg,
  },
  insLabel: {
    fontFamily: tokens.font.sansSemibold,
    fontSize: 10,
    color: tokens.color.fgMuted,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  insName: {
    fontFamily: tokens.font.sansBold,
    fontSize: 14,
    color: tokens.color.fg,
  },
  insLink: {
    fontFamily: tokens.font.sansSemibold,
    fontSize: 12,
    color: tokens.color.accent,
  },

  desc: {
    fontFamily: tokens.font.sansRegular,
    fontSize: 13,
    color: tokens.color.fgMuted,
    lineHeight: 20,
    marginBottom: 16,
  },

  capacity: {
    backgroundColor: tokens.color.surface,
    borderRadius: 14,
    padding: 14,
    ...tokens.shadow.sm,
    marginBottom: 14,
  },
  capRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  capLeft: {
    fontFamily: tokens.font.sansSemibold,
    fontSize: 12,
    color: tokens.color.fg,
  },
  capRight: {
    fontFamily: tokens.font.mono,
    fontSize: 12,
    color: tokens.color.fgMuted,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 4,
  },
  capDot: {
    flex: 1,
    height: 10,
    borderRadius: 3,
  },

  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 18,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: tokens.color.surface,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: tokens.color.border,
  },
  chipLabel: {
    fontFamily: tokens.font.sansSemibold,
    fontSize: 11,
    color: tokens.color.fgMuted,
  },

  ctaBar: {
    borderTopWidth: 1,
    borderTopColor: tokens.color.border,
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 24,
  },
  cta: {
    height: 50,
    borderRadius: 14,
    backgroundColor: tokens.color.fg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaLabel: {
    fontFamily: tokens.font.sansBold,
    fontSize: 15,
    color: tokens.color.surface,
  },
});
