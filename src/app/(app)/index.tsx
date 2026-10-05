import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { useFeedback, useProfile, useSuggestions } from '@/api/hooks';
import type { Suggestion, SuggestionCategory } from '@/api/types';
import { SideCards } from '@/components/side-cards';
import { Screen } from '@/components/screen';
import { SuggestionCard } from '@/components/suggestion-card';
import { Button, Chip, EmptyState, ErrorBanner, T } from '@/components/ui';
import { useGenerateNow } from '@/hooks/use-generate-now';
import { useIsWide } from '@/hooks/use-is-wide';
import { shortDate, toIso } from '@/lib/dates';
import { countByCategory, feedItems, nextSnoozeEnd, snoozedItems } from '@/lib/suggestions';
import { colors, doneColors } from '@/theme/tokens';

type Filter = 'ALL' | SuggestionCategory;

export default function Today() {
  const wide = useIsWide();
  const router = useRouter();
  const profile = useProfile().data;
  const { data, isLoading, error, refetch, isRefetching } = useSuggestions();
  const feedback = useFeedback();
  const gen = useGenerateNow();
  const [filter, setFilter] = useState<Filter>('ALL');
  // Items acted on in this session stay visible with their outcome so the user sees what happened.
  const [done, setDone] = useState<Record<number, keyof typeof doneColors>>({});

  const today = toIso(new Date());
  const all = useMemo(() => data ?? [], [data]);
  const pending = useMemo(() => feedItems(all, today), [all, today]);
  const items = useMemo(
    () => [...pending, ...all.filter((s) => done[s.id] && !pending.some((p) => p.id === s.id))],
    [pending, all, done],
  );
  const counts = countByCategory(pending);
  const snoozed = snoozedItems(all, today);
  const snoozeEnd = nextSnoozeEnd(snoozed);
  const visible = items.filter((s) => filter === 'ALL' || s.category === filter);

  const act = (s: Suggestion, status: keyof typeof doneColors) =>
    feedback.mutate({ id: s.id, status }, { onSuccess: () => setDone((d) => ({ ...d, [s.id]: status })) });

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const name = profile?.firstName ?? '';

  const feed = (
    <View style={{ flex: wide ? 999 : undefined, minWidth: 0, gap: 20 }}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-end', gap: 12 }}>
        <View style={{ flexShrink: 1 }}>
          <T v="small">{shortDate(today)}</T>
          <T v="h1" style={wide ? { fontSize: 44, lineHeight: 46 } : undefined}>
            {greeting}{name ? `, ${name}` : ''}.{'\n'}
            {pending.length === 0 ? 'Nothing new yet.' : `${pending.length} new idea${pending.length === 1 ? '' : 's'} for you.`}
          </T>
        </View>
        {snoozed.length > 0 && snoozeEnd ? (
          <View style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 }}>
            <T v="small">{snoozed.length} snoozed until {shortDate(snoozeEnd)}</T>
          </View>
        ) : null}
      </View>

      <View accessibilityLabel="Filter by category" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        <Chip label={`All · ${counts.ALL}`} selected={filter === 'ALL'} onPress={() => setFilter('ALL')} />
        <Chip label={`Daily · ${counts.DAILY}`} selected={filter === 'DAILY'} onPress={() => setFilter('DAILY')} />
        <Chip label={`Weekend · ${counts.WEEKEND}`} selected={filter === 'WEEKEND'} onPress={() => setFilter('WEEKEND')} />
        <Chip label={`Monthly · ${counts.MONTHLY}`} selected={filter === 'MONTHLY'} onPress={() => setFilter('MONTHLY')} />
      </View>

      <ErrorBanner message={(error as Error | null)?.message ?? feedback.error?.message ?? gen.error} />
      {gen.pending ? (
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
          <ActivityIndicator color={colors.accent} />
          <T v="muted">Finding ideas for you… this can take a little while.</T>
        </View>
      ) : null}

      {isLoading ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: 32 }} />
      ) : visible.length === 0 ? (
        <EmptyState
          title={profile?.vacationMode ? 'Vacation mode is on' : 'Nothing in this category today.'}
          hint={profile?.vacationMode ? 'Turn it off in your profile to get suggestions again.' : 'Ask for fresh ideas any time.'}
          action={<Button label="Generate now" variant="secondary" onPress={gen.run} loading={gen.pending} disabled={gen.disabled} />}
        />
      ) : (
        visible.map((s) => {
          const outcome = done[s.id];
          if (outcome) {
            const c = doneColors[outcome];
            return (
              <View key={s.id} style={{ backgroundColor: c.bg, borderRadius: 20, padding: 20, gap: 4 }}>
                <T v="strong" style={{ color: c.ink }}>{s.title}</T>
                <T style={{ color: c.ink }}>{c.text}</T>
              </View>
            );
          }
          return (
            <SuggestionCard
              key={s.id}
              suggestion={s}
              busy={feedback.isPending}
              onAccept={() => act(s, 'ACCEPTED')}
              onWishlist={() => act(s, 'WISHLIST')}
              onReject={() => act(s, 'REJECTED')}
              onSnooze={() => router.push({ pathname: '/suggestion/[id]', params: { id: s.id } })}
            />
          );
        })
      )}
    </View>
  );

  return (
    <Screen onRefresh={() => void refetch()} refreshing={isRefetching}>
      {wide ? (
        <View style={{ flexDirection: 'row', gap: 32, alignItems: 'flex-start' }}>
          {feed}
          <View style={{ flex: 1, minWidth: 320, maxWidth: 420 }}>
            <SideCards />
          </View>
        </View>
      ) : (
        feed
      )}
    </Screen>
  );
}
