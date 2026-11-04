import React, { useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '@/store/auth';
import { useProfileStore } from '@/store/profile';
import { useWorkoutStore } from '@/store/workout';
import { Colors } from '@/constants/colors';
import { generateWorkoutPlan } from '@/lib/ai/recommendations';
import { formatDuration } from '@/lib/utils/calculations';

export default function HomeScreen() {
  const { user } = useAuthStore();
  const { profile } = useProfileStore();
  const { workouts, fetchWorkoutHistory } = useWorkoutStore();

  useEffect(() => {
    if (user) fetchWorkoutHistory(user.id);
  }, [user]);

  const plan = profile ? generateWorkoutPlan(profile) : null;
  const today = new Date().getDay(); // 0 = Sun
  const todayPlan = plan?.days.find((d) => d.day === today);
  const recentWorkouts = workouts.slice(0, 3);

  const totalVolume = workouts.reduce((sum, w) => {
    return sum + w.sets.reduce((s2, set) => s2 + (set.reps ?? 0) * (set.weight ?? 0), 0);
  }, 0);

  // Calculate streak
  const streak = calculateStreak(workouts.map((w) => w.date));

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>
              {getGreeting()}, {profile?.name?.split(' ')[0] ?? 'Athlete'} 👋
            </Text>
            <Text style={styles.date}>{formatDate(new Date())}</Text>
          </View>
          <TouchableOpacity
            style={styles.aiButton}
            onPress={() => router.push('/ai/camera')}
            accessibilityRole="button"
            accessibilityLabel="Open AI camera for pose analysis"
          >
            <Text style={styles.aiButtonText}>🤖 AI</Text>
          </TouchableOpacity>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <StatCard label="Streak" value={`${streak}d`} icon="🔥" accent={Colors.warning} />
          <StatCard label="Workouts" value={String(workouts.length)} icon="💪" accent={Colors.primary} />
          <StatCard label="Volume" value={`${(totalVolume / 1000).toFixed(1)}t`} icon="⚖️" accent={Colors.accent} />
        </View>

        {/* Today's Plan */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today's Plan</Text>
          {todayPlan ? (
            todayPlan.is_rest_day ? (
              <View style={styles.restCard}>
                <Text style={styles.restIcon}>😴</Text>
                <Text style={styles.restTitle}>Rest Day</Text>
                <Text style={styles.restDesc}>Recovery is part of the process. Take it easy today.</Text>
              </View>
            ) : (
              <View style={styles.planCard}>
                <View style={styles.planHeader}>
                  <Text style={styles.planDay}>{todayPlan.name}</Text>
                  <Text style={styles.planCount}>{todayPlan.exercises.length} exercises</Text>
                </View>
                {todayPlan.exercises.slice(0, 3).map((ex, i) => (
                  <View key={i} style={styles.planExercise}>
                    <View style={styles.planExerciseDot} />
                    <Text style={styles.planExerciseName}>{ex.exercise_name}</Text>
                    <Text style={styles.planExerciseSets}>{ex.sets} × {ex.reps}</Text>
                  </View>
                ))}
                {todayPlan.exercises.length > 3 && (
                  <Text style={styles.planMore}>+{todayPlan.exercises.length - 3} more</Text>
                )}
                <TouchableOpacity
                  style={styles.startButton}
                  onPress={() => router.push('/workout/session')}
                  accessibilityRole="button"
                >
                  <Text style={styles.startButtonText}>Start Workout ▶</Text>
                </TouchableOpacity>
              </View>
            )
          ) : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>No plan yet. Complete onboarding to get your personalized plan.</Text>
            </View>
          )}
        </View>

        {/* Recent Workouts */}
        {recentWorkouts.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Workouts</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/progress')}>
                <Text style={styles.seeAll}>See all →</Text>
              </TouchableOpacity>
            </View>
            {recentWorkouts.map((workout) => (
              <View key={workout.id} style={styles.workoutCard}>
                <View style={styles.workoutInfo}>
                  <Text style={styles.workoutName}>{workout.name}</Text>
                  <Text style={styles.workoutMeta}>
                    {new Date(workout.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    {workout.duration ? ` · ${formatDuration(workout.duration)}` : ''}
                  </Text>
                </View>
                <Text style={styles.workoutSets}>{workout.sets.length} sets</Text>
              </View>
            ))}
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <QuickAction icon="🏋️" label="Log Workout" onPress={() => router.push('/workout/session')} />
            <QuickAction icon="📖" label="Browse Exercises" onPress={() => router.push('/(tabs)/workout')} />
            <QuickAction icon="🤖" label="AI Form Check" onPress={() => router.push('/ai/camera')} />
            <QuickAction icon="📊" label="View Progress" onPress={() => router.push('/(tabs)/progress')} />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({
  label,
  value,
  icon,
  accent,
}: {
  label: string;
  value: string;
  icon: string;
  accent: string;
}) {
  return (
    <View style={[statStyles.card, { borderColor: accent + '33' }]}>
      <Text style={statStyles.icon}>{icon}</Text>
      <Text style={[statStyles.value, { color: accent }]}>{value}</Text>
      <Text style={statStyles.label}>{label}</Text>
    </View>
  );
}

function QuickAction({ icon, label, onPress }: { icon: string; label: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={qaStyles.card} onPress={onPress} accessibilityRole="button">
      <Text style={qaStyles.icon}>{icon}</Text>
      <Text style={qaStyles.label}>{label}</Text>
    </TouchableOpacity>
  );
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function formatDate(date: Date) {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

function calculateStreak(dates: string[]): number {
  if (dates.length === 0) return 0;
  const unique = [...new Set(dates.map((d) => d.split('T')[0]))].sort().reverse();
  let streak = 0;
  const today = new Date().toISOString().split('T')[0];
  let check = today;
  for (const date of unique) {
    if (date === check) {
      streak++;
      const d = new Date(check);
      d.setDate(d.getDate() - 1);
      check = d.toISOString().split('T')[0];
    } else {
      break;
    }
  }
  return streak;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  greeting: { fontSize: 22, fontWeight: '800', color: Colors.text },
  date: { fontSize: 13, color: Colors.textMuted, marginTop: 2 },
  aiButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  aiButtonText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 28 },
  section: { marginBottom: 28 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: Colors.text, marginBottom: 12 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  seeAll: { color: Colors.primary, fontSize: 14 },
  restCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  restIcon: { fontSize: 36 },
  restTitle: { fontSize: 18, fontWeight: '700', color: Colors.text },
  restDesc: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center' },
  planCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 10,
  },
  planHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  planDay: { fontSize: 16, fontWeight: '700', color: Colors.text },
  planCount: { fontSize: 13, color: Colors.textMuted },
  planExercise: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  planExerciseDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.primary },
  planExerciseName: { flex: 1, fontSize: 14, color: Colors.text },
  planExerciseSets: { fontSize: 13, color: Colors.textMuted },
  planMore: { fontSize: 13, color: Colors.textMuted, paddingLeft: 16 },
  startButton: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  startButtonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  emptyCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyText: { color: Colors.textSecondary, fontSize: 14, lineHeight: 20 },
  workoutCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  workoutInfo: { gap: 3 },
  workoutName: { fontSize: 15, fontWeight: '600', color: Colors.text },
  workoutMeta: { fontSize: 13, color: Colors.textMuted },
  workoutSets: { fontSize: 14, color: Colors.textSecondary },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
});

const statStyles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    gap: 4,
  },
  icon: { fontSize: 20 },
  value: { fontSize: 22, fontWeight: '800' },
  label: { fontSize: 11, color: Colors.textMuted, fontWeight: '600', textTransform: 'uppercase' },
});

const qaStyles = StyleSheet.create({
  card: {
    width: '47%',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 8,
  },
  icon: { fontSize: 24 },
  label: { fontSize: 14, fontWeight: '600', color: Colors.text },
});
