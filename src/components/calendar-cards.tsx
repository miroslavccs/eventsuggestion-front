import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { Pressable, View } from 'react-native';

import type { Suggestion } from '@/api/types';
import { monthTitle, type FreeTime } from '@/lib/calendar';
import { addDays, fromIso, shortDate, toIso } from '@/lib/dates';
import { categoryColors, colors, fonts, gradient, gradientStops } from '@/theme/tokens';
import { CategoryPill } from './suggestion-card';
import { Card, Hero, T } from './ui';

/** "Fri 9 Oct", "Fri 9 Oct and Sat 10 Oct", "Fri 9 Oct, Sat 10 Oct and Sun 11 Oct". */
export function joinDays(days: string[]): string {
  const labels = days.map(shortDate);
  if (labels.length <= 1) return labels.join('');
  return `${labels.slice(0, -1).join(', ')} and ${labels[labels.length - 1]}`;
}

export function MonthArrows({ onShift }: { onShift: (delta: number) => void }) {
  const arrow = (delta: number, icon: 'chevron-back' | 'chevron-forward', label: string) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={() => onShift(delta)}
      style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.track, alignItems: 'center', justifyContent: 'center' }}
    >
      <Ionicons name={icon} size={18} color={colors.ink} />
    </Pressable>
  );
  return (
    <View style={{ flexDirection: 'row', gap: 6 }}>
      {arrow(-1, 'chevron-back', 'Previous month')}
      {arrow(1, 'chevron-forward', 'Next month')}
    </View>
  );
}

export function MonthHeader({
  year,
  month,
  onShift,
  size = 22,
}: {
  year: number;
  month: number;
  onShift: (delta: number) => void;
  size?: number;
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
      <T accessibilityRole="header" style={{ fontFamily: fonts.heading, fontSize: size, lineHeight: size + 4 }}>
        {monthTitle(year, month)}
      </T>
      <MonthArrows onShift={onShift} />
    </View>
  );
}

/** Everything on one calendar day: planned items and open ideas, each opening its detail screen. */
export function DayAgenda({ iso, events, today }: { iso: string; events: Suggestion[]; today: string }) {
  return (
    <Card style={{ gap: 14 }}>
      <View>
        {iso === today ? <T v="label" style={{ color: colors.accent }}>TODAY</T> : null}
        <T v="h2" style={{ fontSize: 24 }}>{shortDate(iso)}</T>
      </View>
      {events.length === 0 ? (
        <View style={{ borderWidth: 1, borderStyle: 'dashed', borderColor: colors.borderStrong, borderRadius: 18, padding: 16, alignItems: 'center' }}>
          <T v="muted">Nothing on this day</T>
        </View>
      ) : (
        events.map((s) => {
          const c = categoryColors[s.category];
          const planned = s.status === 'ACCEPTED';
          return (
            <Link key={s.id} href={{ pathname: '/suggestion/[id]', params: { id: s.id } }} asChild>
              <Pressable accessibilityRole="link" accessibilityLabel={`Open ${s.title}`} style={{ backgroundColor: c.bg, borderRadius: 18, padding: 16, gap: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <CategoryPill category={s.category} />
                  <T v="small" style={{ color: c.ink, fontFamily: fonts.bold }}>{planned ? 'In your plans' : 'Suggested'}</T>
                </View>
                <T v="h3" style={{ color: c.ink }}>{s.title}</T>
                {s.location ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Ionicons name="location-outline" size={14} color={c.ink} />
                    <T v="small" style={{ color: c.ink }}>{s.location}</T>
                  </View>
                ) : null}
              </Pressable>
            </Link>
          );
        })
      )}
    </Card>
  );
}

/** "You're free Fri 9 Oct and Sat 10 Oct. 2 ideas fit." Hidden when the coming week has no free weekend day. */
export function FreeTimeCard({ free }: { free: FreeTime }) {
  if (free.days.length === 0) return null;
  const n = free.ideas.length;
  return (
    <Hero stops={gradientStops.brand} style={{ padding: 22, gap: 10, borderRadius: 24 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Ionicons name="sparkles" size={16} color="#fff" />
        <T v="label" style={{ color: '#fff' }}>FREE TIME SPOTTED</T>
      </View>
      <T style={{ fontFamily: fonts.heading, fontSize: 22, lineHeight: 26, color: '#fff' }}>You’re free {joinDays(free.days)}.</T>
      <T style={{ color: '#FFF1E6' }}>{n === 0 ? 'No ideas planned for these days yet.' : `${n} idea${n === 1 ? '' : 's'} fit your calendar.`}</T>
    </Hero>
  );
}

const WEEKDAY_SHORT = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

/** The current Mon–Sun week with today highlighted and a dot per day that has something on it (mobile Today). */
export function WeekStrip({ today, events }: { today: string; events: Record<string, Suggestion[]> }) {
  const start = fromIso(today);
  const monday = addDays(start, -((start.getDay() + 6) % 7));
  return (
    <Card style={{ padding: 12, gap: 8 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 4 }}>
        <T v="h3" style={{ fontSize: 17 }}>This week</T>
        <Link href="/calendar"><T style={{ fontFamily: fonts.bold, fontSize: 12, color: colors.accent }}>Open calendar →</T></Link>
      </View>
      <View style={{ flexDirection: 'row' }}>
        {WEEKDAY_SHORT.map((label, i) => {
          const iso = toIso(addDays(monday, i));
          const isToday = iso === today;
          const list = events[iso] ?? [];
          return (
            <View
              key={iso}
              accessibilityLabel={`${shortDate(iso)}${list.length ? `, ${list.length} event${list.length === 1 ? '' : 's'}` : ''}`}
              style={[{ flex: 1, alignItems: 'center', gap: 6, paddingVertical: 8, borderRadius: 16 }, isToday ? gradient(gradientStops.brand) : null]}
            >
              <T style={{ fontFamily: fonts.bold, fontSize: 10, letterSpacing: 0.8, color: isToday ? '#fff' : colors.subtle }}>{label}</T>
              <T style={{ fontFamily: fonts.headingXL, fontSize: 18, color: isToday ? '#fff' : colors.ink }}>{fromIso(iso).getDate()}</T>
              <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: list[0] ? (isToday ? '#fff' : categoryColors[list[0].category].dot) : 'transparent' }} />
            </View>
          );
        })}
      </View>
    </Card>
  );
}
