/**
 * Live data layer for the mobile app. Uses Supabase REST (via the
 * supabase-js client) to read + write the same Postgres rows the admin
 * web app does. When `EXPO_PUBLIC_SUPABASE_URL` is unset (e.g. when
 * running on a fresh dev machine), every function falls back to mock
 * data so the screens still render.
 */

import { getSupabase, isSupabaseConfigured } from './supabase';
import { classes as mockClasses } from '../mocks/classes';
import { paymentHistory as mockPayments } from '../mocks/activity';
import type { Member } from '../mocks/member';

const TENANT_ID = process.env.EXPO_PUBLIC_TENANT_ID ?? '';

// ---------- Members ----------

export type LiveMember = Member & { dbId: string | null };

function lookupSql(phone: string) {
  // Supabase phone auth normalises to E.164; strip everything but digits.
  return phone.replace(/[^\d+]/g, '');
}

export async function fetchMemberByEmail(
  email: string,
): Promise<LiveMember | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('members')
    .select('*')
    .eq('tenant_id', TENANT_ID)
    .ilike('email', email.trim())
    .limit(1)
    .maybeSingle();
  if (error) {
    console.warn('fetchMemberByEmail', error.message);
    return null;
  }
  if (!data) return null;
  return shapeMember(data);
}

export async function fetchMemberByUsername(
  username: string,
): Promise<LiveMember | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  // PostgREST `or` filter is comma/paren-delimited; strip anything that
  // could escape the value into operator land. Keeps the query well-formed
  // even with adversarial input.
  const u = username.trim().replace(/[,()*]/g, '');
  if (!u) return null;
  const { data, error } = await supabase
    .from('members')
    .select('*')
    .eq('tenant_id', TENANT_ID)
    .or(`full_name.ilike.%${u}%,email.ilike.${u}@%`)
    .limit(1)
    .maybeSingle();
  if (error) {
    console.warn('fetchMemberByUsername', error.message);
    return null;
  }
  if (!data) return null;
  return shapeMember(data);
}

export async function fetchMemberByPhone(
  phone: string,
): Promise<LiveMember | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  const normalized = lookupSql(phone);
  const { data, error } = await supabase
    .from('members')
    .select('*')
    .eq('tenant_id', TENANT_ID)
    .or(`phone.eq.${normalized},phone.eq.${normalized.replace('+', '')}`)
    .limit(1)
    .maybeSingle();
  if (error) {
    console.warn('fetchMemberByPhone', error.message);
    return null;
  }
  if (!data) return null;
  return shapeMember(data);
}

export async function upsertMemberProfile(
  memberDbId: string,
  patch: { firstName: string; lastName: string; email: string },
): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;
  const { error } = await supabase
    .from('members')
    .update({
      full_name: `${patch.firstName} ${patch.lastName}`.trim(),
      email: patch.email,
    })
    .eq('id', memberDbId);
  if (error) {
    console.warn('upsertMemberProfile', error.message);
    return false;
  }
  return true;
}

function shapeMember(row: Record<string, unknown>): LiveMember {
  const fullName = String(row.full_name ?? '');
  const [first, ...rest] = fullName.trim().split(/\s+/);
  const last = rest.join(' ') || '';
  const initials =
    (first?.[0] ?? '') + (last[0] ?? '');
  return {
    id: String(row.id ?? ''),
    dbId: String(row.id ?? ''),
    firstName: first ?? '',
    lastName: last,
    email: String(row.email ?? ''),
    phoneMasked: maskPhone(String(row.phone ?? '')),
    initials: initials.toUpperCase() || '??',
    plan: 'Premium',
    planPriceTry: 899,
    daysLeft: 23,
    visitsThisWeek: 0,
    visitsLastWeek: 0,
    nextRenewalDate: '',
    membershipState: 'active',
    cardLast4: null,
    cardBrand: null,
    photoUri: row.photo_url ? String(row.photo_url) : null,
  };
}

function maskPhone(p: string): string {
  if (!p) return '';
  if (p.length < 8) return p;
  return `${p.slice(0, 4)} ${p.slice(4, 7)} ••• ${p.slice(-4)}`;
}

// ---------- Classes / sessions ----------

export type LiveSession = {
  id: string;
  className: string;
  category: string;
  startsAt: string;
  endsAt: string;
  capacity: number;
  booked: number;
  instructor: string | null;
  room: string | null;
};

export async function fetchUpcomingSessions(
  limit = 30,
): Promise<LiveSession[]> {
  const supabase = getSupabase();
  if (!supabase) {
    return mockClasses.map((c, i) => ({
      id: `mock-${i}`,
      className: c.name,
      category: c.category,
      startsAt: c.startsAt,
      endsAt: c.startsAt,
      capacity: c.capacity,
      booked: c.booked,
      instructor: c.instructor,
      room: (c as { studio?: string }).studio ?? null,
    }));
  }
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('sessions')
    .select(
      `
      id, starts_at, ends_at, capacity, room,
      class:classes ( name, category ),
      instructor:instructors ( name ),
      bookings ( id, status )
    `,
    )
    .eq('tenant_id', TENANT_ID)
    .gte('starts_at', now)
    .order('starts_at')
    .limit(limit);
  if (error) {
    console.warn('fetchUpcomingSessions', error.message);
    return [];
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []).map((row: any) => ({
    id: String(row.id),
    className: String(row.class?.name ?? '—'),
    category: String(row.class?.category ?? 'yoga'),
    startsAt: String(row.starts_at),
    endsAt: String(row.ends_at),
    capacity: Number(row.capacity ?? 0),
    booked: Array.isArray(row.bookings)
      ? row.bookings.filter(
          (b: { status: string }) =>
            b.status === 'booked' || b.status === 'attended',
        ).length
      : 0,
    instructor: row.instructor?.name ?? null,
    room: row.room ?? null,
  }));
}

// ---------- Bookings ----------

export async function bookSession(
  sessionId: string,
  memberDbId: string,
): Promise<{ ok: boolean; error?: string }> {
  const supabase = getSupabase();
  if (!supabase) return { ok: true };
  const { error } = await supabase.from('bookings').insert({
    tenant_id: TENANT_ID,
    session_id: sessionId,
    member_id: memberDbId,
    status: 'booked',
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function cancelBooking(
  bookingId: string,
): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return true;
  const { error } = await supabase
    .from('bookings')
    .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
    .eq('id', bookingId);
  return !error;
}

// ---------- Studio settings ----------

export async function fetchStudioCurrency(): Promise<string> {
  const supabase = getSupabase();
  if (!supabase) return 'TRY';
  const { data } = await supabase
    .from('studio_settings')
    .select('currency')
    .eq('tenant_id', TENANT_ID)
    .limit(1)
    .maybeSingle();
  return (data?.currency as string | undefined) ?? 'TRY';
}

// ---------- Plans ----------

export type LivePlan = {
  id: string;
  name: string;
  shortName: 'Basic' | 'Premium' | 'Performance';
  priceMinor: number;
  currency: string;
  durationDays: number;
  features: string[];
  highlight: boolean;
};

function shortenPlan(name: string): LivePlan['shortName'] {
  const lower = name.toLowerCase();
  if (lower.startsWith('performance')) return 'Performance';
  if (lower.startsWith('premium')) return 'Premium';
  return 'Basic';
}

export async function fetchPlans(): Promise<LivePlan[]> {
  const supabase = getSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('plans')
    .select('id, name, price_minor, currency, duration_days, features, active')
    .eq('tenant_id', TENANT_ID)
    .eq('active', true)
    .order('price_minor');
  if (error) {
    console.warn('fetchPlans', error.message);
    return [];
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = (data ?? []) as any[];
  return rows.map((p) => ({
    id: String(p.id),
    name: String(p.name),
    shortName: shortenPlan(String(p.name)),
    priceMinor: Number(p.price_minor),
    currency: String(p.currency ?? 'TRY'),
    durationDays: Number(p.duration_days ?? 30),
    features: Array.isArray(p.features)
      ? (p.features as string[])
      : [],
    highlight: shortenPlan(String(p.name)) === 'Premium',
  }));
}

// ---------- Memberships ----------

export async function activateMembership(
  memberDbId: string,
  planName: 'Basic' | 'Premium' | 'Performance',
): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;
  const { error: memberErr } = await supabase
    .from('members')
    .update({ status: 'active' })
    .eq('id', memberDbId);
  if (memberErr) {
    console.warn('activateMembership.member', memberErr.message);
    return false;
  }
  const { data: plan } = await supabase
    .from('plans')
    .select('id, duration_days')
    .eq('tenant_id', TENANT_ID)
    .ilike('name', `${planName}%`)
    .limit(1)
    .maybeSingle();
  if (!plan) {
    console.warn('activateMembership.plan_not_found', planName);
    return true;
  }
  const durationDays = Number(plan.duration_days ?? 30);
  const now = new Date();
  const ends = new Date(now.getTime() + durationDays * 86400000);
  const { error: msErr } = await supabase.from('memberships').insert({
    member_id: memberDbId,
    plan_id: plan.id,
    status: 'active',
    started_at: now.toISOString(),
    ends_at: ends.toISOString(),
    auto_renew: true,
  });
  if (msErr) console.warn('activateMembership.membership', msErr.message);
  return true;
}

// ---------- Payments ----------

export type LivePayment = {
  id: string;
  amount: number;
  currency: string;
  method: 'card' | 'crypto';
  status: 'paid' | 'failed' | 'refunded' | 'pending';
  createdAt: string;
};

export async function fetchPaymentHistory(
  memberDbId: string,
): Promise<LivePayment[]> {
  const supabase = getSupabase();
  if (!supabase) {
    return mockPayments.map((p) => ({
      id: p.id,
      amount: p.amount,
      currency: 'TRY',
      method: 'card',
      status: 'paid',
      createdAt: new Date().toISOString(),
    }));
  }
  const { data, error } = await supabase
    .from('payments')
    .select('id, amount_minor, currency, method, status, created_at')
    .eq('member_id', memberDbId)
    .order('created_at', { ascending: false })
    .limit(20);
  if (error) {
    console.warn('fetchPaymentHistory', error.message);
    return [];
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []).map((p: any) => ({
    id: String(p.id),
    amount: Number(p.amount_minor) / 100,
    currency: String(p.currency),
    method: p.method as 'card' | 'crypto',
    status: p.status as 'paid' | 'failed' | 'refunded' | 'pending',
    createdAt: String(p.created_at),
  }));
}

export async function recordCryptoIntent(
  memberDbId: string,
  amountMinor: number,
  currency: string,
  chain: 'btc' | 'eth' | 'usdt_trc20' | 'usdc_eth' | 'usdc_base',
): Promise<{ paymentId: string | null }> {
  const supabase = getSupabase();
  if (!supabase) return { paymentId: null };
  const { data, error } = await supabase
    .from('payments')
    .insert({
      member_id: memberDbId,
      amount_minor: amountMinor,
      currency,
      method: 'crypto',
      crypto_chain: chain,
      status: 'pending',
    })
    .select('id')
    .maybeSingle();
  if (error) {
    console.warn('recordCryptoIntent', error.message);
    return { paymentId: null };
  }
  return { paymentId: data ? String(data.id) : null };
}

export const live = {
  configured: isSupabaseConfigured,
  tenantId: TENANT_ID,
};

// ---------- Multi-tenant memberships ----------

import type { Membership } from "@fitness/api";

export async function fetchMyMemberships(): Promise<Membership[]> {
  const supabase = getSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("members")
    .select(`
      id,
      tenant_id,
      tenants!inner(name),
      studio_settings(logo_url, accent_color)
    `)
    .is("deleted_at", null);
  if (error) {
    console.warn("fetchMyMemberships", error.message);
    return [];
  }
  return (data ?? []).map((m: any) => ({
    memberId: String(m.id),
    tenantId: String(m.tenant_id),
    gymName: m.tenants?.name ?? "Unknown gym",
    logoUrl: m.studio_settings?.[0]?.logo_url ?? null,
    accentColor: m.studio_settings?.[0]?.accent_color ?? null,
  }));
}
