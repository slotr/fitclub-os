import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';
import { CalendarIcon, CheckCircleIcon, ShareIcon } from '../../../components/Icons';
import { tokens } from '../../../theme/tokens';
import { classById } from '../../../mocks/classes';

export default function BookingConfirmScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const cls = id ? classById(id) : undefined;

  return (
    <View style={styles.root}>
      {/* Dim layer that doubles as the press-to-dismiss target */}
      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={() => router.dismissAll()}
        accessibilityLabel="Dismiss"
      >
        <BlurView intensity={28} tint="light" style={StyleSheet.absoluteFill} />
        <View style={styles.dim} />
      </Pressable>

      <View style={styles.sheet}>
        <View style={styles.grabber} />
        <View style={styles.checkWrap}>
          <View style={styles.checkBg}>
            <CheckCircleIcon size={64} color={tokens.color.good} />
          </View>
        </View>
        <Text style={styles.title}>Booking confirmed!</Text>
        <Text style={styles.body}>
          {cls ? `${cls.name} with ${cls.instructor}` : 'Your class is booked'}
          {'\n'}
          {cls ? `${cls.date} at ${cls.startsAt} · ${cls.studio}` : ''}
        </Text>
        <Text style={styles.policy}>Cancel up to 1 hour before for free.</Text>

        <View style={styles.actionsRow}>
          <Pressable style={styles.calLink}>
            <CalendarIcon size={16} color={tokens.color.fgMuted} />
            <Text style={styles.calLinkLabel}>Add to calendar</Text>
          </Pressable>
          <Pressable style={styles.calLink}>
            <ShareIcon size={16} color={tokens.color.fgMuted} />
            <Text style={styles.calLinkLabel}>Share</Text>
          </Pressable>
        </View>

        <View style={{ flex: 1 }} />

        <Pressable style={styles.done} onPress={() => router.dismissAll()}>
          <Text style={styles.doneLabel}>Done</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  dim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10,10,10,0.45)',
  },
  sheet: {
    backgroundColor: tokens.color.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 22,
    paddingTop: 14,
    paddingBottom: 34,
    minHeight: '60%',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 40,
    shadowOffset: { width: 0, height: -10 },
  },
  grabber: {
    width: 36,
    height: 4,
    backgroundColor: tokens.color.border,
    borderRadius: 999,
    alignSelf: 'center',
    marginBottom: 18,
  },
  checkWrap: {
    alignItems: 'center',
    marginBottom: 14,
  },
  checkBg: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: tokens.color.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: tokens.font.sansExtrabold,
    fontSize: 22,
    color: tokens.color.fg,
    textAlign: 'center',
    letterSpacing: -0.4,
    marginBottom: 8,
  },
  body: {
    fontFamily: tokens.font.sansRegular,
    fontSize: 14,
    color: tokens.color.fgMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  policy: {
    fontFamily: tokens.font.sansRegular,
    fontSize: 12,
    color: tokens.color.fgFaint,
    textAlign: 'center',
    marginTop: 6,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 18,
  },
  calLink: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    backgroundColor: tokens.color.surface,
    borderWidth: 1,
    borderColor: tokens.color.border,
    borderRadius: 12,
  },
  calLinkLabel: {
    fontFamily: tokens.font.sansSemibold,
    fontSize: 13,
    color: tokens.color.fg,
  },
  done: {
    height: 50,
    borderRadius: 14,
    backgroundColor: tokens.color.fg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
  },
  doneLabel: {
    fontFamily: tokens.font.sansBold,
    fontSize: 15,
    color: tokens.color.surface,
  },
});
