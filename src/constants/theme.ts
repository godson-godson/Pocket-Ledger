import { Platform } from 'react-native';

export const COLORS = {
  // ── Background ─────────────────────────────────────────────────
  background: '#000000',          // True pitch black
  surface: '#0A0C10',             // Primary card surface – very dark near-black
  surfaceElevated: '#10141B',     // Secondary card / elevated surface
  surfaceHighlight: '#151A24',    // Subtle highlight / pressed state
  surfaceGlass: 'rgba(16,20,27,0.85)', // Semi-transparent glass overlay

  // ── Borders ────────────────────────────────────────────────────
  border: '#252B35',              // Subtle border matching spec (#252B35)
  borderLight: '#252B35',         // Consistent subtle border
  borderSubtle: '#181E28',        // Very subtle divider
  divider: '#121620',             // Row divider inside cards

  // ── Primary Accent – Muted Technical Blue ──────────────────────
  accentBlue: '#2583FF',          // Active nav, links, progress (#2583FF)
  accentBlueVivid: '#2583FF',     // Primary action button
  accentBlueDim: '#1A66CC',       // Pressed/disabled state
  accentBlueLight: '#2583FF',     // Consistent technical blue
  accentBlueBg: 'rgba(37,131,255,0.10)',
  accentBlueBorder: 'rgba(37,131,255,0.22)',

  // ── Purple (restrained, secondary) ─────────────────────────────
  accentPurple: '#8B5CF6',
  accentPurpleBg: 'rgba(139,92,246,0.10)',
  accentPurpleBorder: 'rgba(139,92,246,0.22)',
  accentPurpleLight: '#A78BFA',

  // ── Income Accent – Mint / Teal ────────────────────────────────
  accentGreen: '#00CFA5',         // Income amounts, indicators (#00CFA5)
  accentGreenMuted: '#00A882',
  accentGreenBg: 'rgba(0,207,165,0.10)',
  accentGreenBorder: 'rgba(0,207,165,0.22)',

  // ── Expense/Warning Accents ─────────────────────────────────────
  accentRose: '#FF4D6A',          // Exceeded budget / destructive
  accentRoseMuted: '#CC3D55',
  accentRoseBg: 'rgba(255,77,106,0.10)',
  accentRoseBorder: 'rgba(255,77,106,0.22)',

  // Warning accent: amber for budget warnings
  accentAmber: '#F5A623',         // Budget 80%+ warning
  accentAmberBg: 'rgba(245,166,35,0.10)',
  accentAmberBorder: 'rgba(245,166,35,0.22)',

  // ── Typography ─────────────────────────────────────────────────
  textPrimary: '#F5F7FA',         // Headings, amounts, active (#F5F7FA)
  textSecondary: '#929EAF',       // Labels, subtitles (#929EAF)
  textMuted: '#5A6478',           // Placeholders, tertiary
  textDisabled: '#3A4255',        // Disabled / hint

  // ── Interactive ───────────────────────────────────────────────
  buttonPrimaryText: '#FFFFFF',
  overlay: 'rgba(0,0,0,0.75)',

  // ── Hero card (for BalanceCard) ─────────────────────────────────
  heroBg: '#0A0C10',
  heroBorder: '#252B35',
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
  xxl: 24,
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
