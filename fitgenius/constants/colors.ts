export const Colors = {
  // Primary palette
  primary: '#4F46E5',       // Electric indigo
  primaryLight: '#6366F1',
  primaryDark: '#3730A3',
  accent: '#22C55E',        // Neon green
  accentLight: '#4ADE80',

  // Dark theme backgrounds
  background: '#0f0f0f',
  surface: '#1a1a1a',
  surfaceElevated: '#242424',
  card: '#1e1e1e',
  border: '#2a2a2a',
  borderLight: '#333333',

  // Text
  text: '#FFFFFF',
  textSecondary: '#A1A1AA',
  textMuted: '#71717A',
  textInverse: '#0f0f0f',

  // Status
  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',

  // Muscle group colors
  chest: '#EF4444',
  back: '#3B82F6',
  legs: '#8B5CF6',
  shoulders: '#F59E0B',
  arms: '#EC4899',
  core: '#22C55E',
  cardio: '#06B6D4',

  // Transparent overlays
  overlay: 'rgba(0, 0, 0, 0.6)',
  overlayLight: 'rgba(0, 0, 0, 0.3)',
  shimmer: 'rgba(255, 255, 255, 0.05)',
} as const;

export type ColorKey = keyof typeof Colors;
