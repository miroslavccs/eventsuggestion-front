import * as Haptics from 'expo-haptics';
import type { ReactNode } from 'react';
import {
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type TextProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

import { colors, fonts, radius } from '@/theme/tokens';

const tap = () => {
  if (Platform.OS !== 'web') void Haptics.selectionAsync();
};

type Variant = 'body' | 'muted' | 'small' | 'label' | 'h1' | 'h2' | 'h3' | 'strong';

const textStyles: Record<Variant, TextStyle> = {
  body: { fontFamily: fonts.body, fontSize: 15, lineHeight: 22, color: colors.ink },
  muted: { fontFamily: fonts.body, fontSize: 15, lineHeight: 22, color: colors.muted },
  small: { fontFamily: fonts.medium, fontSize: 13, lineHeight: 18, color: colors.muted },
  label: { fontFamily: fonts.bold, fontSize: 12, letterSpacing: 1, color: colors.muted },
  strong: { fontFamily: fonts.bold, fontSize: 15, lineHeight: 22, color: colors.ink },
  h1: { fontFamily: fonts.heading, fontSize: 34, lineHeight: 38, letterSpacing: -1, color: colors.ink },
  h2: { fontFamily: fonts.heading, fontSize: 24, lineHeight: 28, letterSpacing: -0.5, color: colors.ink },
  h3: { fontFamily: fonts.heading, fontSize: 20, lineHeight: 24, color: colors.ink },
};

export function T({ v = 'body', style, ...rest }: TextProps & { v?: Variant }) {
  return <Text {...rest} style={[textStyles[v], style]} />;
}

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'accent';

export function Button({
  label,
  onPress,
  variant = 'primary',
  icon,
  disabled,
  loading,
  style,
  large,
}: {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  icon?: ReactNode;
  disabled?: boolean;
  loading?: boolean;
  large?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const palette = {
    primary: { bg: colors.ink, fg: colors.onInk, border: colors.ink, font: fonts.bold },
    accent: { bg: colors.accent, fg: colors.onInk, border: colors.accent, font: fonts.bold },
    secondary: { bg: colors.surface, fg: colors.ink, border: colors.borderInput, font: fonts.medium },
    ghost: { bg: 'transparent', fg: colors.muted, border: 'transparent', font: fonts.medium },
  }[variant];
  const off = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!off, busy: !!loading }}
      disabled={off}
      onPress={() => {
        tap();
        onPress?.();
      }}
      style={({ pressed }) => [
        {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          height: large ? 52 : 44,
          paddingHorizontal: large ? 26 : 20,
          borderRadius: radius.pill,
          borderWidth: 1,
          backgroundColor: palette.bg,
          borderColor: palette.border,
          opacity: off ? 0.5 : pressed ? 0.8 : 1,
        },
        style,
      ]}
    >
      {icon}
      <Text style={{ fontFamily: palette.font, fontSize: large ? 16 : 15, color: palette.fg }}>
        {loading ? 'Please wait…' : label}
      </Text>
    </Pressable>
  );
}

export function Chip({
  label,
  selected,
  onPress,
  dashed,
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  dashed?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected }}
      onPress={() => {
        tap();
        onPress?.();
      }}
      style={({ pressed }) => ({
        height: 40,
        paddingHorizontal: 16,
        borderRadius: radius.pill,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: selected ? colors.ink : colors.surface,
        borderWidth: 1,
        borderStyle: dashed ? 'dashed' : 'solid',
        borderColor: selected ? colors.ink : dashed ? colors.borderInput : colors.borderStrong,
        opacity: pressed ? 0.8 : 1,
      })}
    >
      <Text style={{ fontFamily: fonts.medium, fontSize: 15, color: selected ? colors.onInk : dashed ? colors.muted : colors.ink }}>
        {label}
      </Text>
    </Pressable>
  );
}

export function Toggle({
  value,
  onValueChange,
  label,
  onInk,
  disabled,
}: {
  value: boolean;
  onValueChange: (next: boolean) => void;
  label: string;
  /** Use the darker off-track when the toggle sits on the ink-colored panel. */
  onInk?: boolean;
  disabled?: boolean;
}) {
  const off = onInk ? colors.toggleOffOnInk : colors.borderInput;
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{ checked: value, disabled: !!disabled }}
      disabled={disabled}
      hitSlop={8}
      onPress={() => {
        tap();
        onValueChange(!value);
      }}
      style={{
        width: 52,
        height: 30,
        borderRadius: radius.pill,
        backgroundColor: value ? colors.accent : off,
        justifyContent: 'center',
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <View
        style={{
          position: 'absolute',
          top: 3,
          left: value ? 25 : 3,
          width: 24,
          height: 24,
          borderRadius: 12,
          backgroundColor: '#FFFFFF',
        }}
      />
    </Pressable>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <View
      style={[
        { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.card, padding: 22 },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function Field({
  label,
  error,
  ...input
}: TextInputProps & { label: string; error?: string }) {
  return (
    <View style={{ gap: 6, flex: 1, minWidth: 200 }}>
      <T v="strong" style={{ fontFamily: fonts.medium }}>
        {label}
      </T>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={colors.subtle}
        {...input}
        style={[
          {
            fontFamily: fonts.body,
            fontSize: 16,
            minHeight: 44,
            paddingHorizontal: 12,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: error ? colors.danger : colors.borderInput,
            color: colors.ink,
            backgroundColor: colors.surface,
          },
          input.multiline ? { paddingVertical: 12, minHeight: 80, textAlignVertical: 'top' } : null,
          input.style,
        ]}
      />
      {error ? <T v="small" style={{ color: colors.danger }}>{error}</T> : null}
    </View>
  );
}

export function ErrorBanner({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <View
      accessibilityRole="alert"
      style={{ backgroundColor: '#FEF3F2', borderColor: '#FDA29B', borderWidth: 1, borderRadius: 12, padding: 12 }}
    >
      <T style={{ color: colors.danger }}>{message}</T>
    </View>
  );
}

export function EmptyState({ title, hint, action }: { title: string; hint?: string; action?: ReactNode }) {
  return (
    <View style={{ alignItems: 'center', gap: 8, paddingVertical: 48, paddingHorizontal: 24 }}>
      <T v="h3" style={{ textAlign: 'center' }}>{title}</T>
      {hint ? <T v="muted" style={{ textAlign: 'center' }}>{hint}</T> : null}
      {action ? <View style={{ marginTop: 8 }}>{action}</View> : null}
    </View>
  );
}
