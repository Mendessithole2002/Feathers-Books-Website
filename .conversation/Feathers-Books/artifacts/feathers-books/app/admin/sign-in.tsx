import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { useAdminAccess } from '@/hooks/useAdminAccess';

export default function AdminSignInScreen() {
  const colors = useColors();
  const router = useRouter();
  const { isLoaded, isOwner, signIn } = useAdminAccess();
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isLoaded && isOwner) router.replace('/(tabs)/admin');
  }, [isLoaded, isOwner, router]);

  const submit = async () => {
    setIsSubmitting(true);
    setErrorMessage('');
    const result = await signIn(password);
    setIsSubmitting(false);
    if (result.success) {
      router.replace('/(tabs)/admin');
    } else {
      setErrorMessage(result.message ?? 'Could not sign in.');
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <Pressable onPress={() => router.back()} style={styles.closeButton}>
          <Feather name="arrow-left" size={21} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.eyebrow, { color: colors.primary }]}>PUBLISHER STUDIO</Text>
        <Text style={[styles.title, { color: colors.foreground }]}>Admin sign-in</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Reader browsing is public. Enter the publisher password to manage the Feathers Books catalog.
        </Text>

        <Text style={[styles.label, { color: colors.foreground }]}>Publisher password</Text>
        <TextInput
          value={password}
          onChangeText={setPassword}
          autoCapitalize="none"
          autoCorrect={false}
          secureTextEntry
          placeholder="Enter your admin password"
          placeholderTextColor={colors.mutedForeground}
          style={[
            styles.input,
            { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.secondary },
          ]}
        />
        <Pressable
          onPress={submit}
          disabled={!isLoaded || !password || isSubmitting}
          style={({ pressed }) => [
            styles.button,
            {
              backgroundColor: colors.primary,
              opacity: !isLoaded || !password || isSubmitting ? 0.55 : pressed ? 0.85 : 1,
            },
          ]}
        >
          {isSubmitting ? (
            <ActivityIndicator color={colors.primaryForeground} />
          ) : (
            <Text style={[styles.buttonText, { color: colors.primaryForeground }]}>Open Publisher Studio</Text>
          )}
        </Pressable>
        {errorMessage ? (
          <Text style={[styles.error, { color: colors.destructive }]}>{errorMessage}</Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: 26, maxWidth: 520, width: '100%', alignSelf: 'center' },
  closeButton: { position: 'absolute', top: 16, left: 20, width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  eyebrow: { fontSize: 11, fontWeight: '800', letterSpacing: 1.8, marginBottom: 10 },
  title: { fontSize: 32, lineHeight: 37, fontWeight: '700', letterSpacing: -1 },
  subtitle: { fontSize: 14, lineHeight: 21, marginTop: 9, marginBottom: 24 },
  label: { fontSize: 12, fontWeight: '700', marginBottom: 8 },
  passwordLabel: { marginTop: 14 },
  input: { minHeight: 50, borderWidth: 1, borderRadius: 13, paddingHorizontal: 14, fontSize: 14 },
  button: { minHeight: 52, borderRadius: 15, alignItems: 'center', justifyContent: 'center', marginTop: 24 },
  buttonText: { fontSize: 14, fontWeight: '700' },
  error: { textAlign: 'center', fontSize: 12, lineHeight: 18, marginTop: 16 },
});