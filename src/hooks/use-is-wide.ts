import { useWindowDimensions } from 'react-native';

import { WIDE_BREAKPOINT } from '@/theme/tokens';

export function useIsWide(): boolean {
  return useWindowDimensions().width >= WIDE_BREAKPOINT;
}
