import { Ionicons } from '@expo/vector-icons';
import type { Tabs } from 'expo-router';
import type { ComponentProps } from 'react';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useNotifications, useProfile } from '@/api/hooks';
import { useIsWide } from '@/hooks/use-is-wide';
import { colors, fonts, gradient, gradientStops, radius } from '@/theme/tokens';
import { T } from './ui';

type BottomTabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];
type IconName = React.ComponentProps<typeof Ionicons>['name'];

const TABS: { name: string; label: string; icon: IconName; iconOn: IconName }[] = [
  { name: 'index', label: 'Today', icon: 'home-outline', iconOn: 'home' },
  { name: 'calendar', label: 'Calendar', icon: 'calendar-outline', iconOn: 'calendar' },
  { name: 'plans', label: 'Plans', icon: 'bookmark-outline', iconOn: 'bookmark' },
  { name: 'inbox', label: 'Inbox', icon: 'file-tray-outline', iconOn: 'file-tray' },
  { name: 'profile', label: 'Profile', icon: 'person-outline', iconOn: 'person' },
];

function Badge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <View
      accessibilityLabel={`${count} unread`}
      style={{ position: 'absolute', top: -4, right: -4, minWidth: 18, height: 18, paddingHorizontal: 4, borderRadius: 9, backgroundColor: colors.accent, borderWidth: 2, borderColor: colors.surface, alignItems: 'center', justifyContent: 'center' }}
    >
      <T style={{ fontFamily: fonts.bold, fontSize: 10, color: '#fff' }}>{count}</T>
    </View>
  );
}

function Logo() {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <View style={[{ width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }, gradient(gradientStops.brand)]}>
        <Ionicons name="sparkles" size={19} color="#fff" />
      </View>
      <T style={{ fontFamily: fonts.headingXL, fontSize: 26, letterSpacing: -0.6 }}>Lumo</T>
    </View>
  );
}

export function NavBar({ state, navigation }: BottomTabBarProps) {
  const wide = useIsWide();
  const insets = useSafeAreaInsets();
  const unread = useNotifications().data?.filter((s) => !s.notificationRead).length ?? 0;
  const initial = useProfile().data?.firstName?.[0]?.toUpperCase() ?? '·';
  const activeName = state.routes[state.index]?.name ?? 'index';
  // The suggestion detail route lives inside the tabs but belongs to Today.
  const current = activeName.startsWith('suggestion') ? 'index' : activeName;

  const go = (name: string) => {
    const route = state.routes.find((r) => r.name === name);
    if (!route) return;
    const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
    if (!event.defaultPrevented) navigation.navigate(name);
  };

  if (wide) {
    return (
      <View style={{ backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border, paddingTop: insets.top }}>
        <View style={{ width: '100%', maxWidth: 1280, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 32, paddingHorizontal: 32, paddingVertical: 14 }}>
          <Pressable accessibilityRole="link" accessibilityLabel="Lumo, go to Today" onPress={() => go('index')}>
            <Logo />
          </Pressable>
          <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'center', gap: 6 }}>
            {TABS.filter((t) => t.name !== 'profile').map((t) => {
              const on = current === t.name;
              return (
                <Pressable
                  key={t.name}
                  accessibilityRole="link"
                  accessibilityState={{ selected: on }}
                  onPress={() => go(t.name)}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 10, borderRadius: radius.pill, backgroundColor: on ? colors.ink : 'transparent' }}
                >
                  <Ionicons name={on ? t.iconOn : t.icon} size={16} color={on ? '#fff' : colors.muted} />
                  <T style={{ fontFamily: on ? fonts.bold : fonts.medium, color: on ? '#fff' : colors.muted }}>{t.label}</T>
                </Pressable>
              );
            })}
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Notifications, ${unread} unread`}
            onPress={() => go('inbox')}
            style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.track, alignItems: 'center', justifyContent: 'center' }}
          >
            <Ionicons name="notifications-outline" size={18} color={colors.ink} />
            <Badge count={unread} />
          </Pressable>
          <Pressable
            accessibilityRole="link"
            accessibilityLabel="Profile"
            accessibilityState={{ selected: current === 'profile' }}
            onPress={() => go('profile')}
            style={[
              { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: current === 'profile' ? colors.accent : 'transparent' },
              gradient(gradientStops.hero),
            ]}
          >
            <T style={{ fontFamily: fonts.bold, color: '#fff' }}>{initial}</T>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View accessibilityRole="tablist" style={{ flexDirection: 'row', backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border, paddingBottom: Math.max(insets.bottom, 8), paddingTop: 8, paddingHorizontal: 4 }}>
      {TABS.map((t) => {
        const on = current === t.name;
        return (
          <Pressable
            key={t.name}
            accessibilityRole="tab"
            accessibilityLabel={t.label}
            accessibilityState={{ selected: on }}
            onPress={() => go(t.name)}
            style={{ flex: 1, alignItems: 'center', gap: 4, minHeight: 52, justifyContent: 'center' }}
          >
            <View style={[{ width: 52, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' }, on ? gradient(gradientStops.brand) : null]}>
              <Ionicons name={on ? t.iconOn : t.icon} size={18} color={on ? '#fff' : colors.muted} />
              {t.name === 'inbox' ? <Badge count={unread} /> : null}
            </View>
            <T style={{ fontFamily: on ? fonts.bold : fonts.medium, fontSize: 11, color: on ? colors.accent : colors.muted }}>{t.label}</T>
          </Pressable>
        );
      })}
    </View>
  );
}
