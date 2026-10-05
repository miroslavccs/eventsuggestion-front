import type { ReactNode } from 'react';
import { RefreshControl, ScrollView, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useIsWide } from '@/hooks/use-is-wide';
import { colors } from '@/theme/tokens';

/** Page container: scrolls, centers content at 1280px on wide screens, pads for safe areas on mobile. */
export function Screen({
  children,
  onRefresh,
  refreshing,
  style,
  noTopInset,
}: {
  children: ReactNode;
  onRefresh?: () => void;
  refreshing?: boolean;
  style?: StyleProp<ViewStyle>;
  noTopInset?: boolean;
}) {
  const wide = useIsWide();
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ paddingTop: wide || noTopInset ? 0 : insets.top }}
      refreshControl={onRefresh ? <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} /> : undefined}
      keyboardShouldPersistTaps="handled"
    >
      <View
        style={[
          { width: '100%', maxWidth: 1280, alignSelf: 'center', padding: wide ? 32 : 16, paddingTop: wide ? 40 : 16, paddingBottom: 64, gap: 20 },
          style,
        ]}
      >
        {children}
      </View>
    </ScrollView>
  );
}
