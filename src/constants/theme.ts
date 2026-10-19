import { Platform } from 'react-native';

export const COLORS = {
  // Base dark charcoal palette
  background: '#0B0D0F',
  surface: '#13161A',
  surfaceElevated: '#1A1E24',
  surfaceHighlight: '#222730',

  // Borders & Dividers
  border: '#232830',
  borderLight: '#2C323D',
  divider: '#1A1E24',

  // Accents - Restrained Green (Income / Primary)
  accentGreen: '#22C55E',
  accentGreenMuted: '#16A34A',
  accentGreenBg: 'rgba(34, 197, 94, 0.12)',
  accentGreenBorder: 'rgba(34, 197, 94, 0.28)',

  // Accents - Restrained Rose/Red (Expense)
  accentRose: '#F87171',
  accentRoseMuted: '#EF4444',
  accentRoseBg: 'rgba(248, 113, 113, 0.12)',
  accentRoseBorder: 'rgba(248, 113, 113, 0.28)',

  // Accents - Tech Slate / Blue (Secondary info)
  accentBlue: '#38BDF8',
  accentBlueBg: 'rgba(56, 189, 248, 0.10)',
  accentBlueBorder: 'rgba(56, 189, 248, 0.25)',

  // Accents - Warning Amber (80%+ budget alert)
  accentAmber: '#F59E0B',
  accentAmberMuted: '#D97706',
  accentAmberBg: 'rgba(245, 158, 11, 0.12)',
  accentAmberBorder: 'rgba(245, 158, 11, 0.28)',

  // Typography
  textPrimary: '#F1F5F9',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  textDisabled: '#475569',

  // Interactive
  buttonPrimaryText: '#0B0D0F',
  overlay: 'rgba(0, 0, 0, 0.75)',
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const RADIUS = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 9999,
};

export const FONTS = {
  mono: Platform.select({
    ios: 'Menlo',
    android: 'monospace',
    default: 'monospace',
  }),
  sans: Platform.select({
    ios: 'System',
    android: 'sans-serif',
    default: 'sans-serif',
  }),
  sansMedium: Platform.select({
    ios: 'System',
    android: 'sans-serif-medium',
    default: 'sans-serif',
  }),
};
