import type { SuggestionCategory } from '@/api/types';

export const colors = {
  ink: '#15171C',
  bg: '#F2F3F5',
  surface: '#FFFFFF',
  sunken: '#F6F7F9',
  track: '#ECEEF1',
  border: '#E2E4E9',
  borderStrong: '#D5D8DE',
  borderInput: '#C9CCD3',
  muted: '#5A5F6B',
  subtle: '#8A8F99',
  accent: '#C2410C',
  accentSoft: '#FFF6F0',
  accentBorder: '#FFD3B8',
  onInk: '#FFFFFF',
  onInkMuted: '#C9CCD3',
  inkRaised: '#2A2D35',
  toggleOffOnInk: '#4A4F5A',
  danger: '#B42318',
} as const;

export const categoryColors: Record<SuggestionCategory, { bg: string; ink: string; label: string }> = {
  DAILY: { bg: '#E7EEFF', ink: '#2446A8', label: 'Daily' },
  WEEKEND: { bg: '#FFEBDD', ink: '#A8380B', label: 'Weekend' },
  MONTHLY: { bg: '#EFE7FF', ink: '#5B2FB0', label: 'Monthly' },
};

export const doneColors = {
  ACCEPTED: { bg: '#E5F4EC', ink: '#166534', text: 'Added to your plans' },
  WISHLIST: { bg: '#FFEBDD', ink: '#A8380B', text: 'Saved to your wishlist' },
  REJECTED: { bg: '#ECEEF1', ink: '#3F434C', text: 'Got it, fewer like this' },
} as const;

export const fonts = {
  heading: 'BricolageGrotesque_700Bold',
  body: 'DMSans_400Regular',
  medium: 'DMSans_500Medium',
  bold: 'DMSans_700Bold',
} as const;

export const radius = { card: 20, control: 12, pill: 999 } as const;

/** Viewport width from which the web/tablet layout (top nav, two columns) is used. */
export const WIDE_BREAKPOINT = 900;
