import { tokens } from '../../theme/tokens';

type MuscleEnum =
  | 'chest' | 'back' | 'shoulders' | 'biceps' | 'triceps'
  | 'legs' | 'glutes' | 'core' | 'fullBody';

const palette: Record<MuscleEnum, string> = {
  chest: tokens.color.accent,
  back: '#4a8c3a',
  legs: '#2f5596',
  shoulders: '#c8881a',
  biceps: '#8a6d1f',
  triceps: '#7d3e8c',
  glutes: '#b54b6a',
  core: '#2b6e6e',
  fullBody: tokens.color.fgMuted,
};

export function muscleColor(m: MuscleEnum | string): string {
  return palette[m as MuscleEnum] ?? tokens.color.fgMuted;
}
