import { Tabs } from 'expo-router';

import { NavBar } from '@/components/nav-bar';
import { useIsWide } from '@/hooks/use-is-wide';

export default function AppLayout() {
  const wide = useIsWide();
  return (
    <Tabs
      backBehavior="history"
      tabBar={(props) => <NavBar {...props} />}
      screenOptions={{ headerShown: false, tabBarPosition: wide ? 'top' : 'bottom' }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="calendar" />
      <Tabs.Screen name="plans" />
      <Tabs.Screen name="inbox" />
      <Tabs.Screen name="profile" />
      <Tabs.Screen name="suggestion/[id]" options={{ href: null }} />
    </Tabs>
  );
}
