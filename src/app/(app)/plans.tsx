import { Link } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';

import { usePlan, useRate, useSuggestions } from '@/api/hooks';
import type { Suggestion } from '@/api/types';
import { Screen } from '@/components/screen';
import { StarRating } from '@/components/star-rating';
import { CategoryPill, DateStub } from '@/components/suggestion-card';
import { Button, Card, EmptyState, ErrorBanner, Field, T } from '@/components/ui';
import { isValidIso, shortDate, toIso } from '@/lib/dates';
import { metaLine, planGroups } from '@/lib/suggestions';
import { colors, fonts } from '@/theme/tokens';

type Tab = 'upcoming' | 'wishlist' | 'past';

function PlanRow({ s }: { s: Suggestion }) {
  return (
    <Link href={{ pathname: '/suggestion/[id]', params: { id: s.id } }} asChild>
      <Pressable accessibilityRole="link" style={{ flexDirection: 'row', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 20 }}>
        <DateStub suggestion={s} compact />
        <View style={{ flex: 1, padding: 16, gap: 4, minWidth: 0 }}>
          <T v="strong" numberOfLines={2}>{s.title}</T>
          {metaLine(s) ? <T v="small" numberOfLines={1}>{metaLine(s)}</T> : null}
          {s.rating ? <T v="small">{'★'.repeat(s.rating)}{'☆'.repeat(5 - s.rating)}</T> : null}
        </View>
      </Pressable>
    </Link>
  );
}

function WishlistRow({ s }: { s: Suggestion }) {
  const plan = usePlan();
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState('');
  const valid = date === '' || (isValidIso(date) && date > toIso(new Date()));
  return (
    <Card style={{ gap: 10 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <CategoryPill category={s.category} />
        {s.respondedAt ? <T v="small">Saved {shortDate(s.respondedAt.slice(0, 10))}</T> : null}
      </View>
      <Link href={{ pathname: '/suggestion/[id]', params: { id: s.id } }}><T v="h3">{s.title}</T></Link>
      {open ? (
        <>
          <Field label="Target date (YYYY-MM-DD, optional)" value={date} onChangeText={setDate} autoCapitalize="none" placeholder={toIso(new Date())} error={valid ? undefined : 'Enter a valid date in the future'} />
          <ErrorBanner message={plan.error?.message} />
          <Button label="Add to plans" onPress={() => plan.mutate({ id: s.id, targetDate: date || null })} loading={plan.isPending} disabled={!valid} />
        </>
      ) : (
        <Button label="Plan it — pick a date" variant="secondary" onPress={() => setOpen(true)} />
      )}
    </Card>
  );
}

export default function Plans() {
  const { data, isLoading, error, refetch, isRefetching } = useSuggestions();
  const rate = useRate();
  const [tab, setTab] = useState<Tab>('upcoming');
  const groups = planGroups(data ?? []);

  const tabs: [Tab, string][] = [
    ['upcoming', 'Upcoming'],
    ['wishlist', `Wishlist${groups.wishlist.length ? ` · ${groups.wishlist.length}` : ''}`],
    ['past', 'Past'],
  ];

  return (
    <Screen onRefresh={() => void refetch()} refreshing={isRefetching}>
      <T v="h1">Plans</T>
      <View accessibilityRole="tablist" style={{ flexDirection: 'row', backgroundColor: colors.track, borderRadius: 999, padding: 4, alignSelf: 'flex-start' }}>
        {tabs.map(([key, label]) => (
          <Pressable key={key} accessibilityRole="tab" accessibilityState={{ selected: tab === key }} onPress={() => setTab(key)} style={{ paddingHorizontal: 16, minHeight: 40, justifyContent: 'center', borderRadius: 999, backgroundColor: tab === key ? colors.surface : 'transparent' }}>
            <T style={{ fontFamily: tab === key ? fonts.bold : fonts.medium }}>{label}</T>
          </Pressable>
        ))}
      </View>

      <ErrorBanner message={(error as Error | null)?.message ?? rate.error?.message} />
      {isLoading ? <ActivityIndicator color={colors.accent} /> : null}

      {tab === 'upcoming' ? (
        <View style={{ gap: 12 }}>
          {groups.toRate.map((s) => (
            <Card key={s.id} style={{ gap: 8 }}>
              <T v="label">HOW WAS IT?</T>
              <T v="h3">{s.title}</T>
              <T v="muted">{s.suggestedDate ? shortDate(s.suggestedDate) : ''} · your rating shapes future picks</T>
              <StarRating value={s.rating} disabled={rate.isPending} onChange={(n) => rate.mutate({ id: s.id, rating: n })} />
            </Card>
          ))}
          {groups.upcoming.length > 0 ? <T v="label">COMING UP</T> : null}
          {groups.upcoming.map((s) => <PlanRow key={s.id} s={s} />)}
          {!isLoading && groups.upcoming.length === 0 && groups.toRate.length === 0 ? (
            <EmptyState title="Nothing planned yet" hint={'Say "I\'m in" to a suggestion and it shows up here.'} />
          ) : null}
        </View>
      ) : null}

      {tab === 'wishlist' ? (
        <View style={{ gap: 12 }}>
          {groups.wishlist.map((s) => <WishlistRow key={s.id} s={s} />)}
          {!isLoading && groups.wishlist.length === 0 ? <EmptyState title="Your wishlist is empty" hint="Tap “Save for later” on ideas you like but can't do yet." /> : null}
        </View>
      ) : null}

      {tab === 'past' ? (
        <View style={{ gap: 12 }}>
          {groups.past.map((s) => <PlanRow key={s.id} s={s} />)}
          {!isLoading && groups.past.length === 0 ? <EmptyState title="No past plans rated yet" hint="Rate plans after their date and they'll be listed here." /> : null}
        </View>
      ) : null}
    </Screen>
  );
}
