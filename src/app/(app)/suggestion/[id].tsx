import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';

import { useFeedback, useMarkRead, usePlan, useRate, useSnooze, useSuggestion } from '@/api/hooks';
import { Screen } from '@/components/screen';
import { StarRating } from '@/components/star-rating';
import { CategoryPill } from '@/components/suggestion-card';
import { SnoozePanel } from '@/components/snooze-panel';
import { Button, Card, EmptyState, ErrorBanner, Field, T } from '@/components/ui';
import { useIsWide } from '@/hooks/use-is-wide';
import { isValidIso, shortDate, toIso } from '@/lib/dates';
import { canRate } from '@/lib/suggestions';
import { categoryColors, colors, doneColors, fonts } from '@/theme/tokens';

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
  const [planDate, setPlanDate] = useState('');

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
  const planValid = planDate === '' || (isValidIso(planDate) && planDate > today);

  const respond = (status: 'ACCEPTED' | 'WISHLIST' | 'REJECTED') =>
    feedback.mutate({ id: s.id, status, comment: note.trim() || undefined }, { onSuccess: back });

  const facts: [string, string | null][] = [
    ['WHEN', s.suggestedDate ? shortDate(s.suggestedDate) : 'Flexible'],
    ['WHERE', s.location],
    ['COST', s.estimatedCost],
  ];

  const main = (
    <View style={{ flex: wide ? 999 : undefined, minWidth: 0, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 24, overflow: 'hidden' }}>
      <View style={{ backgroundColor: c.bg, padding: wide ? 28 : 20, gap: 12, borderBottomWidth: 2, borderStyle: 'dashed', borderBottomColor: '#fff' }}>
        <CategoryPill category={s.category} />
        <T style={{ fontFamily: fonts.heading, fontSize: wide ? 56 : 40, lineHeight: wide ? 58 : 42, letterSpacing: -1.5, color: c.ink }}>
          {s.suggestedDate ? shortDate(s.suggestedDate) : 'Any day'}
        </T>
        <T style={{ color: c.ink, fontFamily: fonts.bold }}>Suggested {shortDate(s.createdAt.slice(0, 10))}</T>
      </View>

      <View style={{ padding: wide ? 32 : 20, gap: 20 }}>
        <T v="h1" style={wide ? { fontSize: 40, lineHeight: 43 } : undefined}>{s.title}</T>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
          {facts.filter(([, v]) => v).map(([k, v]) => (
            <View key={k} style={{ flexGrow: 1, flexBasis: 150, backgroundColor: colors.sunken, borderRadius: 14, padding: 14 }}>
              <T v="label">{k}</T>
              <T style={{ fontFamily: fonts.medium }}>{v}</T>
            </View>
          ))}
        </View>

        {s.description ? <T style={{ fontSize: 17, lineHeight: 26 }}>{s.description}</T> : null}

        {s.reasonForSuggestion ? (
          <View style={{ borderWidth: 1, borderColor: colors.accentBorder, backgroundColor: colors.accentSoft, borderRadius: 16, padding: 16, gap: 6 }}>
            <T v="label" style={{ color: c.ink }}>WHY WE SUGGESTED THIS</T>
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
              style={{ minHeight: 80 }}
            />
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              <Button large label="I'm in — add to plans" onPress={() => respond('ACCEPTED')} loading={feedback.isPending} />
              <Button large variant="secondary" label="Save to wishlist" onPress={() => respond('WISHLIST')} disabled={feedback.isPending} />
              <Button large variant="ghost" label="Not for me" onPress={() => respond('REJECTED')} disabled={feedback.isPending} />
            </View>
          </>
        ) : (
          <View style={{ gap: 14 }}>
            <View style={{ backgroundColor: outcome!.bg, borderRadius: 14, padding: 14 }}>
              <T v="strong" style={{ color: outcome!.ink }}>{outcome!.text}</T>
              {s.feedbackComment ? <T style={{ color: outcome!.ink }}>“{s.feedbackComment}”</T> : null}
            </View>
            {s.status === 'WISHLIST' ? (
              <View style={{ gap: 10 }}>
                <Field label="Plan it for (YYYY-MM-DD, optional)" value={planDate} onChangeText={setPlanDate} autoCapitalize="none" placeholder={today} error={planValid ? undefined : 'Enter a valid date in the future'} />
                <Button label="Plan it" onPress={() => plan.mutate({ id: s.id, targetDate: planDate || null })} loading={plan.isPending} disabled={!planValid} />
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
    <View style={{ flex: wide ? 1 : undefined, minWidth: wide ? 320 : 0, gap: 16 }}>
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
      {wide ? (
        <>
          <Card style={{ gap: 14 }}>
            <T v="h3">What happens next</T>
            {[
              ["I'm in", 'puts it in Plans. After the date, you can rate it 1–5 stars.'],
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
          <View style={{ backgroundColor: colors.sunken, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.borderInput, borderRadius: 20, padding: 18, flexDirection: 'row', gap: 12, alignItems: 'center' }}>
            <Ionicons name="calendar-outline" size={20} color={colors.muted} />
            <T v="muted"><T v="strong">Add to calendar (.ics)</T> · coming soon</T>
          </View>
        </>
      ) : null}
    </View>
  );

  return (
    <Screen>
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
  );
}
