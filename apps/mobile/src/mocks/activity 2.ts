export type ActivityKind = 'good' | 'info' | 'warn';

export type ActivityEntry = {
  id: string;
  when: string;
  what: string;
  kind: ActivityKind;
};

export const recentActivity: ActivityEntry[] = [
  { id: 'a1', when: 'Today', what: 'Checked in at 09:12', kind: 'good' },
  { id: 'a2', when: 'Yesterday', what: 'Yoga Flow attended', kind: 'info' },
  { id: 'a3', when: 'Sun', what: 'Payment of ₺899 received', kind: 'good' },
];

export type Notification = {
  id: string;
  title: string;
  body: string;
  when: string;
  kind: ActivityKind;
};

export const notifications: Notification[] = [
  {
    id: 'n1',
    title: 'Booking confirmed',
    body: 'Yoga Flow at 18:00 with Ayşe — Studio A',
    when: '12m ago',
    kind: 'good',
  },
  {
    id: 'n2',
    title: 'Payment received',
    body: '₺899 from Premium plan — receipt sent',
    when: '2h ago',
    kind: 'good',
  },
  {
    id: 'n3',
    title: 'Class reminder',
    body: 'CrossFit WOD starts in 1h — Open floor',
    when: '14m ago',
    kind: 'info',
  },
  {
    id: 'n4',
    title: 'Waitlist update',
    body: 'A spot opened in Spin — tap to confirm',
    when: '3h ago',
    kind: 'warn',
  },
  {
    id: 'n5',
    title: 'Class cancelled',
    body: 'Pilates Reformer 19:30 — instructor sick',
    when: '5h ago',
    kind: 'info',
  },
  {
    id: 'n6',
    title: 'Welcome to FitClub',
    body: 'Your membership is active — enjoy!',
    when: 'Yesterday',
    kind: 'good',
  },
  {
    id: 'n7',
    title: 'Membership renewing soon',
    body: '₺899 will be charged on 15 May',
    when: '2d ago',
    kind: 'warn',
  },
  {
    id: 'n8',
    title: 'New class added',
    body: 'Strength 101 with Mehmet — Tuesdays 20:30',
    when: '3d ago',
    kind: 'info',
  },
];

export type PaymentRow = { id: string; date: string; what: string; amount: number };

export const paymentHistory: PaymentRow[] = [
  { id: 'p1', date: '15 Apr 2026', what: 'Premium · 1 month', amount: 899 },
  { id: 'p2', date: '15 Mar 2026', what: 'Premium · 1 month', amount: 899 },
  { id: 'p3', date: '15 Feb 2026', what: 'Premium · 1 month', amount: 899 },
  { id: 'p4', date: '14 Jan 2026', what: 'Premium · 1 month · joined', amount: 899 },
];
