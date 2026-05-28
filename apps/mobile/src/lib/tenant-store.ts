import { create } from "zustand";
import * as SecureStore from "expo-secure-store";
import type { Membership, TenantBranding } from "@fitness/api";
import { getSupabase } from "./supabase";
import { resetCursors, flushPending } from "../workout/sync-engine";

const STORAGE_CURRENT = "fitclub.tenant.current";

type State = {
  memberships: Membership[];
  currentTenantId: string | null;
  currentMemberId: string | null;
  currentBranding: TenantBranding | null;
  isAuthed: boolean;

  hydrate: (memberships: Membership[], currentId: string) => void;
  setMemberships: (memberships: Membership[]) => Promise<void>;
  setCurrent: (m: Membership) => Promise<void>;
  switchTo: (tenantId: string) => Promise<void>;
  signOut: () => Promise<void>;
};

function brandingOf(m: Membership): TenantBranding {
  return {
    gymName: m.gymName,
    logoUrl: m.logoUrl,
    accentColor: m.accentColor,
  };
}

export const useTenantStore = create<State>((set, get) => ({
  memberships: [],
  currentTenantId: null,
  currentMemberId: null,
  currentBranding: null,
  isAuthed: false,

  hydrate: (memberships, currentId) => {
    const current = memberships.find((m) => m.tenantId === currentId) ?? null;
    set({
      memberships,
      currentTenantId: current?.tenantId ?? null,
      currentMemberId: current?.memberId ?? null,
      currentBranding: current ? brandingOf(current) : null,
      isAuthed: memberships.length > 0,
    });
  },

  setMemberships: async (memberships) => {
    set({ memberships, isAuthed: memberships.length > 0 });
  },

  setCurrent: async (m) => {
    await SecureStore.setItemAsync(STORAGE_CURRENT, m.tenantId).catch(() => undefined);
    set({
      currentTenantId: m.tenantId,
      currentMemberId: m.memberId,
      currentBranding: brandingOf(m),
    });
  },

  switchTo: async (tenantId) => {
    const m = get().memberships.find((x) => x.tenantId === tenantId);
    if (!m) throw new Error(`Membership not found for tenant ${tenantId}`);
    try {
      await flushPending();
    } catch (e) {
      console.warn("flushPending during tenant switch:", e);
    }
    resetCursors();
    await SecureStore.setItemAsync(STORAGE_CURRENT, tenantId).catch(() => undefined);
    set({
      currentTenantId: tenantId,
      currentMemberId: m.memberId,
      currentBranding: brandingOf(m),
    });
  },

  signOut: async () => {
    const supabase = getSupabase();
    if (supabase) {
      await supabase.auth.signOut();
    }
    await SecureStore.deleteItemAsync(STORAGE_CURRENT).catch(() => undefined);
    set({
      memberships: [],
      currentTenantId: null,
      currentMemberId: null,
      currentBranding: null,
      isAuthed: false,
    });
  },
}));
