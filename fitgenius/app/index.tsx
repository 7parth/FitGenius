import { useEffect } from 'react';
import { Redirect } from 'expo-router';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuthStore } from '@/store/auth';
import { useProfileStore } from '@/store/profile';
import { Colors } from '@/constants/colors';

export default function Index() {
  const { session, initialized } = useAuthStore();
  const { profile, fetchProfile, onboardingComplete } = useProfileStore();

  useEffect(() => {
    if (session?.user.id) {
      fetchProfile(session.user.id);
    }
  }, [session]);

  if (!initialized) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!session) {
    return <Redirect href="/(auth)/login" />;
  }

  if (!onboardingComplete) {
    return <Redirect href="/(auth)/onboarding" />;
  }

  return <Redirect href="/(tabs)" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
