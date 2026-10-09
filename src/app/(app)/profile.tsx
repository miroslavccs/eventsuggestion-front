import { useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { useProfile, useSuggestions, useUpdateProfile } from '@/api/hooks';
import type { CustomerProfile, SuggestionCategory } from '@/api/types';
import { useAuth } from '@/auth/auth-context';
import { InterestsEditor } from '@/components/interests-editor';
import { Screen } from '@/components/screen';
import { Button, Card, ErrorBanner, Field, Hero, Toggle, T } from '@/components/ui';
import { useIsWide } from '@/hooks/use-is-wide';
import { planStats } from '@/lib/calendar';
import { ageFromBirthDate, parseBirthDate } from '@/lib/dates';
import { SCHEDULE } from '@/lib/suggestions';
import { validateAbout } from '@/lib/validation';
import { categoryColors, colors, fonts, gradient, gradientStops, radius } from '@/theme/tokens';

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
  const stats = planStats(useSuggestions().data ?? []);

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
    <Hero stops={gradientStops.night} style={{ padding: 24, borderRadius: radius.card }}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16, alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1, minWidth: 220 }}>
          <View style={{ width: 48, height: 48, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.14)', alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="airplane-outline" size={24} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <T v="h3" style={{ color: '#fff', fontSize: 22 }}>Vacation mode</T>
            <T style={{ color: colors.onInkMuted, fontSize: 14, lineHeight: 20 }}>Pause every suggestion while you’re away. Your history and plans stay.</T>
          </View>
        </View>
        <Toggle onInk label={`Vacation mode ${profile.vacationMode ? 'on' : 'off'}`} value={profile.vacationMode} disabled={update.isPending} onValueChange={(v) => update.mutate({ vacationMode: v })} />
      </View>
    </Hero>
  );

  const pad = wide ? 26 : 18;

  const schedule = (
    <Card style={{ gap: 4, padding: pad }}>
      <T v="h2">Suggestion schedule</T>
      <T v="muted" style={{ fontSize: 14 }}>Turn categories off one at a time. You can still press Generate now whenever you like.</T>
      {CATEGORIES.map((c) => {
        const on = !paused.has(c);
        return (
          <View key={c} style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingTop: 16 }}>
            <View style={{ width: 40, height: 40, borderRadius: 14, backgroundColor: categoryColors[c].bg, alignItems: 'center', justifyContent: 'center' }}>
              <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: categoryColors[c].dot }} />
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <T v="strong">{SCHEDULE[c].title}</T>
                {on ? null : (
                  <View style={{ backgroundColor: colors.track, borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 2 }}>
                    <T style={{ fontFamily: fonts.bold, fontSize: 10, letterSpacing: 0.8, color: colors.muted }}>PAUSED</T>
                  </View>
                )}
              </View>
              <T v="small">{SCHEDULE[c].blurb}</T>
            </View>
            <Toggle label={`${SCHEDULE[c].title} ${on ? 'on' : 'off'}`} value={on} disabled={update.isPending} onValueChange={(v) => toggleCategory(c, v)} />
          </View>
        );
      })}
    </Card>
  );

  const interests = (
    <Card style={{ gap: 16, padding: pad }}>
      <T v="h2">Interests</T>
      <InterestsEditor
        value={{ sports: profile.sports, hobbies: [...profile.hobbies, ...profile.interests], likesTraveling: profile.likesTraveling, likesNightlife: profile.likesNightlife }}
        onChange={(v) => update.mutate({ sports: v.sports, hobbies: v.hobbies, interests: [], likesTraveling: v.likesTraveling, likesNightlife: v.likesNightlife })}
      />
    </Card>
  );

  const details = (
    <Card style={{ gap: 16, padding: pad }}>
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
        {saved && !update.isPending ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }} accessibilityRole="alert">
            <Ionicons name="checkmark" size={14} color={colors.success} />
            <T v="small" style={{ color: colors.success, fontFamily: fonts.bold }}>Saved</T>
          </View>
        ) : null}
      </View>
    </Card>
  );

  const learned = (
    <Hero stops={gradientStops.warm} style={{ padding: pad, gap: 10, borderRadius: radius.card, shadowOpacity: 0 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Ionicons name="sparkles" size={18} color={colors.accent} />
        <T v="h3">What we’ve learned about you</T>
      </View>
      <T style={{ fontSize: 16, lineHeight: 24 }}>{profile.learnedProfile || "Nothing yet. Respond to a few suggestions and we'll summarise your taste here."}</T>
      {profile.responsesUntilRefresh != null ? (
        <>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <T v="small">Refreshed after every 5 responses</T>
            <T v="small" style={{ color: colors.accent, fontFamily: fonts.bold }}>next in {profile.responsesUntilRefresh}</T>
          </View>
          <View style={{ height: 8, borderRadius: 4, backgroundColor: '#fff', overflow: 'hidden' }}>
            <View style={[{ width: `${((5 - profile.responsesUntilRefresh) / 5) * 100}%`, height: '100%' }, gradient(gradientStops.brand)]} />
          </View>
        </>
      ) : null}
    </Hero>
  );

  const tiles: [string, string, string][] = [
    [String(stats.tried), 'Ideas tried', categoryColors.DAILY.bg],
    [stats.averageRating === null ? '–' : stats.averageRating.toFixed(1), 'Avg rating', categoryColors.WEEKEND.bg],
    [String(stats.planned), 'Planned', categoryColors.MONTHLY.bg],
  ];
  const statsCard = (
    <Card style={{ gap: 14, padding: pad }}>
      <T v="h3">Your Lumo so far</T>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        {tiles.map(([n, label, bg]) => (
          <View key={label} style={{ flex: 1, backgroundColor: bg, borderRadius: 18, padding: 14, alignItems: 'center', gap: 2 }}>
            <T style={{ fontFamily: fonts.headingXL, fontSize: 30, lineHeight: 34 }}>{n}</T>
            <T v="small" style={{ fontSize: 12 }}>{label}</T>
          </View>
        ))}
      </View>
    </Card>
  );

  const sync = (
    <Card style={{ gap: 8, padding: pad, borderStyle: 'dashed', backgroundColor: colors.sunken }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Ionicons name="calendar-outline" size={18} color={colors.accent} />
          <T v="h3">Calendar sync</T>
        </View>
        <View style={{ backgroundColor: categoryColors.MONTHLY.bg, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4 }}>
          <T style={{ fontFamily: fonts.bold, fontSize: 10, letterSpacing: 0.8, color: categoryColors.MONTHLY.ink }}>COMING SOON</T>
        </View>
      </View>
      <T v="muted" style={{ fontSize: 14 }}>Add your plans to Apple, Google or Outlook calendar as an .ics file.</T>
    </Card>
  );

  return (
    <Screen>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
        <View style={[{ width: wide ? 84 : 60, height: wide ? 84 : 60, borderRadius: 42, alignItems: 'center', justifyContent: 'center' }, gradient(gradientStops.hero)]}>
          <T style={{ fontFamily: fonts.headingXL, fontSize: wide ? 38 : 28, color: '#fff' }}>{profile.firstName[0]?.toUpperCase()}</T>
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <T v="h1" style={{ fontSize: wide ? 40 : 28, lineHeight: wide ? 44 : 32 }}>{profile.firstName} {profile.lastName}</T>
          <T v="muted" numberOfLines={1}>{[profile.address?.city, profile.email].filter(Boolean).join(' · ')}</T>
        </View>
        <Button label="Log out" variant="secondary" onPress={() => void logout()} />
      </View>

      <ErrorBanner message={update.error?.message} />

      <View style={{ flexDirection: 'row', gap: 24, alignItems: 'flex-start' }}>
        <View style={{ flex: 1, minWidth: 0, gap: 20 }}>
          {vacation}
          {schedule}
          {interests}
          {details}
          {wide ? null : <>{learned}{statsCard}{sync}</>}
        </View>
        {wide ? <View style={{ width: 400, gap: 20 }}>{learned}{statsCard}{sync}</View> : null}
      </View>
    </Screen>
  );
}
