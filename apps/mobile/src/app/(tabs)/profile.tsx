import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '../../components/ScreenContainer';
import {
  ChatIcon,
  ChevronRightIcon,
  DocIcon,
  HelpIcon,
  LockIcon,
} from '../../components/Icons';
import { tokens } from '../../theme/tokens';
import { useAuth } from '../../lib/store';

type Toggles = {
  push: boolean;
  email: boolean;
  whatsapp: boolean;
  marketing: boolean;
};

export default function ProfileTabScreen() {
  const router = useRouter();
  const { member, signOut } = useAuth();
  const [t, setT] = useState<Toggles>({
    push: true,
    email: true,
    whatsapp: true,
    marketing: false,
  });
  const flip = (k: keyof Toggles) => setT((p) => ({ ...p, [k]: !p[k] }));

  return (
    <ScreenContainer padding={20}>
      <Text style={styles.h1}>Profile</Text>

      <Text style={styles.sectionLabel}>Profile</Text>
      <View style={styles.group}>
        <View style={[styles.row, styles.rowProfile]}>
          <LinearGradient
            colors={['#fef3c7', '#f59e0b']}
            style={styles.avatar}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.avatarText}>{member?.initials ?? 'HK'}</Text>
          </LinearGradient>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{member ? `${member.firstName} ${member.lastName}` : 'Hakan Karaca'}</Text>
            <Text style={styles.email}>{member?.email ?? 'hakan@example.com'}</Text>
          </View>
          <ChevronRightIcon size={16} color={tokens.color.fgFaint} />
        </View>
      </View>

      <Text style={styles.sectionLabel}>Notifications</Text>
      <View style={styles.group}>
        <SwitchRow label="Push" on={t.push} onPress={() => flip('push')} />
        <SwitchRow label="Email" on={t.email} onPress={() => flip('email')} />
        <SwitchRow
          label="WhatsApp"
          sub={`Connected as ${member?.phoneMasked ?? '+90 555 ••• 11 22'}`}
          on={t.whatsapp}
          onPress={() => flip('whatsapp')}
        />
        <View style={styles.row}>
          <Text style={[styles.rowLabel, { flex: 1 }]}>Telegram</Text>
          <Pressable style={styles.connectBtn}>
            <Text style={styles.connectBtnLabel}>Connect</Text>
          </Pressable>
        </View>
        <SwitchRow
          label="Marketing"
          sub="Tips, offers, gym news"
          on={t.marketing}
          onPress={() => flip('marketing')}
        />
        <View style={[styles.row, styles.rowLast]}>
          <Text style={[styles.rowLabel, { flex: 1 }]}>Quiet hours</Text>
          <Text style={[styles.value, { fontFamily: tokens.font.mono }]}>22:00 – 08:00</Text>
          <ChevronRightIcon size={16} color={tokens.color.fgFaint} />
        </View>
      </View>
      <Text style={styles.kvkk}>
        Marketing messages are opt-in under KVKK / GDPR. We never share your number with third parties.
      </Text>

      <Text style={styles.sectionLabel}>Membership</Text>
      <View style={styles.group}>
        <Pressable style={[styles.row, styles.rowLast]} onPress={() => router.push('/(tabs)/membership')}>
          <Text style={[styles.rowLabel, { flex: 1 }]}>Manage membership</Text>
          <Text style={styles.value}>
            {member?.plan ?? 'Premium'} · ₺{member?.planPriceTry ?? 899}/mo
          </Text>
          <ChevronRightIcon size={16} color={tokens.color.fgFaint} />
        </Pressable>
      </View>

      <Text style={styles.sectionLabel}>Support</Text>
      <View style={styles.group}>
        <IconRow icon={<ChatIcon size={20} color={tokens.color.good} />} label="Contact the gym" />
        <IconRow icon={<HelpIcon size={20} color={tokens.color.fgMuted} />} label="Help & FAQ" />
        <IconRow icon={<DocIcon size={20} color={tokens.color.fgMuted} />} label="Terms" />
        <IconRow icon={<LockIcon size={20} color={tokens.color.fgMuted} />} label="Privacy" last />
      </View>

      <Text style={styles.sectionLabel}>Account</Text>
      <View style={[styles.group, { marginBottom: 18 }]}>
        <Pressable
          style={styles.row}
          onPress={() => {
            signOut();
            router.replace('/');
          }}
        >
          <Text style={[styles.rowLabel, { flex: 1 }]}>Sign out</Text>
          <ChevronRightIcon size={16} color={tokens.color.fgFaint} />
        </Pressable>
        <Pressable style={[styles.row, styles.rowLast]}>
          <Text style={[styles.rowLabel, { flex: 1, color: tokens.color.bad }]}>Delete account</Text>
          <ChevronRightIcon size={16} color={tokens.color.fgFaint} />
        </Pressable>
      </View>
    </ScreenContainer>
  );
}

function SwitchRow({
  label,
  sub,
  on,
  onPress,
}: {
  label: string;
  sub?: string;
  on: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.row} onPress={onPress}>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowLabel}>{label}</Text>
        {sub ? <Text style={styles.rowSub}>{sub}</Text> : null}
      </View>
      <View style={[styles.switch, on && styles.switchOn]}>
        <View style={[styles.thumb, on && styles.thumbOn]} />
      </View>
    </Pressable>
  );
}

function IconRow({ icon, label, last }: { icon: React.ReactNode; label: string; last?: boolean }) {
  return (
    <Pressable style={[styles.row, last && styles.rowLast]}>
      <View style={styles.iconWrap}>{icon}</View>
      <Text style={[styles.rowLabel, { flex: 1 }]}>{label}</Text>
      <ChevronRightIcon size={16} color={tokens.color.fgFaint} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  h1: {
    fontFamily: tokens.font.sansExtrabold,
    fontSize: 22,
    color: tokens.color.fg,
    letterSpacing: -0.5,
    marginTop: 4,
    marginBottom: 14,
  },
  sectionLabel: {
    fontFamily: tokens.font.sansSemibold,
    fontSize: 11,
    color: tokens.color.fgMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    marginTop: 14,
    marginBottom: 6,
    marginLeft: 4,
  },
  group: {
    backgroundColor: tokens.color.surface,
    borderRadius: 14,
    overflow: 'hidden',
    ...tokens.shadow.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 52,
    borderBottomWidth: 1,
    borderBottomColor: tokens.color.borderFaint,
  },
  rowLast: { borderBottomWidth: 0 },
  rowProfile: {
    paddingVertical: 14,
    paddingLeft: 14,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: tokens.font.sansBold,
    fontSize: 16,
    color: tokens.color.accentFg,
    letterSpacing: -0.4,
  },
  name: {
    fontFamily: tokens.font.sansBold,
    fontSize: 15,
    color: tokens.color.fg,
  },
  email: {
    fontFamily: tokens.font.sansRegular,
    fontSize: 12,
    color: tokens.color.fgMuted,
    marginTop: 1,
  },
  rowLabel: {
    fontFamily: tokens.font.sansMedium,
    fontSize: 14,
    color: tokens.color.fg,
  },
  rowSub: {
    fontFamily: tokens.font.sansRegular,
    fontSize: 11,
    color: tokens.color.fgMuted,
    marginTop: 1,
  },
  value: {
    fontFamily: tokens.font.sansMedium,
    fontSize: 13,
    color: tokens.color.fgMuted,
    marginRight: 4,
  },
  iconWrap: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },

  switch: {
    width: 44,
    height: 26,
    borderRadius: 999,
    backgroundColor: tokens.color.border,
    padding: 2,
  },
  switchOn: { backgroundColor: tokens.color.good },
  thumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 1,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  thumbOn: { transform: [{ translateX: 18 }] },

  connectBtn: {
    height: 30,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: tokens.color.fg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  connectBtnLabel: {
    fontFamily: tokens.font.sansSemibold,
    fontSize: 12,
    color: tokens.color.surface,
  },

  kvkk: {
    fontFamily: tokens.font.sansRegular,
    fontSize: 10,
    color: tokens.color.fgFaint,
    paddingHorizontal: 14,
    paddingTop: 6,
    paddingBottom: 12,
    backgroundColor: tokens.color.surface,
    borderTopWidth: 1,
    borderTopColor: tokens.color.borderFaint,
    lineHeight: 14,
    marginTop: -6,
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
  },
});
