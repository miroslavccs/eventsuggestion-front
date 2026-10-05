import { useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { useProfile, useUpdateProfile } from '@/api/hooks';
import type { CustomerProfile, SuggestionCategory } from '@/api/types';
import { useAuth } from '@/auth/auth-context';
import { InterestsEditor } from '@/components/interests-editor';
import { Screen } from '@/components/screen';
import { Button, Card, ErrorBanner, Field, Toggle, T } from '@/components/ui';
import { useIsWide } from '@/hooks/use-is-wide';
import { ageFromBirthDate, parseBirthDate } from '@/lib/dates';
import { SCHEDULE } from '@/lib/suggestions';
import { validateAbout } from '@/lib/validation';
import { categoryColors, colors } from '@/theme/tokens';

const CATEGORIES: SuggestionCategory[] = ['DAILY', 'WEEKEND', 'MONTHLY'];

export default function Profile() {
  const { data: profile, isLoading, error } = useProfile();
  if (isLoading || !profile) {
    return (
      <Screen>
        {error ? <ErrorBanner message={(error as Error).message} /> : <ActivityIndicator color={colors.accent} />}
      </Screen>
    );
  }
  // Keyed so the form re-seeds if a different account's profile is ever shown.
  return <ProfileBody key={profile.id} profile={profile} />;
}

function ProfileBody({ profile }: { profile: CustomerProfile }) {
  const wide = useIsWide();
  const { logout } = useAuth();
  const update = useUpdateProfile();

  const [firstName, setFirstName] = useState(profile.firstName);
  const [lastName, setLastName] = useState(profile.lastName);
  const [city, setCity] = useState(profile.address?.city ?? '');
  const [birth, setBirth] = useState('');
  const [education, setEducation] = useState(profile.education ?? '');
  const [job, setJob] = useState(profile.currentEmployment ?? '');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);

  const paused = new Set(profile.pausedCategories);
  const toggleCategory = (c: SuggestionCategory, on: boolean) => {
    const next = new Set(paused);
    if (on) next.delete(c);
    else next.add(c);
    update.mutate({ pausedCategories: [...next] });
  };

  const saveDetails = () => {
    const iso = birth.trim() ? parseBirthDate(birth) : null;
    const found = validateAbout(firstName, lastName, !birth.trim() ? null : iso ? ageFromBirthDate(iso) : 'invalid');
    setErrors(found);
    if (Object.keys(found).length) return;
    setSaved(false);
    update.mutate(
      {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        age: iso ? ageFromBirthDate(iso) : profile.age,
        address: { street: null, state: null, country: null, zipCode: null, ...profile.address, city: city.trim() || null },
        education: education.trim() || null,
        currentEmployment: job.trim() || null,
      },
      { onSuccess: () => setSaved(true) },
    );
  };

  const vacation = (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16, alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.ink, borderRadius: 16, padding: 20 }}>
      <View style={{ flex: 1, minWidth: 220 }}>
        <T v="h3" style={{ color: '#fff' }}>Vacation mode</T>
        <T style={{ color: colors.onInkMuted }}>Pause every suggestion while you’re away. Your history and plans stay.</T>
      </View>
      <Toggle onInk label={`Vacation mode ${profile.vacationMode ? 'on' : 'off'}`} value={profile.vacationMode} disabled={update.isPending} onValueChange={(v) => update.mutate({ vacationMode: v })} />
    </View>
  );

  return (
    <Screen>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' }}>
          <T v="h3" style={{ color: '#fff' }}>{profile.firstName[0]?.toUpperCase()}</T>
        </View>
        <View>
          <T v="h1" style={{ fontSize: 28, lineHeight: 32 }}>{profile.firstName} {profile.lastName}</T>
          <T v="muted">{[profile.address?.city, profile.email].filter(Boolean).join(' · ')}</T>
        </View>
      </View>

      <ErrorBanner message={update.error?.message} />

      <Card style={{ gap: 16, padding: wide ? 26 : 18 }}>
        {vacation}
        <View>
          <T v="h3">Suggestion schedule</T>
          <T v="muted">Turn categories off one at a time. You can still press Generate now whenever you like.</T>
        </View>
        {CATEGORIES.map((c) => {
          const on = !paused.has(c);
          return (
            <View key={c} style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: colors.track }}>
              <View style={{ width: 12, height: 12, borderRadius: 4, backgroundColor: categoryColors[c].ink }} />
              <View style={{ flex: 1 }}>
                <T v="strong">{SCHEDULE[c].title}{on ? '' : '  · PAUSED'}</T>
                <T v="muted">{SCHEDULE[c].blurb}</T>
              </View>
              <Toggle label={`${SCHEDULE[c].title} ${on ? 'on' : 'off'}`} value={on} disabled={update.isPending} onValueChange={(v) => toggleCategory(c, v)} />
            </View>
          );
        })}
      </Card>

      <Card style={{ gap: 16, padding: wide ? 26 : 18 }}>
        <T v="h2">Interests</T>
        <InterestsEditor
          value={{ sports: profile.sports, hobbies: [...profile.hobbies, ...profile.interests], likesTraveling: profile.likesTraveling, likesNightlife: profile.likesNightlife }}
          onChange={(v) => update.mutate({ sports: v.sports, hobbies: v.hobbies, interests: [], likesTraveling: v.likesTraveling, likesNightlife: v.likesNightlife })}
        />
      </Card>

      <Card style={{ gap: 16, padding: wide ? 26 : 18 }}>
        <T v="h2">Personal details</T>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
          <Field label="First name" value={firstName} onChangeText={setFirstName} error={errors.firstName} />
          <Field label="Last name" value={lastName} onChangeText={setLastName} error={errors.lastName} />
          <Field label="City" value={city} onChangeText={setCity} />
          <Field label={`Date of birth${profile.age ? ` (now ${profile.age})` : ''}`} value={birth} onChangeText={setBirth} placeholder="DD.MM.YYYY" error={errors.birth} />
          <Field label="Education" value={education} onChangeText={setEducation} placeholder="e.g. Master's degree" />
          <Field label="Employment" value={job} onChangeText={setJob} placeholder="e.g. Software engineer, full-time" />
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Button label="Save changes" onPress={saveDetails} loading={update.isPending} />
          {saved && !update.isPending ? <T v="small" accessibilityRole="alert">Saved</T> : null}
        </View>
      </Card>

      <Card style={{ gap: 8, backgroundColor: colors.accentSoft, borderColor: colors.accentBorder, padding: wide ? 26 : 18 }}>
        <T v="h2">What we’ve learned about you</T>
        <T style={{ fontSize: 17, lineHeight: 26 }}>{profile.learnedProfile || "Nothing yet. Respond to a few suggestions and we'll summarise your taste here."}</T>
        {profile.responsesUntilRefresh != null ? <T v="small">Refreshed after every 5 responses · next in {profile.responsesUntilRefresh}</T> : null}
      </Card>

      <Button label="Log out" variant="secondary" onPress={() => void logout()} style={{ alignSelf: 'flex-start' }} />
    </Screen>
  );
}
