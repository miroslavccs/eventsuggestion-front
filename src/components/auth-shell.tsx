import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useIsWide } from '@/hooks/use-is-wide';
import { categoryColors, colors, fonts, gradient, gradientStops, radius, shadows } from '@/theme/tokens';
import { Hero, T } from './ui';

function Logo({ light }: { light?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <View style={[{ width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }, light ? { backgroundColor: '#fff' } : gradient(gradientStops.brand)]}>
        <Ionicons name="sparkles" size={20} color={light ? colors.accent : '#fff'} />
      </View>
      <T style={{ fontFamily: fonts.headingXL, fontSize: 30, letterSpacing: -0.6, color: light ? '#fff' : colors.ink }}>Lumo</T>
    </View>
  );
}

/** Decorative sample cards only: they show what a suggestion looks like and are hidden from screen readers. */
function Preview() {
  const rows = [
    { dn: 'SAT', d: '10', cat: 'WEEKEND', title: 'Harvest food market', loc: 'Old Town Square', opacity: 1 },
    { dn: 'THU', d: '15', cat: 'DAILY', title: 'Jazz night at Blue Room', loc: 'Blue Room Club', opacity: 0.75 },
  ] as const;
  return (
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ gap: 12, maxWidth: 440 }}>
      {rows.map((r) => {
        const c = categoryColors[r.cat];
        return (
          <View key={r.d} style={[{ flexDirection: 'row', backgroundColor: '#fff', borderRadius: 22, overflow: 'hidden', opacity: r.opacity }, shadows.night]}>
            <View style={{ width: 84, alignItems: 'center', justifyContent: 'center', paddingVertical: 14, backgroundColor: c.bg }}>
              <T style={{ fontFamily: fonts.bold, fontSize: 10, letterSpacing: 1.4, color: c.ink }}>{r.dn}</T>
              <T style={{ fontFamily: fonts.headingXL, fontSize: 32, lineHeight: 34, color: c.ink }}>{r.d}</T>
              <T style={{ fontFamily: fonts.bold, fontSize: 10, letterSpacing: 1.4, color: c.ink }}>OCT</T>
            </View>
            <View style={{ flex: 1, padding: 16, gap: 6 }}>
              <View style={{ alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: c.bg, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4 }}>
                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: c.dot }} />
                <T style={{ fontFamily: fonts.bold, fontSize: 11, letterSpacing: 0.7, color: c.ink }}>{c.label.toUpperCase()}</T>
              </View>
              <T v="h3" style={{ fontSize: 18 }}>{r.title}</T>
              <T v="small">{r.loc}</T>
            </View>
          </View>
        );
      })}
    </View>
  );
}

/**
 * Shared frame for sign in / sign up. Wide screens: indigo brand panel next to the form.
 * Phones: login gets a gradient header with the form on a rounded sheet; register is a plain form page.
 */
export function AuthShell({ variant, children }: { variant: 'login' | 'register'; children: ReactNode }) {
  const wide = useIsWide();
  const insets = useSafeAreaInsets();
  const formWidth = variant === 'register' ? 520 : 420;

  if (wide) {
    return (
      <View style={{ flex: 1, flexDirection: 'row', backgroundColor: colors.bg }}>
        <View style={{ width: '43%', minWidth: 440 }}>
          <Hero style={{ flex: 1, borderRadius: 0, padding: 56, justifyContent: 'space-between' }}>
            <Logo light />
            <View style={{ gap: 18 }}>
              <T style={{ fontFamily: fonts.headingXL, fontSize: 56, lineHeight: 60, letterSpacing: -1.5, color: '#fff' }}>Always something good to do.</T>
              <T style={{ fontSize: 18, lineHeight: 28, color: colors.onInkMuted, maxWidth: 460 }}>
                Lumo suggests daily ideas, weekend plans and monthly adventures, then keeps the ones you love in your calendar.
              </T>
            </View>
            <Preview />
          </Hero>
        </View>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 40 }} keyboardShouldPersistTaps="handled">
            <View style={{ width: '100%', maxWidth: formWidth, alignSelf: 'center', gap: 18 }}>{children}</View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        {variant === 'login' ? (
          <>
            <Hero style={{ borderRadius: 0, paddingTop: insets.top + 24, paddingHorizontal: 24, paddingBottom: 56, gap: 14 }}>
              <Logo light />
              <T style={{ fontFamily: fonts.headingXL, fontSize: 36, lineHeight: 38, letterSpacing: -1, color: '#fff' }}>Always something{'\n'}good to do.</T>
            </Hero>
            {/* No flex: 1 here. Field is flex: 1 for rows, so a stretched column would also stretch the inputs. */}
            <View style={{ marginTop: -32, borderTopLeftRadius: 32, borderTopRightRadius: 32, backgroundColor: colors.bg, padding: 24, paddingTop: 28, gap: 16 }}>
              {children}
            </View>
          </>
        ) : (
          <View style={{ padding: 20, paddingTop: insets.top + 16, gap: 16, width: '100%', maxWidth: formWidth, alignSelf: 'center' }}>{children}</View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
