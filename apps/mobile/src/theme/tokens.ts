/**
 * FitClub design tokens — ported from `_tokens.css`.
 * Single source of truth for all colors, radii, shadows, and font names.
 */

export const tokens = {
  color: {
    bg: '#fafaf9',
    surface: '#ffffff',
    fg: '#1a1a1a',
    fgMuted: '#6b7280',
    fgFaint: '#9ca3af',
    border: '#e7e5e4',
    borderFaint: '#f3f1ee',

    accent: '#f59e0b',
    accentFg: '#1a1a1a',
    accentSoft: '#fef3c7',

    good: '#16a34a',
    goodSoft: '#dcfce7',
    goodFg: '#166534',
    warn: '#ca8a04',
    warnSoft: '#fef3c7',
    warnFg: '#92400e',
    bad: '#dc2626',
    badSoft: '#fee2e2',
    badFg: '#991b1b',
    info: '#2563eb',
    infoSoft: '#dbeafe',
    infoFg: '#1e40af',

    cat: {
      yoga: '#fef3c7',
      yogaFg: '#92400e',
      cross: '#fee2e2',
      crossFg: '#991b1b',
      pilates: '#dbeafe',
      pilatesFg: '#1e40af',
      strength: '#ede9fe',
      strengthFg: '#5b21b6',
      cardio: '#d1fae5',
      cardioFg: '#065f46',
      pt: '#fce7f3',
      ptFg: '#9f1239',
    },

    // dark surfaces
    night: '#0a0a0a',
  },

  radius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    pill: 999,
  },

  // RN style shadow recipes — usable as-is via {...tokens.shadow.sm}
  shadow: {
    sm: {
      shadowColor: '#000',
      shadowOpacity: 0.04,
      shadowRadius: 3,
      shadowOffset: { width: 0, height: 1 },
      elevation: 1,
    },
    md: {
      shadowColor: '#000',
      shadowOpacity: 0.06,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 },
      elevation: 2,
    },
    lg: {
      shadowColor: '#000',
      shadowOpacity: 0.08,
      shadowRadius: 32,
      shadowOffset: { width: 0, height: 12 },
      elevation: 4,
    },
    float: {
      shadowColor: '#000',
      shadowOpacity: 0.18,
      shadowRadius: 30,
      shadowOffset: { width: 0, height: 12 },
      elevation: 6,
    },
  },

  font: {
    sans: 'Inter_500Medium',
    sansRegular: 'Inter_400Regular',
    sansMedium: 'Inter_500Medium',
    sansSemibold: 'Inter_600SemiBold',
    sansBold: 'Inter_700Bold',
    sansExtrabold: 'Inter_800ExtraBold',
    sansBlack: 'Inter_900Black',
    mono: 'JetBrainsMono_500Medium',
    monoRegular: 'JetBrainsMono_400Regular',
    monoSemibold: 'JetBrainsMono_600SemiBold',
  },
} as const;

export type Tokens = typeof tokens;
