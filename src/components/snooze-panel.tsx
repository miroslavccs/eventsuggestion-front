import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { ErrorBanner, Field, Button, T } from './ui';
import { isValidIso, shortDate, snoozePresets, toIso } from '@/lib/dates';
import { colors, fonts } from '@/theme/tokens';

/** Snooze choices from the design. Calls onSnooze with an ISO date. */
export function SnoozePanel({
  onSnooze,
  busy,
  error,
}: {
  onSnooze: (until: string) => void;
  busy?: boolean;
  error?: string | null;
}) {
  const presets = snoozePresets();
  const [selected, setSelected] = useState<string | null>(presets[1].date);
  const [custom, setCustom] = useState(false);
  const [text, setText] = useState('');

  const today = toIso(new Date());
  const customValid = isValidIso(text) && text > today;
  const chosen = custom ? (customValid ? text : null) : selected;

  const row = (active: boolean, dashed = false) => ({
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    minHeight: 48,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: active ? 2 : 1,
    borderStyle: dashed ? ('dashed' as const) : ('solid' as const),
    borderColor: active ? colors.ink : dashed ? colors.borderInput : colors.borderStrong,
    backgroundColor: colors.surface,
  });

  return (
    <View style={{ gap: 8 }}>
      {presets.map((p) => {
        const active = !custom && selected === p.date;
        return (
          <Pressable
            key={p.key}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            onPress={() => {
              setCustom(false);
              setSelected(p.date);
            }}
            style={row(active)}
          >
            <T style={{ fontFamily: active ? fonts.bold : fonts.medium }}>{p.label}</T>
            <T v="muted">{shortDate(p.date)}</T>
          </Pressable>
        );
      })}
      <Pressable accessibilityRole="button" accessibilityState={{ selected: custom }} onPress={() => setCustom(true)} style={row(custom, true)}>
        <T style={{ fontFamily: fonts.medium }}>Pick a date…</T>
        <T v="muted">📅</T>
      </Pressable>
      {custom ? (
        <Field
          label="Date (YYYY-MM-DD)"
          value={text}
          onChangeText={setText}
          placeholder={presets[2].date}
          autoCapitalize="none"
          keyboardType="numbers-and-punctuation"
          error={text.length >= 10 && !customValid ? 'Enter a valid date in the future' : undefined}
        />
      ) : null}
      <ErrorBanner message={error} />
      <Button
        label={chosen ? `Snooze to ${shortDate(chosen)}` : 'Snooze'}
        onPress={() => chosen && onSnooze(chosen)}
        disabled={!chosen}
        loading={busy}
      />
    </View>
  );
}
