import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';

import { usePlan, useRate, useSuggestions } from '@/api/hooks';
import type { Suggestion } from '@/api/types';
import { MonthHeader } from '@/components/calendar-cards';
import { MonthGrid } from '@/components/month-grid';
import { Screen } from '@/components/screen';
import { StarRating } from '@/components/star-rating';
import { CategoryPill, DateStub } from '@/components/suggestion-card';
import { Button, Card, EmptyState, ErrorBanner, Hero, T } from '@/components/ui';
import { useIsWide } from '@/hooks/use-is-wide';
import { shiftMonth } from '@/lib/calendar';
import { addDays, fromIso, shortDate, toIso } from '@/lib/dates';
import { metaLine, planGroups } from '@/lib/suggestions';
import { colors, fonts, gradientStops, radius } from '@/theme/tokens';

type Tab = 'upcoming' | 'wishlist' | 'past';

function PlanRow({ s }: { s: Suggestion }) {
  const meta = metaLine(s);
  return (
    <Link href={{ pathname: '/suggestion/[id]', params: { id: s.id } }} asChild>
      <Pressable accessibilityRole="link" accessibilityLabel={`Open ${s.title}`} style={{ flexDirection: 'row', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.card, overflow: 'hidden' }}>
        <DateStub suggestion={s} compact />
        <View style={{ flex: 1, padding: 16, gap: 6, minWidth: 0 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <CategoryPill category={s.category} />
            {s.status === 'ACCEPTED' && !s.rating ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: colors.successSoft, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4 }}>
                <Ionicons name="calendar-outline" size={12} color={colors.success} />
                <T style={{ fontFamily: fonts.bold, fontSize: 11, color: colors.success }}>In your calendar</T>
              </View>
            ) : null}
          </View>
          <T v="h3" numberOfLines={2}>{s.title}</T>
          {meta ? <T v="small" numberOfLines={1}>{meta}</T> : null}
          {s.rating ? (
            <T style={{ color: colors.amber, fontSize: 15 }}>{'★'.repeat(s.rating)}<T style={{ color: colors.subtle }}>{'☆'.repeat(5 - s.rating)}</T></T>
          ) : null}
        </View>
      </Pressable>
    </Link>
  );
}

function WishlistRow({ s }: { s: Suggestion }) {
  const plan = usePlan();
  const today = toIso(new Date());
  const tomorrow = toIso(addDays(new Date(), 1));
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState<string | null>(null);
  const [ym, setYm] = useState(() => ({ year: fromIso(today).getFullYear(), month: fromIso(today).getMonth() }));
  return (
    <Card style={{ gap: 12 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <CategoryPill category={s.category} />
        {s.respondedAt ? <T v="small">Saved {shortDate(s.respondedAt.slice(0, 10))}</T> : null}
      </View>
      <Link href={{ pathname: '/suggestion/[id]', params: { id: s.id } }}><T v="h3">{s.title}</T></Link>
      {open ? (
        <>
          <T v="label" style={{ color: colors.accent }}>PICK A TARGET DATE (OPTIONAL)</T>
          <View style={{ backgroundColor: colors.sunken, borderWidth: 1, borderColor: colors.border, borderRadius: 20, padding: 12, gap: 6 }}>
            <MonthHeader year={ym.year} month={ym.month} size={17} onShift={(d) => setYm((v) => shiftMonth(v.year, v.month, d))} />
            <MonthGrid year={ym.year} month={ym.month} today={today} minDate={tomorrow} selected={date} onSelect={(iso) => setDate((cur) => (cur === iso ? null : iso))} cellHeight={38} />
          </View>
          <ErrorBanner message={plan.error?.message} />
          <Button label={date ? `Add to plans · ${shortDate(date)}` : 'Add to plans'} onPress={() => plan.mutate({ id: s.id, targetDate: date })} loading={plan.isPending} />
        </>
      ) : (
        <Button label="Plan it — pick a date" variant="secondary" onPress={() => setOpen(true)} icon={<Ionicons name="calendar-outline" size={16} color={colors.ink} />} />
      )}
    </Card>
  );
}

function RateCard({ s, busy, onRate }: { s: Suggestion; busy: boolean; onRate: (n: number) => void }) {
  return (
    <Hero stops={gradientStops.warm} style={{ padding: 22, gap: 10, borderRadius: 28, borderWidth: 1, borderColor: colors.accentBorder, shadowOpacity: 0 }}>
      <T v="label" style={{ color: colors.accent }}>HOW WAS IT?</T>
      <T v="h2">{s.title}</T>
      <T v="muted">{s.suggestedDate ? shortDate(s.suggestedDate) : ''} · your rating shapes future picks</T>
      <StarRating value={s.rating} disabled={busy} onChange={onRate} />
    </Hero>
  );
}

export default function Plans() {
  const wide = useIsWide();
  const { data, isLoading, error, refetch, isRefetching } = useSuggestions();
  const rate = useRate();
  const [tab, setTab] = useState<Tab>('upcoming');
  const today = toIso(new Date());
  const all = useMemo(() => data ?? [], [data]);
  const groups = planGroups(all, today);

  const tabs: [Tab, string][] = [
    ['upcoming', 'Upcoming'],
    ['wishlist', `Wishlist${groups.wishlist.length ? ` · ${groups.wishlist.length}` : ''}`],
    ['past', 'Past'],
  ];

  const upcoming = (
    <View style={{ gap: 12 }}>
      {groups.toRate.map((s) => (
        <RateCard key={s.id} s={s} busy={rate.isPending} onRate={(n) => rate.mutate({ id: s.id, rating: n })} />
      ))}
      {groups.upcoming.length > 0 ? <T v="label">COMING UP</T> : null}
      {groups.upcoming.map((s) => <PlanRow key={s.id} s={s} />)}
      {!isLoading && groups.upcoming.length === 0 && groups.toRate.length === 0 ? (
        <EmptyState title="Nothing planned yet" hint={'Say "I\'m in" to a suggestion and it shows up here.'} />
      ) : null}
    </View>
  );

  const wishlist = (
    <View style={{ gap: 12 }}>
      {groups.wishlist.map((s) => <WishlistRow key={s.id} s={s} />)}
      {!isLoading && groups.wishlist.length === 0 ? <EmptyState title="Your wishlist is empty" hint="Tap “Save for later” on ideas you like but can't do yet." /> : null}
    </View>
  );

  const past = (
    <View style={{ gap: 12 }}>
      {groups.past.map((s) => <PlanRow key={s.id} s={s} />)}
      {!isLoading && groups.past.length === 0 ? <EmptyState title="No past plans rated yet" hint="Rate plans after their date and they'll be listed here." /> : null}
    </View>
  );

  const side = wide && tab === 'upcoming' ? (
    <View style={{ width: 400, gap: 16 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <T v="h3">Wishlist</T>
        <T v="small">{groups.wishlist.length} saved</T>
      </View>
      {groups.wishlist.length === 0 ? <T v="muted">Ideas you save for later appear here.</T> : groups.wishlist.slice(0, 2).map((s) => <WishlistRow key={s.id} s={s} />)}
      {groups.past.length > 0 ? (
        <Card style={{ gap: 12 }}>
          <T v="h3">Recently rated</T>
          {groups.past.slice(0, 3).map((s) => (
            <View key={s.id} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <T v="strong" numberOfLines={1}>{s.title}</T>
                {s.suggestedDate ? <T v="small">{shortDate(s.suggestedDate)}</T> : null}
              </View>
              <T style={{ color: colors.amber }}>{'★'.repeat(s.rating ?? 0)}</T>
            </View>
          ))}
        </Card>
      ) : null}
    </View>
  ) : null;

  return (
    <Screen onRefresh={() => void refetch()} refreshing={isRefetching}>
      <View>
        <T v="label" style={{ color: colors.accent }}>YOUR PLANS</T>
        <T v="h1" style={wide ? { fontSize: 44, lineHeight: 48 } : undefined}>Plans</T>
        <T v="muted">{groups.upcoming.length} upcoming · {groups.wishlist.length} saved for later · {groups.past.length + groups.toRate.length} past</T>
      </View>
      <View accessibilityRole="tablist" style={{ flexDirection: 'row', backgroundColor: colors.track, borderRadius: radius.pill, padding: 4, alignSelf: 'flex-start' }}>
        {tabs.map(([key, label]) => (
          <Pressable key={key} accessibilityRole="tab" accessibilityState={{ selected: tab === key }} onPress={() => setTab(key)} style={{ paddingHorizontal: 18, minHeight: 40, justifyContent: 'center', borderRadius: radius.pill, backgroundColor: tab === key ? colors.surface : 'transparent' }}>
            <T style={{ fontFamily: tab === key ? fonts.bold : fonts.medium }}>{label}</T>
          </Pressable>
        ))}
      </View>

      <ErrorBanner message={(error as Error | null)?.message ?? rate.error?.message} />
      {isLoading ? <ActivityIndicator color={colors.accent} /> : null}

      <View style={{ flexDirection: 'row', gap: 24, alignItems: 'flex-start' }}>
        <View style={{ flex: 1, minWidth: 0 }}>
          {tab === 'upcoming' ? upcoming : null}
          {tab === 'wishlist' ? wishlist : null}
          {tab === 'past' ? past : null}
        </View>
        {side}
      </View>
    </Screen>
  );
}
