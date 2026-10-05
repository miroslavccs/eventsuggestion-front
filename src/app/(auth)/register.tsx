import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';

import { useAuth } from '@/auth/auth-context';
import { InterestsEditor, type InterestsValue } from '@/components/interests-editor';
import { Button, ErrorBanner, Field, T } from '@/components/ui';
import { ageFromBirthDate, parseBirthDate } from '@/lib/dates';
import { validateAbout, validateAccount } from '@/lib/validation';
import { colors } from '@/theme/tokens';

const STEPS = 3;
const MIN_PICKS = 3;

export default function Register() {
  const { register } = useAuth();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [city, setCity] = useState('');
  const [birth, setBirth] = useState('');
  const [interests, setInterests] = useState<InterestsValue>({ sports: [], hobbies: [], likesTraveling: true, likesNightlife: false });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const picked = interests.sports.length + interests.hobbies.length;

  const ageValue = (): number | null | 'invalid' => {
    if (!birth.trim()) return null;
    const iso = parseBirthDate(birth);
    return iso ? ageFromBirthDate(iso) : 'invalid';
  };

  const next = () => {
    const found = step === 1 ? validateAccount(email, password) : validateAbout(firstName, lastName, ageValue());
    setErrors(found);
    if (Object.keys(found).length === 0) setStep(step + 1);
  };

  const submit = async (withInterests: boolean) => {
    setBusy(true);
    setError(null);
    const age = ageValue();
    try {
      await register({
        email: email.trim(),
        password,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        age: typeof age === 'number' ? age : null,
        address: city.trim() ? { city: city.trim() } : null,
        sports: withInterests ? interests.sports : [],
        hobbies: withInterests ? interests.hobbies : [],
        interests: [],
        likesTraveling: interests.likesTraveling,
        likesNightlife: interests.likesNightlife,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not create the account.');
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 24, paddingTop: 56 }} keyboardShouldPersistTaps="handled">
        <View style={{ width: '100%', maxWidth: 520, alignSelf: 'center', gap: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Pressable accessibilityRole="button" accessibilityLabel="Back" disabled={step === 1} onPress={() => setStep(step - 1)} style={{ width: 44, height: 44, marginLeft: -10, alignItems: 'center', justifyContent: 'center', opacity: step === 1 ? 0.3 : 1 }}>
              <Ionicons name="chevron-back" size={22} color={colors.ink} />
            </Pressable>
            <View accessibilityLabel={`Step ${step} of ${STEPS}`} style={{ flex: 1, flexDirection: 'row', gap: 6 }}>
              {Array.from({ length: STEPS }, (_, i) => (
                <View key={i} style={{ flex: 1, height: 6, borderRadius: 3, backgroundColor: i < step ? colors.accent : colors.track }} />
              ))}
            </View>
            <T v="small">{step} / {STEPS}</T>
          </View>

          <ErrorBanner message={error} />

          {step === 1 ? (
            <>
              <T v="h1">Create your account</T>
              <T v="muted">We’ll send a few ideas every morning once you’re set up.</T>
              <Field label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" autoComplete="email" keyboardType="email-address" error={errors.email} />
              <Field label="Password" value={password} onChangeText={setPassword} secureTextEntry autoComplete="new-password" error={errors.password} onSubmitEditing={next} />
              <Button label="Continue" onPress={next} large />
              <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6 }}>
                <T v="muted">Already have an account?</T>
                <Link href="/login"><T style={{ color: colors.accent }}>Sign in</T></Link>
              </View>
            </>
          ) : null}

          {step === 2 ? (
            <>
              <T v="h1">About you</T>
              <T v="muted">Used to find things near you and suit your age.</T>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                <Field label="First name" value={firstName} onChangeText={setFirstName} autoComplete="given-name" error={errors.firstName} />
                <Field label="Last name" value={lastName} onChangeText={setLastName} autoComplete="family-name" error={errors.lastName} />
              </View>
              <Field label="City" value={city} onChangeText={setCity} placeholder="e.g. Belgrade" />
              <Field label="Date of birth (optional)" value={birth} onChangeText={setBirth} placeholder="DD.MM.YYYY" keyboardType="numbers-and-punctuation" error={errors.birth} />
              <Button label="Continue" onPress={next} large />
            </>
          ) : null}

          {step === 3 ? (
            <>
              <T v="h1">What do you enjoy?</T>
              <T v="muted">Pick at least {MIN_PICKS}. Your first suggestions start from these, then learn from what you say yes to.</T>
              <InterestsEditor value={interests} onChange={setInterests} />
              <Button label={`Continue · ${picked} picked`} onPress={() => submit(true)} disabled={picked < MIN_PICKS} loading={busy} large />
              <Button label="Skip for now" variant="ghost" onPress={() => submit(false)} disabled={busy} />
            </>
          ) : null}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
