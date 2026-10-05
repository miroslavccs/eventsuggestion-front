import { Ionicons } from '@expo/vector-icons';
import type { Tabs } from 'expo-router';
import type { ComponentProps } from 'react';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useNotifications, useProfile } from '@/api/hooks';
import { useGenerateNow } from '@/hooks/use-generate-now';
import { useIsWide } from '@/hooks/use-is-wide';
import { colors, fonts, radius } from '@/theme/tokens';
import { Button, T } from './ui';

type BottomTabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];
type IconName = React.ComponentProps<typeof Ionicons>['name'];

const TABS: { name: string; label: string; icon: IconName; iconOn: IconName }[] = [
  { name: 'index', label: 'Today', icon: 'sunny-outline', iconOn: 'sunny' },
  { name: 'plans', label: 'Plans', icon: 'calendar-outline', iconOn: 'calendar' },
  { name: 'inbox', label: 'Inbox', icon: 'notifications-outline', iconOn: 'notifications' },
  { name: 'profile', label: 'Profile', icon: 'person-outline', iconOn: 'person' },
];

function Badge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <View
      accessibilityLabel={`${count} unread`}
      style={{ position: 'absolute', top: -2, right: -2, minWidth: 18, height: 18, paddingHorizontal: 4, borderRadius: 9, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' }}
    >
      <T style={{ fontFamily: fonts.bold, fontSize: 11, color: '#fff' }}>{count}</T>
    </View>
  );
}

function Logo() {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name="ticket-outline" size={18} color="#fff" />
      </View>
      <T style={{ fontFamily: fonts.heading, fontSize: 22, letterSpacing: -0.4 }}>Lumo</T>
    </View>
  );
}

export function NavBar({ state, navigation }: BottomTabBarProps) {
  const wide = useIsWide();
  const insets = useSafeAreaInsets();
  const unread = useNotifications().data?.filter((s) => !s.notificationRead).length ?? 0;
  const initial = useProfile().data?.firstName?.[0]?.toUpperCase() ?? '·';
  const gen = useGenerateNow();
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
          <View style={{ flex: 1, flexDirection: 'row', gap: 4 }}>
            {TABS.filter((t) => t.name === 'index' || t.name === 'plans').map((t) => {
              const on = current === t.name;
              return (
                <Pressable
                  key={t.name}
                  accessibilityRole="link"
                  accessibilityState={{ selected: on }}
                  onPress={() => go(t.name)}
                  style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.pill, backgroundColor: on ? colors.ink : 'transparent' }}
                >
                  <T style={{ fontFamily: fonts.medium, color: on ? '#fff' : colors.ink }}>{t.label}</T>
                </Pressable>
              );
            })}
          </View>
          <Button
            label="Generate now"
            variant="secondary"
            loading={gen.pending}
            disabled={gen.disabled}
            onPress={gen.run}
            icon={<Ionicons name="refresh" size={16} color={colors.ink} />}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Notifications, ${unread} unread`}
            onPress={() => go('inbox')}
            style={{ width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: colors.borderStrong, alignItems: 'center', justifyContent: 'center' }}
          >
            <Ionicons name="notifications-outline" size={18} color={colors.ink} />
            <Badge count={unread} />
          </Pressable>
          <Pressable
            accessibilityRole="link"
            accessibilityLabel="Profile"
            onPress={() => go('profile')}
            style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: current === 'profile' ? colors.accent : colors.ink, alignItems: 'center', justifyContent: 'center' }}
          >
            <T style={{ fontFamily: fonts.bold, color: '#fff' }}>{initial}</T>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View accessibilityRole="tablist" style={{ flexDirection: 'row', backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border, paddingBottom: Math.max(insets.bottom, 8), paddingTop: 8 }}>
      {TABS.map((t) => {
        const on = current === t.name;
        return (
          <Pressable
            key={t.name}
            accessibilityRole="tab"
            accessibilityLabel={t.label}
            accessibilityState={{ selected: on }}
            onPress={() => go(t.name)}
            style={{ flex: 1, alignItems: 'center', gap: 2, minHeight: 48, justifyContent: 'center' }}
          >
            <View>
              <Ionicons name={on ? t.iconOn : t.icon} size={22} color={on ? colors.ink : colors.subtle} />
              {t.name === 'inbox' ? <Badge count={unread} /> : null}
            </View>
            <T style={{ fontFamily: on ? fonts.bold : fonts.medium, fontSize: 11, color: on ? colors.ink : colors.subtle }}>{t.label}</T>
          </Pressable>
        );
      })}
    </View>
  );
}
