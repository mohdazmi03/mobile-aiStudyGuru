// App.js

// STEP 1: Import gesture handler first! (Correctly placed)
import 'react-native-gesture-handler';

// STEP 2: Import polyfills
import 'react-native-url-polyfill/auto';
import 'react-native-get-random-values';

// STEP 3: Standard imports
import React, { useState, useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from 'react-native-elements'; // Optional: Use RNE Theme
import { ActivityIndicator, View, StyleSheet, LogBox } from 'react-native'; // For loading state

// STEP 4: Your App Components/Utils
import AppNavigator from './src/navigation/AppNavigator';
import { supabase } from './src/lib/supabase'; // Import your Supabase client

// Ignore specific LogBox warnings
LogBox.ignoreLogs([
  'Constants.platform.ios.model has been deprecated in favor of expo-device',
  'ViewPropTypes will be removed from React Native',
]);

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for an existing session on mount
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      console.log("Initial session check:", currentSession ? currentSession.user?.id : 'No session'); // Use optional chaining for user.id
      setSession(currentSession);
      setLoading(false);
    }).catch(error => {
      console.error("Error getting initial session:", error);
      setLoading(false); // Ensure loading stops even on error
    });

    // Listen for auth state changes (login, logout)
    const { data: authSubscriptionData } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        console.log("Auth state change event:", event, currentSession ? currentSession.user?.id : 'No session'); // Use optional chaining for user.id
        setSession(currentSession);
      }
    );

    // Cleanup listener on unmount
    return () => {
      console.log("Unsubscribing auth listener");
      authSubscriptionData?.subscription?.unsubscribe();
    };
  }, []); // Empty dependency array means this runs once on mount

  if (loading) {
    console.log("App loading...");
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#025a5a" />
      </View>
    );
  }

  // Optional: Log the session USER ID if the session exists before rendering AppNavigator
  console.log("App rendering navigator with session user ID:", session?.user?.id ?? 'No session');
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AppNavigator session={session} />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f4f4f4', // Ensure background visibility during loading
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});