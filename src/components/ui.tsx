import { Ionicons } from '@expo/vector-icons';
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

import { colors, fonts, gradient, gradientStops, radius, shadows } from '@/theme/tokens';

const tap = () => {
  if (Platform.OS !== 'web') void Haptics.selectionAsync();
};

type Variant = 'body' | 'muted' | 'small' | 'label' | 'h1' | 'h2' | 'h3' | 'strong';

const textStyles: Record<Variant, TextStyle> = {
  body: { fontFamily: fonts.body, fontSize: 15, lineHeight: 22, color: colors.ink },
  muted: { fontFamily: fonts.body, fontSize: 15, lineHeight: 22, color: colors.muted },
  small: { fontFamily: fonts.medium, fontSize: 13, lineHeight: 18, color: colors.muted },
  label: { fontFamily: fonts.bold, fontSize: 11, letterSpacing: 1.4, color: colors.subtle },
  strong: { fontFamily: fonts.bold, fontSize: 15, lineHeight: 22, color: colors.ink },
  h1: { fontFamily: fonts.headingXL, fontSize: 34, lineHeight: 38, letterSpacing: -1, color: colors.ink },
  h2: { fontFamily: fonts.heading, fontSize: 24, lineHeight: 28, letterSpacing: -0.5, color: colors.ink },
  h3: { fontFamily: fonts.heading, fontSize: 20, lineHeight: 24, color: colors.ink },
};

export function T({ v = 'body', style, ...rest }: TextProps & { v?: Variant }) {
  return <Text {...rest} style={[textStyles[v], style]} />;
}

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'accent' | 'light';

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
  // `accent` is kept as an alias so older call sites keep the primary look.
  const kind = variant === 'accent' ? 'primary' : variant;
  const palette = {
    primary: { fg: colors.onInk, border: 'transparent', font: fonts.bold, surface: [gradient(gradientStops.brand), shadows.brand] },
    secondary: { fg: colors.ink, border: colors.border, font: fonts.bold, surface: [{ backgroundColor: colors.surface }] },
    light: { fg: colors.ink, border: 'transparent', font: fonts.bold, surface: [{ backgroundColor: colors.surface }, shadows.card] },
    ghost: { fg: colors.muted, border: 'transparent', font: fonts.medium, surface: [{ backgroundColor: 'transparent' }] },
  }[kind];
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
          height: large ? 54 : 44,
          paddingHorizontal: large ? 28 : 20,
          borderRadius: radius.pill,
          borderWidth: 1,
          borderColor: palette.border,
          opacity: off ? 0.5 : pressed ? 0.85 : 1,
        },
        ...palette.surface,
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
  dot,
  tone = 'ink',
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  dashed?: boolean;
  /** Category colour shown as a small dot before the label. */
  dot?: string;
  /** `ink` = dark when selected (filters); `soft` = coral tint with a check (multi-select pickers). */
  tone?: 'ink' | 'soft';
}) {
  const soft = tone === 'soft';
  const fg = selected ? (soft ? colors.accent : colors.onInk) : dashed ? colors.muted : soft ? colors.muted : colors.ink;
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
        flexDirection: 'row',
        gap: 8,
        borderRadius: radius.pill,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: selected ? (soft ? colors.accentSoft : colors.ink) : colors.surface,
        borderWidth: 1,
        borderStyle: dashed ? 'dashed' : 'solid',
        borderColor: selected ? (soft ? colors.accentBorder : colors.ink) : dashed ? colors.borderStrong : colors.border,
        opacity: pressed ? 0.85 : 1,
      })}
    >
      {dot ? <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: dot }} /> : null}
      {soft && selected ? <Ionicons name="checkmark" size={14} color={colors.accent} /> : null}
      <Text style={{ fontFamily: selected || !soft ? fonts.bold : fonts.medium, fontSize: 14, color: fg }}>
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
  /** Use the darker off-track when the toggle sits on a dark panel. */
  onInk?: boolean;
  disabled?: boolean;
}) {
  const off = onInk ? colors.toggleOffOnInk : colors.toggleOff;
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
      style={[
        {
          width: 46,
          height: 26,
          borderRadius: radius.pill,
          justifyContent: 'center',
          opacity: disabled ? 0.5 : 1,
        },
        value ? gradient(gradientStops.brand) : { backgroundColor: off },
      ]}
    >
      <View
        style={{
          position: 'absolute',
          top: 3,
          left: value ? 23 : 3,
          width: 20,
          height: 20,
          borderRadius: 10,
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
        shadows.card,
        style,
      ]}
    >
      {children}
    </View>
  );
}

/** Gradient card (indigo hero by default) with two soft decorative glows, as in the mockups. */
export function Hero({
  children,
  stops = gradientStops.hero,
  style,
}: {
  children: ReactNode;
  stops?: readonly [string, string];
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[{ borderRadius: radius.hero, padding: 28, gap: 18, overflow: 'hidden' }, gradient(stops), shadows.night, style]}>
      <View pointerEvents="none" style={{ position: 'absolute', right: -70, top: -90, width: 240, height: 240, borderRadius: 120, backgroundColor: colors.amber, opacity: 0.2 }} />
      <View pointerEvents="none" style={{ position: 'absolute', right: 30, bottom: -70, width: 150, height: 150, borderRadius: 75, backgroundColor: colors.accent, opacity: 0.22 }} />
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
      <T v="strong" style={{ fontFamily: fonts.bold, fontSize: 12, color: colors.muted }}>
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
            minHeight: 50,
            paddingHorizontal: 16,
            borderRadius: radius.control,
            borderWidth: 1,
            borderColor: error ? colors.danger : colors.borderInput,
            color: colors.ink,
            backgroundColor: colors.surface,
          },
          input.multiline ? { paddingVertical: 14, minHeight: 88, textAlignVertical: 'top' } : null,
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
      style={{ backgroundColor: '#FEF3F2', borderColor: '#FDA29B', borderWidth: 1, borderRadius: radius.control, padding: 14 }}
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
