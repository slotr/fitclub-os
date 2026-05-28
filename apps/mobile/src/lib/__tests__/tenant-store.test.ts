import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: vi.fn(async () => null),
    setItem: vi.fn(async () => undefined),
    removeMany: vi.fn(async () => undefined),
  },
}));

vi.mock("../supabase", () => ({
  getSupabase: () => ({
    auth: { signOut: vi.fn(async () => ({ error: null })) },
  }),
}));

import { useTenantStore } from "../tenant-store";

const A = {
  memberId: "m-1",
  tenantId: "t-1",
  gymName: "Gym A",
  logoUrl: null,
  accentColor: "#2f5596",
};
const B = {
  memberId: "m-2",
  tenantId: "t-2",
  gymName: "Gym B",
  logoUrl: "https://example.com/b.png",
  accentColor: "#e63946",
};

beforeEach(() => {
  useTenantStore.setState({
    memberships: [],
    currentTenantId: null,
    currentMemberId: null,
    currentBranding: null,
    isAuthed: false,
  });
});

describe("tenant-store", () => {
  it("hydrate sets memberships + current", () => {
    useTenantStore.getState().hydrate([A, B], "t-1");
    const s = useTenantStore.getState();
    expect(s.memberships).toHaveLength(2);
    expect(s.currentTenantId).toBe("t-1");
    expect(s.currentMemberId).toBe("m-1");
    expect(s.currentBranding?.gymName).toBe("Gym A");
    expect(s.isAuthed).toBe(true);
  });

  it("setCurrent updates branding", async () => {
    await useTenantStore.getState().setMemberships([A, B]);
    await useTenantStore.getState().setCurrent(B);
    expect(useTenantStore.getState().currentBranding?.gymName).toBe("Gym B");
    expect(useTenantStore.getState().currentBranding?.accentColor).toBe("#e63946");
  });

  it("switchTo finds membership by tenant id", async () => {
    useTenantStore.getState().hydrate([A, B], "t-1");
    await useTenantStore.getState().switchTo("t-2");
    expect(useTenantStore.getState().currentTenantId).toBe("t-2");
  });

  it("switchTo throws if unknown tenant", async () => {
    useTenantStore.getState().hydrate([A], "t-1");
    await expect(
      useTenantStore.getState().switchTo("t-unknown"),
    ).rejects.toThrow(/Membership not found/);
  });

  it("signOut clears everything", async () => {
    useTenantStore.getState().hydrate([A, B], "t-1");
    await useTenantStore.getState().signOut();
    const s = useTenantStore.getState();
    expect(s.memberships).toHaveLength(0);
    expect(s.currentTenantId).toBeNull();
    expect(s.isAuthed).toBe(false);
  });
});
