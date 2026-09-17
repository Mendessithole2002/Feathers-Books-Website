import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';
import { PUBLISHER_OWNER_EMAIL, normalizeEmail } from '@/constants/publisher';

const SESSION_KEY = 'feathers-books-admin-session';
const configuredAdminEmail =
  normalizeEmail(process.env.EXPO_PUBLIC_ADMIN_EMAIL) || PUBLISHER_OWNER_EMAIL;
const configuredAdminPassword = process.env.EXPO_PUBLIC_ADMIN_PASSWORD ?? '';

type AdminAuthResult = {
  success: boolean;
  message?: string;
};

type AdminAuthContextValue = {
  isLoaded: boolean;
  isSignedIn: boolean;
  isOwner: boolean;
  email?: string;
  signIn: (password: string) => Promise<AdminAuthResult>;
  signOut: () => Promise<void>;
};

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null);

async function readSession() {
  try {
    if (Platform.OS !== 'web' && (await SecureStore.isAvailableAsync())) {
      return await SecureStore.getItemAsync(SESSION_KEY);
    }
  } catch {
    // Fall through to the local storage adapter.
  }
  return AsyncStorage.getItem(SESSION_KEY);
}

async function writeSession(email: string | null) {
  try {
    if (Platform.OS !== 'web' && (await SecureStore.isAvailableAsync())) {
      if (email) await SecureStore.setItemAsync(SESSION_KEY, email);
      else await SecureStore.deleteItemAsync(SESSION_KEY);
      return;
    }
  } catch {
    // Fall through to the local storage adapter.
  }
  if (email) await AsyncStorage.setItem(SESSION_KEY, email);
  else await AsyncStorage.removeItem(SESSION_KEY);
}

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [email, setEmail] = useState<string>();

  useEffect(() => {
    readSession()
      .then((storedEmail) => {
        if (normalizeEmail(storedEmail) === configuredAdminEmail) {
          setEmail(configuredAdminEmail);
        }
      })
      .catch(() => undefined)
      .finally(() => setIsLoaded(true));
  }, []);

  const value = useMemo<AdminAuthContextValue>(
    () => ({
      isLoaded,
      isSignedIn: Boolean(email),
      isOwner: Boolean(email && normalizeEmail(email) === configuredAdminEmail),
      email,
      signIn: async (password) => {
        if (!configuredAdminPassword) {
          return {
            success: false,
            message:
              'Admin sign-in is not configured. Set the ADMIN_PASSWORD secret before using Publisher Studio.',
          };
        }
        if (password !== configuredAdminPassword) {
          return { success: false, message: 'That password is not valid.' };
        }
        await writeSession(configuredAdminEmail);
        setEmail(configuredAdminEmail);
        return { success: true };
      },
      signOut: async () => {
        await writeSession(null);
        setEmail(undefined);
      },
    }),
    [email, isLoaded],
  );

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used inside AdminAuthProvider');
  }
  return context;
}