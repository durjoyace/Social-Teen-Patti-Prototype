import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useAuthStore } from '../src/stores/authStore';
import { useRouter, useSegments } from 'expo-router';
import * as Linking from 'expo-linking';
import { captureReferralUrl } from '../src/services/referralAttribution';

function AuthGuard() {
  const { isAuthenticated, isLoading } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    const inAuth = segments[0] === '(auth)';
    if (!isAuthenticated && !inAuth) {
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuth) {
      router.replace('/(main)/lobby');
    }
  }, [isAuthenticated, isLoading, segments]);

  return null;
}

export default function RootLayout() {
  const { restoreSession } = useAuthStore();

  useEffect(() => {
    let active = true;
    Linking.getInitialURL()
      .then(url => captureReferralUrl(url))
      .finally(() => { if (active) void restoreSession(); });
    const subscription = Linking.addEventListener('url', event => {
      if (!useAuthStore.getState().isAuthenticated) void captureReferralUrl(event.url);
    });
    return () => {
      active = false;
      subscription.remove();
    };
  }, [restoreSession]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthGuard />
      <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(main)" />
      </Stack>
    </GestureHandlerRootView>
  );
}
