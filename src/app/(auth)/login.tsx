import { Link } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { useAuth } from '@/auth/auth-context';
import { AuthShell } from '@/components/auth-shell';
import { Button, ErrorBanner, Field, T } from '@/components/ui';
import { isEmail } from '@/lib/validation';
import { colors, fonts } from '@/theme/tokens';

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!isEmail(email) || !password) {
      setError('Enter your email and password.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await login(email.trim(), password);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not sign in.');
      setBusy(false);
    }
  };

  return (
    <AuthShell variant="login">
      <T v="h1" style={{ fontSize: 40, lineHeight: 44 }}>Welcome back</T>
      <T v="muted" style={{ fontSize: 16 }}>Sign in to see today’s ideas.</T>
      <ErrorBanner message={error} />
      <Field label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" autoComplete="email" keyboardType="email-address" textContentType="emailAddress" />
      <Field label="Password" value={password} onChangeText={setPassword} secureTextEntry autoComplete="current-password" textContentType="password" onSubmitEditing={submit} />
      <Button label="Sign in" onPress={submit} loading={busy} large />
      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6 }}>
        <T v="muted">New here?</T>
        <Link href="/register" style={{ color: colors.accent }}>
          <T style={{ color: colors.accent, fontFamily: fonts.bold }}>Create an account</T>
        </Link>
      </View>
    </AuthShell>
  );
}
