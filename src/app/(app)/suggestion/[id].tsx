import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';

import { useFeedback, useMarkRead, usePlan, useRate, useSnooze, useSuggestion, useSuggestions } from '@/api/hooks';
import { MonthHeader } from '@/components/calendar-cards';
import { MonthGrid } from '@/components/month-grid';
import { Screen } from '@/components/screen';
import { StarRating } from '@/components/star-rating';
import { CategoryPill } from '@/components/suggestion-card';
import { SnoozePanel } from '@/components/snooze-panel';
import { Button, Card, EmptyState, ErrorBanner, Field, T } from '@/components/ui';
import { useIsWide } from '@/hooks/use-is-wide';
import { eventsByDate, shiftMonth } from '@/lib/calendar';
import { addDays, fromIso, shortDate, toIso } from '@/lib/dates';
import { canRate } from '@/lib/suggestions';
import { categoryColors, colors, doneColors, fonts, radius } from '@/theme/tokens';

export default function SuggestionRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  // Tabs keep this screen mounted between suggestions; keying by id resets the note and date fields.
  return <SuggestionDetail key={id} id={Number(id)} />;
}

function SuggestionDetail({ id }: { id: number }) {
  const router = useRouter();
  const wide = useIsWide();
  const s = useSuggestion(id);
  const feedback = useFeedback();
  const snoozeMut = useSnooze();
  const plan = usePlan();
  const rate = useRate();
  const markRead = useMarkRead();
  const [note, setNote] = useState('');
  const [planDate, setPlanDate] = useState<string | null>(null);
  const all = useSuggestions().data ?? [];
  const [ym, setYm] = useState(() => ({ year: new Date().getFullYear(), month: new Date().getMonth() }));

  // Opening a suggestion dismisses its notification badge.
  useEffect(() => {
    if (s && !s.notificationRead) markRead.mutate(s.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s?.id]);

  const back = () => (router.canGoBack() ? router.back() : router.replace('/'));

  if (!s) {
    return (
      <Screen>
        <EmptyState title="Suggestion not found" hint="It may have been removed." action={<Button label="Back to today" onPress={back} />} />
      </Screen>
    );
  }

  const c = categoryColors[s.category];
  const pending = s.status === 'PENDING';
  const outcome = s.status === 'PENDING' ? null : doneColors[s.status];
  const error = feedback.error?.message ?? snoozeMut.error?.message ?? plan.error?.message ?? rate.error?.message;
  const today = toIso(new Date());
  const tomorrow = toIso(addDays(new Date(), 1));

  const respond = (status: 'ACCEPTED' | 'WISHLIST' | 'REJECTED') =>
    feedback.mutate({ id: s.id, status, comment: note.trim() || undefined }, { onSuccess: back });

  const facts: [string, string | null, 'time-outline' | 'location-outline' | 'wallet-outline'][] = [
    ['WHEN', s.suggestedDate ? shortDate(s.suggestedDate) : 'Flexible', 'time-outline'],
    ['WHERE', s.location, 'location-outline'],
    ['COST', s.estimatedCost, 'wallet-outline'],
  ];

  // Other accepted plans on the suggested day and the day after, so the user can see whether it fits.
  const plans = eventsByDate(all, today);
  const fitDays = s.suggestedDate ? [s.suggestedDate, toIso(addDays(fromIso(s.suggestedDate), 1))] : [];
  const others = (iso: string) => (plans[iso] ?? []).filter((e) => e.status === 'ACCEPTED' && e.id !== s.id);

  const actions = (
    <>
      <Button large label="I'm in — add to plans" onPress={() => respond('ACCEPTED')} loading={feedback.isPending} icon={<Ionicons name="checkmark" size={18} color="#fff" />} />
      <Button large variant="secondary" label="Save to wishlist" onPress={() => respond('WISHLIST')} disabled={feedback.isPending} icon={<Ionicons name="bookmark-outline" size={18} color={colors.ink} />} />
      <Button large variant="ghost" label="Not for me" onPress={() => respond('REJECTED')} disabled={feedback.isPending} />
    </>
  );

  const main = (
    <View style={{ flex: wide ? 999 : undefined, minWidth: 0, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 28, overflow: 'hidden' }}>
      <View style={{ backgroundColor: c.bg, padding: wide ? 32 : 22, gap: 10, borderBottomWidth: 2, borderStyle: 'dashed', borderBottomColor: '#fff', overflow: 'hidden' }}>
        <View pointerEvents="none" style={{ position: 'absolute', right: -60, top: -80, width: 260, height: 260, borderRadius: 130, backgroundColor: c.dot, opacity: 0.12 }} />
        <CategoryPill category={s.category} />
        <T style={{ fontFamily: fonts.headingXL, fontSize: wide ? 64 : 44, lineHeight: wide ? 66 : 46, letterSpacing: -1.5, color: c.ink }}>
          {s.suggestedDate ? shortDate(s.suggestedDate) : 'Any day'}
        </T>
        <T style={{ color: c.ink, fontFamily: fonts.bold }}>Suggested {shortDate(s.createdAt.slice(0, 10))}</T>
      </View>

      <View style={{ padding: wide ? 32 : 20, gap: 20 }}>
        <T v="h1" style={wide ? { fontSize: 42, lineHeight: 46 } : undefined}>{s.title}</T>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
          {facts.filter(([, v]) => v).map(([k, v, icon]) => (
            <View key={k} style={{ flexGrow: 1, flexBasis: 150, backgroundColor: colors.sunken, borderWidth: 1, borderColor: colors.border, borderRadius: 18, padding: 14, gap: 4 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name={icon} size={13} color={colors.subtle} />
                <T v="label">{k}</T>
              </View>
              <T style={{ fontFamily: fonts.bold }}>{v}</T>
            </View>
          ))}
        </View>

        {s.description ? <T style={{ fontSize: 17, lineHeight: 26 }}>{s.description}</T> : null}

        {s.reasonForSuggestion ? (
          <View style={{ borderWidth: 1, borderColor: colors.accentBorder, backgroundColor: colors.accentSoft, borderRadius: 18, padding: 16, gap: 6 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="sparkles" size={13} color={colors.accent} />
              <T v="label" style={{ color: colors.accent }}>WHY WE SUGGESTED THIS</T>
            </View>
            <T>{s.reasonForSuggestion}</T>
          </View>
        ) : null}

        <ErrorBanner message={error} />

        {pending ? (
          <>
            <Field
              label="Add a note (optional, helps future picks)"
              value={note}
              onChangeText={setNote}
              multiline
              placeholder="e.g. Love this, but I'd rather do under 10 km"
              style={{ minHeight: 88 }}
            />
            {wide ? <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>{actions}</View> : null}
          </>
        ) : (
          <View style={{ gap: 14 }}>
            <View style={{ backgroundColor: outcome!.bg, borderRadius: 16, padding: 14 }}>
              <T v="strong" style={{ color: outcome!.ink }}>{outcome!.text}</T>
              {s.feedbackComment ? <T style={{ color: outcome!.ink }}>“{s.feedbackComment}”</T> : null}
            </View>
            {s.status === 'WISHLIST' ? (
              <View style={{ gap: 10 }}>
                <T v="label" style={{ color: colors.accent }}>PLAN IT FOR (OPTIONAL)</T>
                <View style={{ backgroundColor: colors.sunken, borderWidth: 1, borderColor: colors.border, borderRadius: 20, padding: 12, gap: 6 }}>
                  <MonthHeader year={ym.year} month={ym.month} size={17} onShift={(d) => setYm((v) => shiftMonth(v.year, v.month, d))} />
                  <MonthGrid year={ym.year} month={ym.month} today={today} minDate={tomorrow} selected={planDate} onSelect={(iso) => setPlanDate((cur) => (cur === iso ? null : iso))} cellHeight={38} />
                </View>
                <Button label={planDate ? `Plan it · ${shortDate(planDate)}` : 'Plan it'} onPress={() => plan.mutate({ id: s.id, targetDate: planDate })} loading={plan.isPending} />
              </View>
            ) : null}
            {s.status === 'ACCEPTED' ? (
              canRate(s, today) ? (
                <View style={{ gap: 8 }}>
                  <T v="strong">How was it?</T>
                  <StarRating value={s.rating} disabled={rate.isPending} onChange={(n) => rate.mutate({ id: s.id, rating: n })} />
                </View>
              ) : (
                <T v="muted">You can rate it after {s.suggestedDate ? shortDate(s.suggestedDate) : 'the day'}.</T>
              )
            ) : null}
          </View>
        )}
      </View>
    </View>
  );

  const side = (
    <View style={{ flex: wide ? 1 : undefined, minWidth: wide ? 320 : 0, maxWidth: wide ? 420 : undefined, gap: 20 }}>
      {pending ? (
        <Card style={{ gap: 12 }}>
          <T v="h3">Not now? Snooze it</T>
          <T v="muted">It leaves your feed and comes back on the day you pick. Nothing else changes.</T>
          <SnoozePanel
            error={snoozeMut.error?.message}
            busy={snoozeMut.isPending}
            onSnooze={(until) => snoozeMut.mutate({ id: s.id, until }, { onSuccess: back })}
          />
        </Card>
      ) : null}
      {fitDays.length > 0 ? (
        <Card style={{ gap: 12 }}>
          <T v="h3">Does it fit your calendar?</T>
          {fitDays.map((iso) => {
            const busy = others(iso);
            return (
              <View key={iso} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.sunken, borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 10 }}>
                <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: busy.length ? categoryColors.WEEKEND.bg : categoryColors.DAILY.bg, alignItems: 'center', justifyContent: 'center' }}>
                  <T style={{ fontFamily: fonts.headingXL, fontSize: 18, color: busy.length ? categoryColors.WEEKEND.ink : categoryColors.DAILY.ink }}>{fromIso(iso).getDate()}</T>
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <T v="strong">{shortDate(iso)}</T>
                  <T v="small" numberOfLines={1}>{busy.length ? busy.map((e) => e.title).join(', ') : iso === s.suggestedDate ? 'Free · this idea' : 'Free'}</T>
                </View>
              </View>
            );
          })}
        </Card>
      ) : null}
      {wide ? (
        <>
          <Card style={{ gap: 14 }}>
            <T v="h3">What happens next</T>
            {[
              ["I'm in", 'puts it in Plans and your calendar. After the date, you can rate it 1–5 stars.'],
              ['Wishlist', 'keeps it for later. Plan it any time with a new date.'],
              ['Not for me', 'tells us to suggest fewer like this.'],
            ].map(([k, v], i) => (
              <View key={k} style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: i === 0 ? colors.ink : colors.track, alignItems: 'center', justifyContent: 'center' }}>
                  <T style={{ fontFamily: fonts.bold, fontSize: 13, color: i === 0 ? '#fff' : colors.ink }}>{i + 1}</T>
                </View>
                <T style={{ flex: 1 }}><T v="strong">{k}</T> {v}</T>
              </View>
            ))}
          </Card>
          <View style={{ backgroundColor: colors.sunken, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.borderStrong, borderRadius: radius.card, padding: 18, flexDirection: 'row', gap: 12, alignItems: 'center' }}>
            <Ionicons name="calendar-outline" size={20} color={colors.muted} />
            <T v="muted"><T v="strong">Add to calendar (.ics)</T> · coming soon</T>
          </View>
        </>
      ) : null}
    </View>
  );

  const stickyBar = pending && !wide;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Screen style={stickyBar ? { paddingBottom: 120 } : undefined}>
        <Pressable accessibilityRole="link" accessibilityLabel="Back to today" onPress={back} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 44 }}>
          <Ionicons name="arrow-back" size={18} color={colors.ink} />
          <T style={{ fontFamily: fonts.medium }}>Back</T>
        </Pressable>
        {wide ? (
          <View style={{ flexDirection: 'row', gap: 32, alignItems: 'flex-start' }}>{main}{side}</View>
        ) : (
          <>{main}{side}</>
        )}
        {feedback.isPending ? <ActivityIndicator color={colors.accent} /> : null}
      </Screen>
      {stickyBar ? (
        <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', gap: 8, padding: 12, backgroundColor: 'rgba(255,255,255,0.96)', borderTopWidth: 1, borderTopColor: colors.border }}>
          <Button label="I'm in" onPress={() => respond('ACCEPTED')} loading={feedback.isPending} style={{ flex: 1, minWidth: 96, paddingHorizontal: 14 }} icon={<Ionicons name="checkmark" size={16} color="#fff" />} />
          <Button label="Save" variant="secondary" onPress={() => respond('WISHLIST')} disabled={feedback.isPending} style={{ paddingHorizontal: 14 }} icon={<Ionicons name="bookmark-outline" size={16} color={colors.ink} />} />
          <Button label="Not for me" variant="ghost" onPress={() => respond('REJECTED')} disabled={feedback.isPending} style={{ paddingHorizontal: 10 }} />
        </View>
      ) : null}
    </View>
  );
}
