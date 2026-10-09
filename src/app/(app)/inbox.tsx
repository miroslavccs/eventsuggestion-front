import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { ActivityIndicator, Pressable, View } from 'react-native';

import { useFeedback, useNotifications } from '@/api/hooks';
import type { Suggestion } from '@/api/types';
import { Screen } from '@/components/screen';
import { CategoryPill } from '@/components/suggestion-card';
import { Button, EmptyState, ErrorBanner, T } from '@/components/ui';
import { useIsWide } from '@/hooks/use-is-wide';
import { dateLabel } from '@/lib/suggestions';
import { categoryColors, colors, fonts, radius, shadow } from '@/theme/tokens';

function Item({ s, wide, onAccept, busy }: { s: Suggestion; wide: boolean; onAccept: () => void; busy: boolean }) {
  const unread = !s.notificationRead;
  const c = categoryColors[s.category];
  return (
    <Link href={{ pathname: '/suggestion/[id]', params: { id: s.id } }} asChild>
      <Pressable
        accessibilityRole="link"
        accessibilityLabel={`${unread ? 'Unread: ' : ''}${s.title}`}
        // Link asChild only accepts a plain style object, so the unread shadow is spread in, not passed as an array.
        style={{
          flexDirection: 'row',
          gap: 16,
          padding: wide ? 20 : 16,
          borderRadius: radius.card,
          borderWidth: 1,
          backgroundColor: unread ? colors.surface : colors.sunken,
          borderColor: unread ? colors.accentBorder : colors.border,
          ...(unread ? shadow(colors.accent, 0.1, 8, 22) : null),
        }}
      >
        {wide ? (
          <View style={{ width: 56, height: 56, borderRadius: 18, backgroundColor: c.bg, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="calendar-outline" size={24} color={c.ink} />
          </View>
        ) : null}
        <View style={{ flex: 1, gap: 8, minWidth: 0 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <CategoryPill category={s.category} />
            <T v="small" style={{ flex: 1 }} numberOfLines={1}>{dateLabel(s)}</T>
            {unread ? <View accessibilityLabel="Unread" style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: colors.accent }} /> : null}
          </View>
          <T v="h3" style={{ fontSize: wide ? 22 : 18, lineHeight: wide ? 26 : 22, color: unread ? colors.ink : colors.muted }}>{s.title}</T>
          {s.reasonForSuggestion ? <T v="muted" numberOfLines={2} style={{ fontSize: 14, lineHeight: 20 }}>{s.reasonForSuggestion}</T> : null}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingTop: 2 }}>
            <Button label="I'm in" onPress={onAccept} disabled={busy} icon={<Ionicons name="checkmark" size={15} color="#fff" />} style={{ height: 38, paddingHorizontal: 16 }} />
          </View>
        </View>
      </Pressable>
    </Link>
  );
}

export default function Inbox() {
  const wide = useIsWide();
  const { data, isLoading, error, refetch, isRefetching } = useNotifications();
  const feedback = useFeedback();
  const items = data ?? [];
  const fresh = items.filter((s) => !s.notificationRead);
  const earlier = items.filter((s) => s.notificationRead);

  const group = (title: string, list: Suggestion[]) =>
    list.length === 0 ? null : (
      <View style={{ gap: 12 }}>
        <T v="label">{title}</T>
        {list.map((s) => (
          <Item key={s.id} s={s} wide={wide} busy={feedback.isPending} onAccept={() => feedback.mutate({ id: s.id, status: 'ACCEPTED' })} />
        ))}
      </View>
    );

  return (
    <Screen onRefresh={() => void refetch()} refreshing={isRefetching}>
      <View>
        <T v="label" style={{ color: colors.accent }}>NOTIFICATIONS</T>
        <T v="h1" style={wide ? { fontSize: 44, lineHeight: 48 } : undefined}>Inbox</T>
        {items.length > 0 ? (
          <T v="muted" style={{ fontFamily: fonts.body }}>
            {fresh.length === 0 ? 'Nothing unread' : `${fresh.length} unread idea${fresh.length === 1 ? '' : 's'} waiting for an answer`}
          </T>
        ) : null}
      </View>
      <ErrorBanner message={(error as Error | null)?.message ?? feedback.error?.message} />
      {isLoading ? <ActivityIndicator color={colors.accent} /> : null}
      {group('NEW', fresh)}
      {group('EARLIER', earlier)}
      {!isLoading && items.length === 0 ? <EmptyState title="You're all caught up" hint="New suggestions appear here until you act on them." /> : null}
    </Screen>
  );
}
