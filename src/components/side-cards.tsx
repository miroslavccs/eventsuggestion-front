import { Link } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { useProfile, useRate, useSuggestions, useUpdateProfile } from '@/api/hooks';
import { MonthHeader } from './calendar-cards';
import { MonthGrid } from './month-grid';
import { StarRating } from './star-rating';
import { Card, Hero, Toggle, T } from './ui';
import { eventsByDate, shiftMonth } from '@/lib/calendar';
import { dayName, dayOfMonth, fromIso, shortDate, toIso } from '@/lib/dates';
import { planGroups, SCHEDULE } from '@/lib/suggestions';
import { categoryColors, colors, fonts, gradient, gradientStops } from '@/theme/tokens';

/** Right-hand column of the web Today screen: calendar, coming up, schedule, rating prompt, learned profile. */
export function SideCards() {
  const profile = useProfile().data;
  const update = useUpdateProfile();
  const rate = useRate();
  const all = useSuggestions().data ?? [];
  const today = toIso(new Date());
  const groups = planGroups(all, today);
  const events = eventsByDate(all, today);
  const [ym, setYm] = useState(() => ({ year: fromIso(today).getFullYear(), month: fromIso(today).getMonth() }));
  const toRate = groups.toRate[0];
  const paused = profile?.pausedCategories ?? [];
  const on = !!profile && !profile.vacationMode;
  const doneResponses = profile?.responsesUntilRefresh != null ? 5 - profile.responsesUntilRefresh : null;

  return (
    <View style={{ gap: 20 }}>
      <Card style={{ gap: 10 }}>
        <MonthHeader year={ym.year} month={ym.month} onShift={(d) => setYm((v) => shiftMonth(v.year, v.month, d))} />
        <MonthGrid year={ym.year} month={ym.month} today={today} events={events} />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14, paddingTop: 4 }}>
          {(['DAILY', 'WEEKEND', 'MONTHLY'] as const).map((k) => (
            <View key={k} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: categoryColors[k].dot }} />
              <T v="small" style={{ fontSize: 12 }}>{categoryColors[k].label}</T>
            </View>
          ))}
        </View>
      </Card>

      <Card>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <T v="h3">Coming up</T>
          <Link href="/plans"><T style={{ fontFamily: fonts.bold, fontSize: 13, color: colors.accent }}>All plans →</T></Link>
        </View>
        {groups.upcoming.length === 0 ? (
          <T v="muted">Nothing planned yet. Say “I’m in” to a suggestion.</T>
        ) : (
          <View style={{ gap: 12 }}>
            {groups.upcoming.slice(0, 3).map((s) => {
              const c = categoryColors[s.category];
              return (
                <Link key={s.id} href={{ pathname: '/suggestion/[id]', params: { id: s.id } }} asChild>
                  <Pressable accessibilityRole="link" accessibilityLabel={`Open ${s.title}`} style={{ flexDirection: 'row', gap: 14, alignItems: 'center' }}>
                    <View style={{ width: 52, height: 52, borderRadius: 16, backgroundColor: c.bg, alignItems: 'center', justifyContent: 'center' }}>
                      {s.suggestedDate ? (
                        <>
                          <T style={{ fontFamily: fonts.bold, fontSize: 10, letterSpacing: 1, color: c.ink }}>{dayName(s.suggestedDate).toUpperCase()}</T>
                          <T style={{ fontFamily: fonts.headingXL, fontSize: 20, lineHeight: 22, color: c.ink }}>{dayOfMonth(s.suggestedDate)}</T>
                        </>
                      ) : <T>•</T>}
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <T v="strong" numberOfLines={1}>{s.title}</T>
                      {s.location ? <T v="small" numberOfLines={1}>{s.location}</T> : null}
                    </View>
                  </Pressable>
                </Link>
              );
            })}
          </View>
        )}
      </Card>

      <Hero stops={gradientStops.night} style={{ padding: 22, gap: 14, borderRadius: 24 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <T v="h3" style={{ color: '#fff' }}>{on ? 'Suggestions are on' : 'Suggestions are paused'}</T>
          <Toggle onInk label={`Suggestions ${on ? 'on' : 'off'}`} value={on} disabled={!profile || update.isPending} onValueChange={(v) => update.mutate({ vacationMode: !v })} />
        </View>
        {(Object.keys(SCHEDULE) as (keyof typeof SCHEDULE)[]).map((c) => (
          <View key={c} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: categoryColors[c].dot }} />
              <T style={{ color: colors.onInkMuted }}>{SCHEDULE[c].title}</T>
            </View>
            <T style={{ color: '#fff', fontFamily: fonts.medium }}>{paused.includes(c) ? 'Paused' : SCHEDULE[c].summary}</T>
          </View>
        ))}
        <Link href="/profile"><T style={{ color: '#fff', fontFamily: fonts.medium }}>{on ? 'Going away? Turn on vacation mode' : 'Vacation mode is on'}</T></Link>
      </Hero>

      {toRate ? (
        <Card style={{ gap: 8 }}>
          <T v="h3">How was it?</T>
          <T v="muted">{toRate.title}{toRate.suggestedDate ? ` · ${shortDate(toRate.suggestedDate)}` : ''}</T>
          <StarRating value={toRate.rating} disabled={rate.isPending} onChange={(n) => rate.mutate({ id: toRate.id, rating: n })} />
        </Card>
      ) : null}

      <Card style={{ gap: 8 }}>
        <T v="h3">What we’ve learned</T>
        <T>{profile?.learnedProfile || "We're still getting to know you. Respond to a few suggestions and we'll summarise your taste here."}</T>
        {doneResponses != null ? (
          <>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <T v="small">Next refresh</T>
              <T v="small">{doneResponses} of 5 responses</T>
            </View>
            <View style={{ height: 8, borderRadius: 4, backgroundColor: colors.track, overflow: 'hidden' }}>
              <View style={[{ width: `${(doneResponses / 5) * 100}%`, height: '100%' }, gradient(gradientStops.brand)]} />
            </View>
          </>
        ) : null}
      </Card>
    </View>
  );
}
