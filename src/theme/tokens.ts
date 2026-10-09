import { Platform, type ViewStyle } from 'react-native';

import type { SuggestionCategory } from '@/api/types';

/** Palette from the "Lumo – Improved Mockups" Figma file: warm cream canvas, indigo ink, coral→amber primary. */
export const colors = {
  ink: '#1E1A3C',
  bg: '#FFF8F2',
  surface: '#FFFFFF',
  sunken: '#FFFBF7',
  track: '#F3EAE1',
  border: '#F0E6DD',
  borderStrong: '#E3D8CE',
  borderInput: '#E3D8CE',
  muted: '#6B6580',
  subtle: '#9A94AD',
  accent: '#FF5A3C',
  amber: '#FF9F43',
  indigo: '#2B1F6B',
  violet: '#6D3FE0',
  accentSoft: '#FFF3E8',
  accentBorder: '#FFD3B8',
  onInk: '#FFFFFF',
  onInkMuted: '#C9C2E8',
  inkRaised: '#3B2A8F',
  toggleOff: '#E3DAD0',
  toggleOffOnInk: '#5A4F8F',
  danger: '#B42318',
  success: '#166534',
  successSoft: '#E5F4EC',
} as const;

export const categoryColors: Record<SuggestionCategory, { bg: string; ink: string; dot: string; label: string }> = {
  DAILY: { bg: '#DDF5F0', ink: '#0B7A6B', dot: '#12B3A0', label: 'Daily' },
  WEEKEND: { bg: '#FFE4DC', ink: '#C2391A', dot: '#FF5A3C', label: 'Weekend' },
  MONTHLY: { bg: '#E9E1FF', ink: '#5B2FD0', dot: '#7C4DFF', label: 'Monthly' },
};

export const doneColors = {
  ACCEPTED: { bg: '#E5F4EC', ink: '#166534', text: 'Added to your plans' },
  WISHLIST: { bg: '#FFEBDD', ink: '#A8380B', text: 'Saved to your wishlist' },
  REJECTED: { bg: '#F3EAE1', ink: '#3F434C', text: 'Got it, fewer like this' },
} as const;

export const fonts = {
  heading: 'BricolageGrotesque_700Bold',
  headingXL: 'BricolageGrotesque_800ExtraBold',
  body: 'DMSans_400Regular',
  medium: 'DMSans_500Medium',
  bold: 'DMSans_700Bold',
} as const;

export const radius = { card: 24, hero: 32, control: 16, pill: 999 } as const;

/** Viewport width from which the web/tablet layout (top nav, two columns) is used. */
export const WIDE_BREAKPOINT = 900;

type Stops = readonly [string, string];

export const gradientStops = {
  brand: [colors.accent, colors.amber],
  hero: [colors.indigo, colors.violet],
  night: [colors.ink, colors.inkRaised],
  warm: ['#FFF1E4', '#FFE4DC'],
} as const satisfies Record<string, Stops>;

/**
 * Linear gradient as a style object, with no extra dependency. Web uses CSS `backgroundImage`; native uses
 * React Native's `experimental_backgroundImage`. The first stop is also set as `backgroundColor`, so anything
 * that ignores the gradient still renders a solid colour from the same palette.
 */
export function gradient([from, to]: Stops, angle = 135): ViewStyle {
  const css = `linear-gradient(${angle}deg, ${from}, ${to})`;
  const image = Platform.OS === 'web' ? { backgroundImage: css } : { experimental_backgroundImage: css };
  return { backgroundColor: from, ...image } as ViewStyle;
}

/** Soft coloured drop shadow used by cards and primary buttons (iOS/web shadow* plus Android elevation). */
export function shadow(color: string, opacity: number, y: number, blur: number): ViewStyle {
  return {
    shadowColor: color,
    shadowOpacity: opacity,
    shadowOffset: { width: 0, height: y },
    shadowRadius: blur,
    elevation: Math.round(blur / 4),
  };
}

export const shadows = {
  card: shadow('#4B2BD8', 0.07, 8, 24),
  brand: shadow('#FF5A3C', 0.32, 6, 14),
  night: shadow('#1E1A3C', 0.2, 12, 30),
} as const;
