import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useColorScheme, ActivityIndicator, View, StyleSheet } from 'react-native';
import { useState, useEffect } from 'react';
import { isFirebaseConfigured, auth as realAuth, mockAuth } from '../config/firebase';
import AuthScreen from '../components/AuthScreen';
import { BurnColors } from '../components/GlassCard';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const [user, setUser] = useState<any | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    // Listen to Auth State
    if (isFirebaseConfigured && realAuth) {
      const unsubscribe = realAuth.onAuthStateChanged((u) => {
        setUser(u);
        setInitializing(false);
      });
      return unsubscribe;
    } else {
      const unsubscribe = mockAuth.onAuthStateChanged((u) => {
        setUser(u);
        setInitializing(false);
      });
      return unsubscribe;
    }
  }, []);

  if (initializing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={BurnColors.primary} />
      </View>
    );
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      {user === null ? (
        <AuthScreen onLoginSuccess={(u) => setUser(u)} />
      ) : (
        <>
          <AnimatedSplashOverlay />
          <AppTabs />
        </>
      )}
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#09090E',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
