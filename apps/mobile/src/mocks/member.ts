export type Member = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneMasked: string;
  initials: string;
  plan: 'Basic' | 'Premium' | 'Performance';
  planPriceTry: number;
  daysLeft: number;
  visitsThisWeek: number;
  visitsLastWeek: number;
  nextRenewalDate: string; // ISO
  membershipState: 'active' | 'paused' | 'cancelled';
  cardLast4: string | null;
  cardBrand: string | null;
  photoUri: string | null;
};

export const member: Member = {
  id: 'mem_001',
  firstName: 'Hakan',
  lastName: 'Karaca',
  email: 'hakan@example.com',
  phoneMasked: '+90 555 ••• 11 22',
  initials: 'HK',
  plan: 'Premium',
  planPriceTry: 899,
  daysLeft: 23,
  visitsThisWeek: 4,
  visitsLastWeek: 3,
  nextRenewalDate: '2026-05-15',
  membershipState: 'active',
  cardLast4: '4242',
  cardBrand: 'Visa',
  photoUri: null,
};
