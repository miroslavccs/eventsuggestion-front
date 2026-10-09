import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';

import { useSuggestions } from '@/api/hooks';
import { DayAgenda, FreeTimeCard, MonthArrows } from '@/components/calendar-cards';
import { MonthGrid } from '@/components/month-grid';
import { Screen } from '@/components/screen';
import { CategoryPill } from '@/components/suggestion-card';
import { Card, EmptyState, ErrorBanner, T } from '@/components/ui';
import { useIsWide } from '@/hooks/use-is-wide';
import { eventsByDate, freeTime, monthTitle, shiftMonth } from '@/lib/calendar';
import { fromIso, shortDate, toIso } from '@/lib/dates';
import { categoryColors, colors, fonts, radius } from '@/theme/tokens';

type View_ = 'month' | 'list';

export default function CalendarScreen() {
  const wide = useIsWide();
  const { data, isLoading, error, refetch, isRefetching } = useSuggestions();
  const today = toIso(new Date());
  const [ym, setYm] = useState(() => ({ year: fromIso(today).getFullYear(), month: fromIso(today).getMonth() }));
  const [selected, setSelected] = useState(today);
  const [view, setView] = useState<View_>('month');

  const all = useMemo(() => data ?? [], [data]);
  const events = useMemo(() => eventsByDate(all, today), [all, today]);
  const free = useMemo(() => freeTime(all, today), [all, today]);

  const prefix = `${ym.year}-${String(ym.month + 1).padStart(2, '0')}-`;
  const monthList = Object.keys(events)
    .filter((iso) => iso.startsWith(prefix))
    .sort();

  const shift = (delta: number) => {
    const next = shiftMonth(ym.year, ym.month, delta);
    setYm(next);
    // Keep the agenda on a day that is visible: today when we come back to this month, else the 1st.
    const sameAsToday = fromIso(today).getFullYear() === next.year && fromIso(today).getMonth() === next.month;
    setSelected(sameAsToday ? today : toIso(new Date(next.year, next.month, 1)));
  };

  const toggle = (
    <View accessibilityRole="tablist" style={{ flexDirection: 'row', backgroundColor: colors.track, borderRadius: radius.pill, padding: 4, alignSelf: 'flex-start' }}>
      {([['month', 'Month'], ['list', 'List']] as const).map(([key, label]) => (
        <Pressable
          key={key}
          accessibilityRole="tab"
          accessibilityState={{ selected: view === key }}
          onPress={() => setView(key)}
          style={{ paddingHorizontal: 18, minHeight: 38, justifyContent: 'center', borderRadius: radius.pill, backgroundColor: view === key ? colors.surface : 'transparent' }}
        >
          <T style={{ fontFamily: view === key ? fonts.bold : fonts.medium, fontSize: 14 }}>{label}</T>
        </Pressable>
      ))}
    </View>
  );

  const list = (
    <View style={{ gap: 12 }}>
      {monthList.length === 0 ? (
        <EmptyState title={`Nothing in ${monthTitle(ym.year, ym.month)}`} hint="Say “I’m in” to a suggestion and it lands here." />
      ) : (
        monthList.flatMap((iso) =>
          events[iso].map((s) => {
            const c = categoryColors[s.category];
            return (
              <Link key={s.id} href={{ pathname: '/suggestion/[id]', params: { id: s.id } }} asChild>
                <Pressable accessibilityRole="link" accessibilityLabel={`Open ${s.title}`} style={{ flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 20, padding: 14 }}>
                  <View style={{ width: 52, height: 52, borderRadius: 16, backgroundColor: c.bg, alignItems: 'center', justifyContent: 'center' }}>
                    <T style={{ fontFamily: fonts.headingXL, fontSize: 20, color: c.ink }}>{fromIso(iso).getDate()}</T>
                  </View>
                  <View style={{ flex: 1, gap: 2, minWidth: 0 }}>
                    <T v="strong" numberOfLines={1}>{s.title}</T>
                    <T v="small" numberOfLines={1}>{shortDate(iso)}{s.location ? ` · ${s.location}` : ''}</T>
                  </View>
                  <CategoryPill category={s.category} />
                  {s.status === 'ACCEPTED' ? <Ionicons name="checkmark-circle" size={20} color={colors.success} /> : null}
                </Pressable>
              </Link>
            );
          }),
        )
      )}
    </View>
  );

  const legend = (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16, alignItems: 'center' }}>
      {(['DAILY', 'WEEKEND', 'MONTHLY'] as const).map((k) => (
        <View key={k} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: categoryColors[k].dot }} />
          <T v="small">{categoryColors[k].label}</T>
        </View>
      ))}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <View style={{ width: 22, height: 12, borderRadius: 4, backgroundColor: categoryColors.DAILY.dot }} />
        <T v="small">Planned (I’m in)</T>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <View style={{ width: 22, height: 12, borderRadius: 4, backgroundColor: categoryColors.DAILY.bg }} />
        <T v="small">Suggested</T>
      </View>
    </View>
  );

  const grid = (
    <MonthGrid
      year={ym.year}
      month={ym.month}
      today={today}
      events={events}
      selected={selected}
      onSelect={setSelected}
      variant={wide ? 'full' : 'mini'}
      cellHeight={wide ? 120 : 46}
    />
  );

  const agenda = <DayAgenda iso={selected} events={events[selected] ?? []} today={today} />;

  const main = view === 'list' ? list : wide ? <View style={{ gap: 16 }}>{grid}{legend}</View> : (
    <>
      <Card style={{ padding: 10 }}>{grid}</Card>
      {agenda}
    </>
  );

  return (
    <Screen onRefresh={() => void refetch()} refreshing={isRefetching}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 }}>
        <View style={{ flexShrink: 1 }}>
          <T v="label" style={{ color: colors.accent }}>YOUR CALENDAR</T>
          <T v="h1" style={wide ? { fontSize: 44, lineHeight: 48 } : undefined}>{monthTitle(ym.year, ym.month)}</T>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <MonthArrows onShift={shift} />
          {toggle}
        </View>
      </View>
      <ErrorBanner message={(error as Error | null)?.message} />
      {isLoading ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: 32 }} />
      ) : wide && view === 'month' ? (
        <View style={{ flexDirection: 'row', gap: 24, alignItems: 'flex-start' }}>
          <View style={{ flex: 999, minWidth: 0 }}>{main}</View>
          <View style={{ flex: 1, minWidth: 340, maxWidth: 400, gap: 20 }}>
            {agenda}
            <FreeTimeCard free={free} />
            <Card style={{ gap: 6, borderStyle: 'dashed', backgroundColor: colors.sunken }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Ionicons name="download-outline" size={20} color={colors.muted} />
                <T v="muted"><T v="strong">Export to calendar (.ics)</T> · coming soon</T>
              </View>
            </Card>
          </View>
        </View>
      ) : (
        <>
          {main}
          {view === 'month' ? <FreeTimeCard free={free} /> : null}
        </>
      )}
    </Screen>
  );
}
