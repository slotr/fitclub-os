import React, { createContext, useContext, useMemo } from "react";
import { tokens } from "../theme/tokens";
import { useTenantStore } from "./tenant-store";

export type Theme = {
  accent: string;
  accentSoft: string;
  logoUrl: string | null;
  gymName: string;
};

const DEFAULT_THEME: Theme = {
  accent: tokens.color.accent,
  accentSoft: tokens.color.accentSoft,
  logoUrl: null,
  gymName: "FitClub",
};

const ThemeContext = createContext<Theme>(DEFAULT_THEME);

// Pure functions exported for testing
export function sanitizeHex(hex: string | null | undefined): string | null {
  if (!hex || typeof hex !== "string") return null;
  if (!/^#[0-9a-fA-F]{6}$/.test(hex)) return null;
  return hex;
}

export function hexAlpha(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const branding = useTenantStore((s) => s.currentBranding);
  const theme = useMemo<Theme>(() => {
    const accent = sanitizeHex(branding?.accentColor) ?? tokens.color.accent;
    return {
      accent,
      accentSoft: hexAlpha(accent, 0.12),
      logoUrl: branding?.logoUrl ?? null,
      gymName: branding?.gymName ?? "FitClub",
    };
  }, [branding]);
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  return useContext(ThemeContext);
}
