import React, { useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { useAuthStore } from '@/store/auth';
import { useWorkoutStore } from '@/store/workout';
import { Colors } from '@/constants/colors';
import { formatDuration, calculateVolume } from '@/lib/utils/calculations';
import { WorkoutWithSets } from '@/types';

export default function ProgressScreen() {
  const { user } = useAuthStore();
  const { workouts, fetchWorkoutHistory, loadingHistory } = useWorkoutStore();

  useEffect(() => {
    if (user) fetchWorkoutHistory(user.id);
  }, [user]);

  if (loadingHistory) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const totalWorkouts = workouts.length;
  const totalVolume = workouts.reduce((sum, w) => sum + calculateVolume(w.sets), 0);
  const totalDuration = workouts.reduce((sum, w) => sum + (w.duration ?? 0), 0);
  const avgDuration = totalWorkouts > 0 ? Math.round(totalDuration / totalWorkouts) : 0;

  // Weekly frequency for the last 4 weeks
  const weeklyData = getWeeklyData(workouts);

  // Personal records
  const personalRecords = getPersonalRecords(workouts);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Your Progress</Text>

        {/* Summary Stats */}
        <View style={styles.statsGrid}>
          <StatBox label="Total Workouts" value={String(totalWorkouts)} icon="🏋️" />
          <StatBox label="Total Volume" value={`${(totalVolume / 1000).toFixed(1)}t`} icon="⚖️" />
          <StatBox label="Total Time" value={formatDuration(totalDuration)} icon="⏱️" />
          <StatBox label="Avg Duration" value={formatDuration(avgDuration)} icon="📊" />
        </View>

        {/* Weekly Activity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Weekly Activity</Text>
          {weeklyData.length === 0 ? (
            <EmptyState text="Complete your first workout to see weekly trends." />
          ) : (
            <View style={styles.weekChart}>
              {weeklyData.map((week, i) => {
                const maxCount = Math.max(...weeklyData.map((w) => w.count), 1);
                const height = Math.max(8, (week.count / maxCount) * 80);
                return (
                  <View key={i} style={styles.barWrapper}>
                    <Text style={styles.barCount}>{week.count > 0 ? week.count : ''}</Text>
                    <View
                      style={[
                        styles.bar,
                        {
                          height,
                          backgroundColor: i === weeklyData.length - 1 ? Colors.primary : Colors.primaryLight + '66',
                        },
                      ]}
                    />
                    <Text style={styles.barLabel}>{week.label}</Text>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* Personal Records */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Records</Text>
          {personalRecords.length === 0 ? (
            <EmptyState text="Log sets with weights to track your personal records." />
          ) : (
            <View style={styles.prList}>
              {personalRecords.map((pr) => (
                <View key={pr.exerciseName} style={styles.prRow}>
                  <Text style={styles.prName}>{pr.exerciseName}</Text>
                  <View style={styles.prValues}>
                    <Text style={styles.prWeight}>{pr.maxWeight}kg</Text>
                    <Text style={styles.prReps}>× {pr.repsAtMax}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Workout History */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Workout History</Text>
          {workouts.length === 0 ? (
            <EmptyState text="No workouts yet. Start tracking to see your history here." />
          ) : (
            workouts.map((workout) => (
              <WorkoutHistoryItem key={workout.id} workout={workout} />
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatBox({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <View style={styles.statBox}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyText}>{text}</Text>
    </View>
  );
}

function WorkoutHistoryItem({ workout }: { workout: WorkoutWithSets }) {
  const volume = calculateVolume(workout.sets);
  const date = new Date(workout.date);
  return (
    <View style={styles.historyCard}>
      <View style={styles.historyLeft}>
        <Text style={styles.historyDate}>
          {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </Text>
        <Text style={styles.historyDay}>
          {date.toLocaleDateString('en-US', { weekday: 'short' })}
        </Text>
      </View>
      <View style={styles.historyContent}>
        <Text style={styles.historyName}>{workout.name}</Text>
        <Text style={styles.historyMeta}>
          {workout.sets.length} sets
          {workout.duration ? ` · ${formatDuration(workout.duration)}` : ''}
          {volume > 0 ? ` · ${(volume / 1000).toFixed(1)}t volume` : ''}
        </Text>
      </View>
    </View>
  );
}

function getWeeklyData(workouts: WorkoutWithSets[]) {
  const weeks: { label: string; count: number }[] = [];
  const now = new Date();

  for (let i = 3; i >= 0; i--) {
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay() - i * 7);
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);

    const count = workouts.filter((w) => {
      const d = new Date(w.date);
      return d >= weekStart && d < weekEnd;
    }).length;

    weeks.push({
      label: i === 0 ? 'This' : `${i}w`,
      count,
    });
  }

  return weeks;
}

function getPersonalRecords(workouts: WorkoutWithSets[]) {
  const records: Record<string, { maxWeight: number; repsAtMax: number }> = {};

  for (const workout of workouts) {
    for (const set of workout.sets) {
      if (!set.exercise || !set.weight || !set.reps) continue;
      const name = set.exercise.name;
      if (!records[name] || set.weight > records[name].maxWeight) {
        records[name] = { maxWeight: set.weight, repsAtMax: set.reps };
      }
    }
  }

  return Object.entries(records)
    .map(([exerciseName, data]) => ({ exerciseName, ...data }))
    .sort((a, b) => b.maxWeight - a.maxWeight)
    .slice(0, 10);
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 28, fontWeight: '800', color: Colors.text, marginBottom: 20 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 28 },
  statBox: {
    width: '47%',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 4,
    alignItems: 'center',
  },
  statIcon: { fontSize: 22 },
  statValue: { fontSize: 22, fontWeight: '800', color: Colors.primary },
  statLabel: { fontSize: 11, color: Colors.textMuted, fontWeight: '600', textTransform: 'uppercase', textAlign: 'center' },
  section: { marginBottom: 28 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: Colors.text, marginBottom: 14 },
  weekChart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    paddingTop: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    height: 130,
  },
  barWrapper: { flex: 1, alignItems: 'center', gap: 6 },
  bar: { width: '60%', borderRadius: 6, minHeight: 8 },
  barCount: { fontSize: 11, color: Colors.textMuted, fontWeight: '600' },
  barLabel: { fontSize: 11, color: Colors.textMuted, fontWeight: '600' },
  prList: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  prRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  prName: { fontSize: 15, color: Colors.text, fontWeight: '500', flex: 1 },
  prValues: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  prWeight: { fontSize: 16, fontWeight: '800', color: Colors.accent },
  prReps: { fontSize: 13, color: Colors.textMuted },
  emptyState: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  emptyText: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20 },
  historyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 14,
  },
  historyLeft: { alignItems: 'center', width: 40 },
  historyDate: { fontSize: 15, fontWeight: '700', color: Colors.text },
  historyDay: { fontSize: 11, color: Colors.textMuted },
  historyContent: { flex: 1, gap: 3 },
  historyName: { fontSize: 15, fontWeight: '600', color: Colors.text },
  historyMeta: { fontSize: 12, color: Colors.textMuted },
});
