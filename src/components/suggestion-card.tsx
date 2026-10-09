import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { Pressable, View } from 'react-native';

import type { Suggestion } from '@/api/types';
import { useIsWide } from '@/hooks/use-is-wide';
import { dateLabel, metaLine } from '@/lib/suggestions';
import { dayName, dayOfMonth, monthName } from '@/lib/dates';
import { categoryColors, colors, fonts, radius, shadows } from '@/theme/tokens';
import { Button, T } from './ui';

export function CategoryPill({ category }: { category: Suggestion['category'] }) {
  const c = categoryColors[category];
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: c.bg, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start' }}>
      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: c.dot }} />
      <T style={{ fontFamily: fonts.bold, fontSize: 11, letterSpacing: 0.7, color: c.ink }}>{c.label.toUpperCase()}</T>
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
          <T style={{ fontFamily: fonts.headingXL, fontSize: compact ? 32 : 46, lineHeight: compact ? 36 : 50, color: c.ink }}>
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
  const c = categoryColors[s.category];
  return (
    <View style={[{ flexDirection: 'row', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.card, overflow: 'hidden' }, shadows.card]}>
      <DateStub suggestion={s} compact={!wide} />
      <View style={{ width: 4, backgroundColor: c.dot }} />
      <View style={{ flex: 1, padding: wide ? 22 : 14, gap: 10, minWidth: 0 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <CategoryPill category={s.category} />
          <T v="small" style={{ flex: 1 }} numberOfLines={1}>{dateLabel(s)}</T>
          <Pressable accessibilityRole="button" accessibilityLabel="Snooze this suggestion" onPress={onSnooze} hitSlop={8} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.track, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="time-outline" size={18} color={colors.muted} />
          </Pressable>
        </View>
        <Link href={{ pathname: '/suggestion/[id]', params: { id: s.id } }} asChild>
          <Pressable accessibilityRole="link" accessibilityLabel={`Open ${s.title}`}>
            <T v="h2" style={wide ? { fontSize: 26, lineHeight: 30 } : undefined}>{s.title}</T>
          </Pressable>
        </Link>
        {meta ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="location-outline" size={15} color={colors.muted} />
            <T v="muted" style={{ flex: 1, fontSize: 14 }} numberOfLines={2}>{meta}</T>
          </View>
        ) : null}
        {s.reasonForSuggestion ? (
          <View style={{ backgroundColor: colors.accentSoft, borderRadius: radius.control, padding: 14, gap: 4 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="sparkles" size={13} color={colors.accent} />
              <T v="label" style={{ color: colors.accent }}>WHY THIS</T>
            </View>
            <T style={{ fontSize: 14, lineHeight: 20 }}>{s.reasonForSuggestion}</T>
          </View>
        ) : null}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingTop: 4 }}>
          <Button label="I'm in" onPress={onAccept} disabled={busy} icon={<Ionicons name="checkmark" size={16} color="#fff" />} />
          <Button label="Save for later" variant="secondary" onPress={onWishlist} disabled={busy} icon={<Ionicons name="bookmark-outline" size={16} color={colors.ink} />} />
          <Button label="Not for me" variant="ghost" onPress={onReject} disabled={busy} />
        </View>
      </View>
    </View>
  );
}
