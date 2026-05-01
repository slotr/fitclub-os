/**
 * Lightweight auth/profile store. When Supabase is configured the
 * persisted session is hydrated on mount; otherwise the store is purely
 * in-memory and only drives navigation state.
 */

import {
  createContext,
  createElement,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { member as defaultMember, type Member } from '../mocks/member';
import { getSupabase } from './supabase';

export type AuthState = {
  isAuthed: boolean;
  phone: string | null;
  member: Member | null;
};

export type AuthActions = {
  setPhone: (phone: string) => void;
  completeOnboarding: (overrides?: Partial<Member>) => void;
  signOut: () => void;
};

type Ctx = AuthState & AuthActions;

const AuthContext = createContext<Ctx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [phone, setPhoneState] = useState<string | null>(null);
  const [authedMember, setAuthedMember] = useState<Member | null>(defaultMember);
  const [isAuthed, setIsAuthed] = useState<boolean>(false);

  // Hydrate from a persisted Supabase session if available.
  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) return;
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      if (data.session) {
        setIsAuthed(true);
        setPhoneState(data.session.user.phone ?? null);
      }
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
      if (!active) return;
      setIsAuthed(Boolean(session));
      setPhoneState(session?.user.phone ?? null);
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
      setPhone: (next: string) => setPhoneState(next),
      completeOnboarding: (overrides?: Partial<Member>) => {
        setAuthedMember((prev) => ({ ...(prev ?? defaultMember), ...(overrides ?? {}) }));
        setIsAuthed(true);
      },
      signOut: () => {
        const supabase = getSupabase();
        if (supabase) void supabase.auth.signOut();
        setIsAuthed(false);
        setPhoneState(null);
      },
    }),
    [isAuthed, phone, authedMember],
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
