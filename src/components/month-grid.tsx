import { Pressable, View } from 'react-native';

import type { Suggestion } from '@/api/types';
import { monthGrid } from '@/lib/calendar';
import { shortDate } from '@/lib/dates';
import { categoryColors, colors, fonts, gradient, gradientStops, radius } from '@/theme/tokens';
import { T } from './ui';

const WEEKDAYS_FULL = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
const WEEKDAYS_MINI = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

interface Props {
  year: number;
  /** 0-11 */
  month: number;
  /** ISO today, marked with the brand gradient. */
  today: string;
  /** Events keyed by ISO date (see `eventsByDate`). */
  events?: Record<string, Suggestion[]>;
  selected?: string | null;
  onSelect?: (iso: string) => void;
  /** `mini` = number + category dots (side cards, date picker); `full` = tall cells with event chips. */
  variant?: 'mini' | 'full';
  /** Days before this ISO date are dimmed and cannot be selected (date picker). */
  minDate?: string;
  cellHeight?: number;
}

const eventLabel = (n: number) => (n === 0 ? '' : `, ${n} event${n === 1 ? '' : 's'}`);

export function MonthGrid({ year, month, today, events = {}, selected, onSelect, variant = 'mini', minDate, cellHeight }: Props) {
  const full = variant === 'full';
  const weeks = monthGrid(year, month);
  const height = cellHeight ?? (full ? 112 : 42);

  return (
    <View
      accessibilityLabel="Month calendar"
      style={full ? { backgroundColor: colors.border, borderRadius: radius.card, overflow: 'hidden', gap: 1 } : { gap: 2 }}
    >
      <View style={{ flexDirection: 'row', gap: full ? 1 : 0 }}>
        {(full ? WEEKDAYS_FULL : WEEKDAYS_MINI).map((d, i) => (
          <View key={`${d}${i}`} style={{ flex: 1, alignItems: 'center', paddingVertical: full ? 12 : 6, backgroundColor: full ? colors.sunken : undefined }}>
            <T style={{ fontFamily: fonts.bold, fontSize: full ? 12 : 11, letterSpacing: 1, color: colors.subtle }}>{d}</T>
          </View>
        ))}
      </View>
      {weeks.map((week) => (
        <View key={week[0].iso} style={{ flexDirection: 'row', gap: full ? 1 : 0 }}>
          {week.map((day) => {
            const list = events[day.iso] ?? [];
            const isToday = day.iso === today;
            const isSelected = day.iso === selected;
            const disabled = !!minDate && day.iso < minDate;
            const numberStyle = isSelected ? { backgroundColor: colors.ink } : isToday ? gradient(gradientStops.brand) : null;
            const lit = isToday || isSelected;
            const textColor = lit ? '#FFFFFF' : !day.inMonth ? '#CFC8DB' : disabled ? '#B9B2C8' : colors.ink;
            const content = (
              <>
                <View style={[{ width: full ? 28 : 30, height: full ? 28 : 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' }, numberStyle]}>
                  <T style={{ fontFamily: lit ? fonts.bold : fonts.medium, fontSize: 13, color: textColor }}>{day.day}</T>
                </View>
                {full
                  ? list.slice(0, 2).map((s) => {
                      const c = categoryColors[s.category];
                      const planned = s.status === 'ACCEPTED';
                      return (
                        <View key={s.id} style={{ alignSelf: 'stretch', borderRadius: 8, paddingHorizontal: 7, paddingVertical: 4, backgroundColor: planned ? c.dot : c.bg }}>
                          <T numberOfLines={1} style={{ fontFamily: fonts.bold, fontSize: 11, color: planned ? '#FFFFFF' : c.ink }}>{s.title}</T>
                        </View>
                      );
                    })
                  : (
                    <View style={{ flexDirection: 'row', gap: 2, height: 5 }}>
                      {list.slice(0, 3).map((s) => (
                        <View key={s.id} style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: categoryColors[s.category].dot }} />
                      ))}
                    </View>
                  )}
                {full && list.length > 2 ? <T v="small" style={{ fontSize: 11 }}>+{list.length - 2} more</T> : null}
              </>
            );
            const cell = {
              flex: 1,
              height,
              alignItems: full ? ('flex-start' as const) : ('center' as const),
              justifyContent: full ? ('flex-start' as const) : ('center' as const),
              gap: full ? 5 : 2,
              padding: full ? 8 : 0,
              backgroundColor: full ? (day.inMonth ? colors.surface : '#FCF6F0') : undefined,
            };
            return (
              <Pressable
                key={day.iso}
                accessibilityRole="button"
                accessibilityLabel={`${shortDate(day.iso)}${eventLabel(list.length)}`}
                accessibilityState={{ selected: isSelected, disabled: disabled || !onSelect }}
                disabled={disabled || !onSelect}
                onPress={() => onSelect?.(day.iso)}
                style={cell}
              >
                {content}
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}
