import { Pressable, View } from 'react-native';

import { colors } from '@/theme/tokens';
import { T } from './ui';

export function StarRating({
  value,
  onChange,
  disabled,
}: {
  value: number | null;
  onChange?: (rating: number) => void;
  disabled?: boolean;
}) {
  return (
    <View accessibilityLabel="Rate 1 to 5 stars" style={{ flexDirection: 'row', gap: 4 }}>
      {[1, 2, 3, 4, 5].map((n) => {
        const on = (value ?? 0) >= n;
        return (
          <Pressable
            key={n}
            accessibilityRole="button"
            accessibilityLabel={`${n} star${n === 1 ? '' : 's'}`}
            accessibilityState={{ selected: on, disabled: !!disabled || !onChange }}
            disabled={disabled || !onChange}
            onPress={() => onChange?.(n)}
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: on ? colors.accentBorder : colors.border,
              backgroundColor: on ? colors.accentSoft : colors.surface,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <T style={{ fontSize: 20, color: on ? colors.amber : colors.subtle }}>{on ? '★' : '☆'}</T>
          </Pressable>
        );
      })}
    </View>
  );
}
