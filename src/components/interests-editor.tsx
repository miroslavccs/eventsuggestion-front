import { useState } from 'react';
import { TextInput, View } from 'react-native';

import { Chip, Toggle, T } from './ui';
import { colors, fonts } from '@/theme/tokens';

export const SPORT_OPTIONS = ['Hiking', 'Running', 'Tennis', 'Kayaking', 'Cycling', 'Swimming', 'Basketball'];
export const HOBBY_OPTIONS = [
  'Live music',
  'Pottery',
  'Theatre',
  'Food & wine',
  'Photography',
  'Board games',
  'Film',
  'Tech meetups',
];

export interface InterestsValue {
  sports: string[];
  hobbies: string[];
  likesTraveling: boolean;
  likesNightlife: boolean;
}

const toggle = (list: string[], item: string) => (list.includes(item) ? list.filter((x) => x !== item) : [...list, item]);

function ChipGroup({ title, options, selected, onChange }: { title: string; options: string[]; selected: string[]; onChange: (next: string[]) => void }) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState('');
  // Custom entries the user added (or that came from the server) are shown too.
  const all = [...options, ...selected.filter((s) => !options.includes(s))];

  const commit = () => {
    const v = draft.trim();
    if (v && !selected.includes(v)) onChange([...selected, v]);
    setDraft('');
    setAdding(false);
  };

  return (
    <View style={{ gap: 8 }}>
      <T v="label">{title}</T>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {all.map((o) => (
          <Chip key={o} label={o} selected={selected.includes(o)} onPress={() => onChange(toggle(selected, o))} />
        ))}
        {adding ? (
          <TextInput
            autoFocus
            value={draft}
            onChangeText={setDraft}
            onSubmitEditing={commit}
            onBlur={commit}
            placeholder="Type and press enter"
            accessibilityLabel={`Add to ${title}`}
            placeholderTextColor={colors.subtle}
            style={{ height: 40, minWidth: 150, paddingHorizontal: 14, borderRadius: 999, borderWidth: 1, borderColor: colors.borderInput, fontFamily: fonts.body, fontSize: 15, color: colors.ink }}
          />
        ) : (
          <Chip label="+ Add" dashed onPress={() => setAdding(true)} />
        )}
      </View>
    </View>
  );
}

export function InterestsEditor({ value, onChange }: { value: InterestsValue; onChange: (next: InterestsValue) => void }) {
  const row = (title: string, hint: string, on: boolean, set: (v: boolean) => void) => (
    <View style={{ flex: 1, minWidth: 240, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, borderWidth: 1, borderColor: colors.border, borderRadius: 14, padding: 14 }}>
      <View style={{ flex: 1 }}>
        <T v="strong">{title}</T>
        <T v="small">{hint}</T>
      </View>
      <Toggle value={on} onValueChange={set} label={`${title} ${on ? 'on' : 'off'}`} />
    </View>
  );
  return (
    <View style={{ gap: 18 }}>
      <ChipGroup title="SPORTS" options={SPORT_OPTIONS} selected={value.sports} onChange={(sports) => onChange({ ...value, sports })} />
      <ChipGroup title="HOBBIES & INTERESTS" options={HOBBY_OPTIONS} selected={value.hobbies} onChange={(hobbies) => onChange({ ...value, hobbies })} />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
        {row('Open to travel', 'Weekends away and longer trips', value.likesTraveling, (likesTraveling) => onChange({ ...value, likesTraveling }))}
        {row('Nightlife', 'Clubs and late events', value.likesNightlife, (likesNightlife) => onChange({ ...value, likesNightlife }))}
      </View>
    </View>
  );
}
