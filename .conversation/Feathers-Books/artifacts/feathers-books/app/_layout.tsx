import React, { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { BooksProvider } from '@/context/BooksContext';
import { AdminAuthProvider } from '@/context/AdminAuthContext';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerShown: false, headerBackTitle: 'Back' }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="book/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="reader/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="admin/sign-in" options={{ headerShown: false }} />
      <Stack.Screen name="admin/new" options={{ headerShown: false }} />
      <Stack.Screen name="admin/edit/[id]" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  const appContent = (
    <SafeAreaProvider>
      <ErrorBoundary>
        <AdminAuthProvider>
          <BooksProvider>
            <RootLayoutNav />
          </BooksProvider>
        </AdminAuthProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );

  return appContent;
}
