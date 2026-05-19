/**
 * Auth + profile store. Live data flows in via Supabase REST when
 * `EXPO_PUBLIC_SUPABASE_URL` is configured; otherwise the store is purely
 * in-memory and only drives navigation state.
 */

import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import * as SecureStore from 'expo-secure-store';
import { member as defaultMember, type Member } from '../mocks/member';
import { getSupabase } from './supabase';
import {
  fetchMemberByEmail,
  fetchMemberByPhone,
  fetchMemberByUsername,
  fetchStudioCurrency,
  upsertMemberProfile,
  type LiveMember,
} from './api';

const PHONE_KEY = 'fc.member.phone';
const DBID_KEY = 'fc.member.db_id';

export type AuthState = {
  isAuthed: boolean;
  phone: string | null;
  member: (Member & { dbId: string | null }) | null;
  currency: string;
};

export type AuthActions = {
  setPhone: (phone: string) => void;
  hydrateFromPhone: (phone: string) => Promise<void>;
  hydrateFromEmail: (email: string) => Promise<boolean>;
  hydrateFromUsername: (username: string) => Promise<boolean>;
  completeOnboarding: (
    overrides?: Partial<Member>,
  ) => Promise<void>;
  updatePlan: (plan: Member['plan'], priceTry: number) => void;
  setMembershipState: (state: Member['membershipState']) => void;
  updateCard: (brand: string, last4: string) => void;
  setPhoto: (uri: string | null) => void;
  signOut: () => void;
};

type Ctx = AuthState & AuthActions;

const AuthContext = createContext<Ctx | null>(null);

function ensureMember(
  prev: AuthState['member'],
  patch: Partial<Member>,
): AuthState['member'] {
  const base: AuthState['member'] = prev ?? { ...defaultMember, dbId: null };
  return { ...base, ...patch };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [phone, setPhoneState] = useState<string | null>(null);
  const [authedMember, setAuthedMember] = useState<AuthState['member']>(null);
  const [isAuthed, setIsAuthed] = useState<boolean>(false);
  const [currency, setCurrency] = useState<string>('TRY');

  // Pull the studio currency once on mount so every screen renders the same denom.
  useEffect(() => {
    let active = true;
    fetchStudioCurrency().then((c) => {
      if (active) setCurrency(c);
    });
    return () => {
      active = false;
    };
  }, []);

  const hydrateFromPhone = useCallback(async (next: string) => {
    setPhoneState(next);
    await SecureStore.setItemAsync(PHONE_KEY, next).catch(() => undefined);
    let live: LiveMember | null = await fetchMemberByPhone(next);
    if (!live) {
      const supabase = getSupabase();
      if (supabase && process.env.EXPO_PUBLIC_TENANT_ID) {
        // First-time member: create a row so the admin sees them.
        const { data, error } = await supabase
          .from('members')
          .insert({
            tenant_id: process.env.EXPO_PUBLIC_TENANT_ID,
            phone: next.replace(/[^\d+]/g, ''),
            email: `${next.replace(/[^\d]/g, '')}@phone.fitclub.local`,
            full_name: 'New Member',
            status: 'pending',
          })
          .select('*')
          .maybeSingle();
        if (!error && data) {
          live = await fetchMemberByPhone(next);
        }
      }
    }
    if (live) {
      setAuthedMember(live);
      await SecureStore.setItemAsync(DBID_KEY, live.dbId ?? '').catch(
        () => undefined,
      );
    } else {
      setAuthedMember({ ...defaultMember, dbId: null });
    }
    setIsAuthed(true);
  }, []);

  const hydrateLive = useCallback(
    async (live: LiveMember | null, fallbackPhone: string | null) => {
      if (live) {
        setAuthedMember(live);
        if (fallbackPhone) {
          setPhoneState(fallbackPhone);
          await SecureStore.setItemAsync(PHONE_KEY, fallbackPhone).catch(
            () => undefined,
          );
        } else if (live.phoneMasked) {
          setPhoneState(live.phoneMasked);
        }
        await SecureStore.setItemAsync(DBID_KEY, live.dbId ?? '').catch(
          () => undefined,
        );
        setIsAuthed(true);
        return true;
      }
      return false;
    },
    [],
  );

  const hydrateFromEmail = useCallback(
    async (email: string): Promise<boolean> => {
      const live = await fetchMemberByEmail(email);
      return hydrateLive(live, null);
    },
    [hydrateLive],
  );

  const hydrateFromUsername = useCallback(
    async (username: string): Promise<boolean> => {
      const live = await fetchMemberByUsername(username);
      return hydrateLive(live, null);
    },
    [hydrateLive],
  );

  // Warm restart: re-hydrate from secure storage so reload doesn't
  // bounce the user back to OTP.
  useEffect(() => {
    let active = true;
    (async () => {
      const stored = await SecureStore.getItemAsync(PHONE_KEY).catch(
        () => null,
      );
      if (!active || !stored) return;
      await hydrateFromPhone(stored);
    })();
    return () => {
      active = false;
    };
  }, [hydrateFromPhone]);

  // Mirror Supabase auth session for OTP-only flows.
  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) return;
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      if (data.session?.user.phone) {
        setIsAuthed(true);
        setPhoneState(data.session.user.phone);
      }
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
      if (!active) return;
      setIsAuthed(Boolean(session));
      if (session?.user.phone) setPhoneState(session.user.phone);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      isAuthed,
      phone,
      member: authedMember,
      currency,
      setPhone: (next: string) => setPhoneState(next),
      hydrateFromPhone,
      hydrateFromEmail,
      hydrateFromUsername,
      completeOnboarding: async (overrides?: Partial<Member>) => {
        setAuthedMember((prev) => ensureMember(prev, overrides ?? {}));
        setIsAuthed(true);
        if (overrides && authedMember?.dbId) {
          await upsertMemberProfile(authedMember.dbId, {
            firstName: overrides.firstName ?? authedMember.firstName,
            lastName: overrides.lastName ?? authedMember.lastName,
            email: overrides.email ?? authedMember.email,
          }).catch(() => undefined);
        }
      },
      updatePlan: (plan, priceTry) =>
        setAuthedMember((prev) =>
          prev ? { ...prev, plan, planPriceTry: priceTry } : prev,
        ),
      setMembershipState: (state) =>
        setAuthedMember((prev) =>
          prev ? { ...prev, membershipState: state } : prev,
        ),
      updateCard: (brand, last4) =>
        setAuthedMember((prev) =>
          prev ? { ...prev, cardBrand: brand, cardLast4: last4 } : prev,
        ),
      setPhoto: (uri) =>
        setAuthedMember((prev) => (prev ? { ...prev, photoUri: uri } : prev)),
      signOut: () => {
        const supabase = getSupabase();
        if (supabase) void supabase.auth.signOut();
        SecureStore.deleteItemAsync(PHONE_KEY).catch(() => undefined);
        SecureStore.deleteItemAsync(DBID_KEY).catch(() => undefined);
        setIsAuthed(false);
        setPhoneState(null);
        setAuthedMember(null);
      },
    }),
    [isAuthed, phone, authedMember, currency, hydrateFromPhone],
  );

  return createElement(AuthContext.Provider, { value }, children);
}

export function useAuth(): Ctx {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside <AuthProvider>');
  }
  return ctx;
}
