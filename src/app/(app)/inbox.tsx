import { Link } from 'expo-router';
import { ActivityIndicator, Pressable, View } from 'react-native';

import { useNotifications } from '@/api/hooks';
import { Screen } from '@/components/screen';
import { CategoryPill } from '@/components/suggestion-card';
import { EmptyState, ErrorBanner, T } from '@/components/ui';
import { dateLabel } from '@/lib/suggestions';
import { colors } from '@/theme/tokens';

export default function Inbox() {
  const { data, isLoading, error, refetch, isRefetching } = useNotifications();
  const items = data ?? [];
  return (
    <Screen onRefresh={() => void refetch()} refreshing={isRefetching}>
      <T v="h1">Inbox</T>
      <ErrorBanner message={(error as Error | null)?.message} />
      {isLoading ? <ActivityIndicator color={colors.accent} /> : null}
      {items.map((s) => (
        <Link key={s.id} href={{ pathname: '/suggestion/[id]', params: { id: s.id } }} asChild>
          <Pressable accessibilityRole="link" style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 20, padding: 16, gap: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <CategoryPill category={s.category} />
              <T v="small">{dateLabel(s)}</T>
              {!s.notificationRead ? <View accessibilityLabel="Unread" style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accent }} /> : null}
            </View>
            <T v="h3">{s.title}</T>
            {s.reasonForSuggestion ? <T v="muted" numberOfLines={2}>{s.reasonForSuggestion}</T> : null}
          </Pressable>
        </Link>
      ))}
      {!isLoading && items.length === 0 ? <EmptyState title="You're all caught up" hint="New suggestions appear here until you act on them." /> : null}
    </Screen>
  );
}
