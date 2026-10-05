import { Link } from 'expo-router';
import { View } from 'react-native';

import { useProfile, useRate, useSuggestions, useUpdateProfile } from '@/api/hooks';
import { StarRating } from './star-rating';
import { Card, Toggle, T } from './ui';
import { dayName, dayOfMonth, shortDate, toIso } from '@/lib/dates';
import { planGroups, SCHEDULE } from '@/lib/suggestions';
import { categoryColors, colors, fonts } from '@/theme/tokens';

/** Right-hand column of the web Today screen: schedule, coming up, rating prompt, learned profile. */
export function SideCards() {
  const profile = useProfile().data;
  const update = useUpdateProfile();
  const rate = useRate();
  const groups = planGroups(useSuggestions().data ?? [], toIso(new Date()));
  const toRate = groups.toRate[0];
  const paused = profile?.pausedCategories ?? [];
  const on = !!profile && !profile.vacationMode;

  return (
    <View style={{ gap: 16 }}>
      <View style={{ backgroundColor: colors.ink, borderRadius: 20, padding: 22, gap: 14 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <T v="h3" style={{ color: '#fff' }}>{on ? 'Suggestions are on' : 'Suggestions are paused'}</T>
          <Toggle onInk label={`Suggestions ${on ? 'on' : 'off'}`} value={on} disabled={!profile || update.isPending} onValueChange={(v) => update.mutate({ vacationMode: !v })} />
        </View>
        {(Object.keys(SCHEDULE) as (keyof typeof SCHEDULE)[]).map((c) => (
          <View key={c} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <T style={{ color: colors.onInkMuted }}>{SCHEDULE[c].title}</T>
            <T style={{ color: '#fff', fontFamily: fonts.medium }}>{paused.includes(c) ? 'Paused' : SCHEDULE[c].summary}</T>
          </View>
        ))}
        <Link href="/profile"><T style={{ color: '#fff', fontFamily: fonts.medium }}>{on ? 'Going away? Turn on vacation mode' : 'Vacation mode is on'}</T></Link>
      </View>

      <Card>
        <T v="h3" style={{ marginBottom: 14 }}>Coming up</T>
        {groups.upcoming.length === 0 ? (
          <T v="muted">Nothing planned yet. Say “I’m in” to a suggestion.</T>
        ) : (
          <View style={{ gap: 12 }}>
            {groups.upcoming.slice(0, 3).map((s) => (
              <Link key={s.id} href={{ pathname: '/suggestion/[id]', params: { id: s.id } }}>
                <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
                  <View style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: categoryColors[s.category].bg, alignItems: 'center', justifyContent: 'center' }}>
                    {s.suggestedDate ? (
                      <>
                        <T style={{ fontFamily: fonts.bold, fontSize: 11, color: categoryColors[s.category].ink }}>{dayName(s.suggestedDate).toUpperCase()}</T>
                        <T style={{ fontFamily: fonts.bold, fontSize: 18, color: categoryColors[s.category].ink }}>{dayOfMonth(s.suggestedDate)}</T>
                      </>
                    ) : <T>•</T>}
                  </View>
                  <View style={{ flex: 1 }}>
                    <T v="strong" numberOfLines={1}>{s.title}</T>
                    {s.location ? <T v="small" numberOfLines={1}>{s.location}</T> : null}
                  </View>
                </View>
              </Link>
            ))}
          </View>
        )}
        <Link href="/plans" style={{ marginTop: 14 }}><T style={{ fontFamily: fonts.medium }}>All plans →</T></Link>
      </Card>

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
        {profile?.responsesUntilRefresh != null ? (
          <>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <T v="small">Next refresh</T>
              <T v="small">{5 - profile.responsesUntilRefresh} of 5 responses</T>
            </View>
            <View style={{ height: 8, borderRadius: 4, backgroundColor: colors.track, overflow: 'hidden' }}>
              <View style={{ width: `${((5 - profile.responsesUntilRefresh) / 5) * 100}%`, height: '100%', backgroundColor: colors.accent }} />
            </View>
          </>
        ) : null}
      </Card>
    </View>
  );
}
