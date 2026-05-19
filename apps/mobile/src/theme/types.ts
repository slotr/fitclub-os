import type { tokens } from './tokens';

export type ColorTokens = typeof tokens.color;
export type CategoryColor = keyof typeof tokens.color.cat extends infer K
  ? K extends string
    ? K
    : never
  : never;

export type ShadowToken = keyof typeof tokens.shadow;
export type RadiusToken = keyof typeof tokens.radius;
export type FontToken = keyof typeof tokens.font;
