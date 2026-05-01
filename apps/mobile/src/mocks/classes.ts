export type ClassCategory =
  | 'yoga'
  | 'cross'
  | 'pilates'
  | 'strength'
  | 'cardio'
  | 'pt';

export type ClassStatus = 'open' | 'waitlist' | 'full';

export type GymClass = {
  id: string;
  name: string;
  category: ClassCategory;
  /** Letter shown in the icon tile, e.g. "Y", "P". */
  badge: string;
  startsAt: string; // HH:mm 24h, today
  durationMin: number;
  instructor: string;
  instructorInitials: string;
  capacity: number;
  booked: number;
  status: ClassStatus;
  studio: string;
  date: string; // human-friendly: "Friday, 25 Apr"
  description: string;
};

export const classes: GymClass[] = [
  {
    id: 'cls_pilates_1700',
    name: 'Pilates Reformer',
    category: 'pilates',
    badge: 'P',
    startsAt: '17:00',
    durationMin: 55,
    instructor: 'Selin',
    instructorInitials: 'SE',
    capacity: 8,
    booked: 6,
    status: 'open',
    studio: 'Studio B · 2nd floor',
    date: 'Friday, 25 Apr',
    description:
      'Reformer-based class focused on core stability and flexibility. All levels welcome.',
  },
  {
    id: 'cls_yoga_1800',
    name: 'Yoga Flow',
    category: 'yoga',
    badge: 'Y',
    startsAt: '18:00',
    durationMin: 75,
    instructor: 'Ayşe',
    instructorInitials: 'AY',
    capacity: 12,
    booked: 8,
    status: 'open',
    studio: 'Studio A · 2nd floor',
    date: 'Friday, 25 Apr',
    description:
      'Slow-flow vinyasa class focused on breath and alignment. Suitable for all levels — beginners welcome. Bring a mat or rent one at the front desk for ₺20.',
  },
  {
    id: 'cls_cross_1930',
    name: 'CrossFit WOD',
    category: 'cross',
    badge: 'C',
    startsAt: '19:30',
    durationMin: 60,
    instructor: 'Mehmet',
    instructorInitials: 'ME',
    capacity: 12,
    booked: 12,
    status: 'waitlist',
    studio: 'Open floor',
    date: 'Friday, 25 Apr',
    description:
      'High-intensity workout of the day. Scaled options available. Bring water and a towel.',
  },
  {
    id: 'cls_spin_2030',
    name: 'Spin',
    category: 'cardio',
    badge: 'S',
    startsAt: '20:30',
    durationMin: 45,
    instructor: 'Hakan',
    instructorInitials: 'HK',
    capacity: 8,
    booked: 4,
    status: 'open',
    studio: 'Spin studio',
    date: 'Friday, 25 Apr',
    description:
      'Indoor cycling with intervals and climbs. Cleated shoes recommended.',
  },
  {
    id: 'cls_strength_2100',
    name: 'Strength 101',
    category: 'strength',
    badge: 'L',
    startsAt: '21:00',
    durationMin: 60,
    instructor: 'Mehmet',
    instructorInitials: 'ME',
    capacity: 10,
    booked: 3,
    status: 'open',
    studio: 'Weights area',
    date: 'Friday, 25 Apr',
    description:
      'Foundational barbell training: squat, hinge, press. Coaches review every set.',
  },
  {
    id: 'cls_pt_1100',
    name: 'PT — Mobility',
    category: 'pt',
    badge: 'T',
    startsAt: '11:00',
    durationMin: 45,
    instructor: 'Deniz',
    instructorInitials: 'DZ',
    capacity: 1,
    booked: 0,
    status: 'open',
    studio: 'Coaching room',
    date: 'Saturday, 26 Apr',
    description: 'One-on-one mobility and recovery session.',
  },
  {
    id: 'cls_yoga_0900',
    name: 'Morning Yoga',
    category: 'yoga',
    badge: 'Y',
    startsAt: '09:00',
    durationMin: 60,
    instructor: 'Ayşe',
    instructorInitials: 'AY',
    capacity: 14,
    booked: 5,
    status: 'open',
    studio: 'Studio A · 2nd floor',
    date: 'Saturday, 26 Apr',
    description: 'Gentle wake-up flow to start the weekend.',
  },
  {
    id: 'cls_cardio_1000',
    name: 'HIIT Cardio',
    category: 'cardio',
    badge: 'H',
    startsAt: '10:00',
    durationMin: 30,
    instructor: 'Selin',
    instructorInitials: 'SE',
    capacity: 16,
    booked: 11,
    status: 'open',
    studio: 'Open floor',
    date: 'Saturday, 26 Apr',
    description: 'Short, sharp intervals. Bring water.',
  },
];

export function classById(id: string): GymClass | undefined {
  return classes.find((c) => c.id === id);
}
