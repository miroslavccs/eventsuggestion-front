import { Link } from 'expo-router';
import { Pressable, View } from 'react-native';

import type { Suggestion } from '@/api/types';
import { useIsWide } from '@/hooks/use-is-wide';
import { dateLabel, metaLine } from '@/lib/suggestions';
import { dayName, dayOfMonth, monthName } from '@/lib/dates';
import { categoryColors, colors, fonts, radius } from '@/theme/tokens';
import { Button, T } from './ui';

export function CategoryPill({ category }: { category: Suggestion['category'] }) {
  const c = categoryColors[category];
  return (
    <View style={{ backgroundColor: c.bg, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 3, alignSelf: 'flex-start' }}>
      <T style={{ fontFamily: fonts.bold, fontSize: 12, letterSpacing: 0.5, color: c.ink }}>{c.label.toUpperCase()}</T>
    </View>
  );
}

/** Ticket-stub date block from the design. */
export function DateStub({ suggestion, compact }: { suggestion: Suggestion; compact?: boolean }) {
  const c = categoryColors[suggestion.category];
  const iso = suggestion.suggestedDate;
  const ink = { color: c.ink, fontFamily: fonts.bold, fontSize: 12, letterSpacing: 1.6 } as const;
  return (
    <View
      style={{
        width: compact ? 72 : 112,
        backgroundColor: c.bg,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 20,
        borderTopLeftRadius: radius.card - 1,
        borderBottomLeftRadius: radius.card - 1,
        borderRightWidth: 2,
        borderRightColor: '#FFFFFF',
        borderStyle: 'dashed',
      }}
    >
      {iso ? (
        <>
          <T style={ink}>{dayName(iso).toUpperCase()}</T>
          <T style={{ fontFamily: fonts.heading, fontSize: compact ? 32 : 46, lineHeight: compact ? 36 : 50, color: c.ink }}>
            {dayOfMonth(iso)}
          </T>
          <T style={ink}>{monthName(iso).toUpperCase()}</T>
        </>
      ) : (
        <T style={ink}>ANY DAY</T>
      )}
    </View>
  );
}

interface CardProps {
  suggestion: Suggestion;
  onAccept: () => void;
  onWishlist: () => void;
  onReject: () => void;
  onSnooze: () => void;
  busy?: boolean;
}

export function SuggestionCard({ suggestion: s, onAccept, onWishlist, onReject, onSnooze, busy }: CardProps) {
  const meta = metaLine(s);
  const wide = useIsWide();
  return (
    <View style={{ flexDirection: 'row', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.card }}>
      <DateStub suggestion={s} compact={!wide} />
      <View style={{ flex: 1, padding: wide ? 20 : 14, gap: 10, minWidth: 0 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <CategoryPill category={s.category} />
          <T v="small" style={{ flex: 1 }} numberOfLines={1}>{dateLabel(s)}</T>
          <Pressable accessibilityRole="button" accessibilityLabel="Snooze this suggestion" onPress={onSnooze} hitSlop={8} style={{ padding: 10 }}>
            <T style={{ fontSize: 18 }}>⏰</T>
          </Pressable>
        </View>
        <Link href={{ pathname: '/suggestion/[id]', params: { id: s.id } }} asChild>
          <Pressable accessibilityRole="link" accessibilityLabel={`Open ${s.title}`}>
            <T v="h2">{s.title}</T>
          </Pressable>
        </Link>
        {meta ? <T v="muted" numberOfLines={2}>📍 {meta}</T> : null}
        {s.reasonForSuggestion ? (
          <View style={{ backgroundColor: colors.sunken, borderRadius: 12, padding: 12 }}>
            <T v="label">WHY THIS</T>
            <T>{s.reasonForSuggestion}</T>
          </View>
        ) : null}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingTop: 4 }}>
          <Button label="I'm in" onPress={onAccept} disabled={busy} icon={<T style={{ color: '#fff' }}>✓</T>} />
          <Button label="Save for later" variant="secondary" onPress={onWishlist} disabled={busy} />
          <Button label="Not for me" variant="ghost" onPress={onReject} disabled={busy} />
        </View>
      </View>
    </View>
  );
}
