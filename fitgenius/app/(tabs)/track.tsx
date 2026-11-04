import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  TextInput,
  FlatList,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useWorkoutStore } from '@/store/workout';
import { Colors } from '@/constants/colors';
import { EXERCISES } from '@/constants/exercises';

export default function TrackScreen() {
  const { activeWorkout, startWorkout } = useWorkoutStore();
  const [workoutName, setWorkoutName] = useState('');
  const [showNameInput, setShowNameInput] = useState(false);

  const hasActiveWorkout = !!activeWorkout.startTime;

  const handleStart = () => {
    const name = workoutName.trim() || `Workout ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    startWorkout(name);
    router.push('/workout/session');
  };

  const suggestedWorkouts = [
    { name: 'Push Day', exercises: ['Push-Up', 'Dumbbell Shoulder Press', 'Bench Press'] },
    { name: 'Pull Day', exercises: ['Pull-Up', 'Dumbbell Row', 'Dumbbell Bicep Curl'] },
    { name: 'Leg Day', exercises: ['Barbell Back Squat', 'Romanian Deadlift', 'Forward Lunge'] },
    { name: 'Full Body', exercises: ['Deadlift', 'Push-Up', 'Dumbbell Row', 'Plank'] },
    { name: 'Cardio Blast', exercises: ['Jumping Jacks', 'Burpee', 'Running (Treadmill)'] },
  ];

  if (hasActiveWorkout) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.container}>
          <Text style={styles.title}>Active Workout</Text>
          <View style={styles.activeCard}>
            <Text style={styles.activeName}>{activeWorkout.name}</Text>
            <Text style={styles.activeTime}>
              Started {activeWorkout.startTime?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
            <Text style={styles.activeStat}>
              {activeWorkout.exercises.length} exercises · {activeWorkout.exercises.reduce((s, e) => s + e.sets.filter(x => x.completed).length, 0)} sets logged
            </Text>
            <TouchableOpacity
              style={styles.resumeButton}
              onPress={() => router.push('/workout/session')}
            >
              <Text style={styles.resumeText}>Resume Workout ▶</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <FlatList
        data={suggestedWorkouts}
        keyExtractor={(item) => item.name}
        ListHeaderComponent={() => (
          <View>
            <Text style={styles.title}>Start Workout</Text>

            {/* Quick Start */}
            <View style={styles.quickStart}>
              {showNameInput ? (
                <View style={styles.nameInputRow}>
                  <TextInput
                    style={styles.nameInput}
                    value={workoutName}
                    onChangeText={setWorkoutName}
                    placeholder="Workout name (optional)"
                    placeholderTextColor={Colors.textMuted}
                    autoFocus
                    accessibilityLabel="Workout name"
                  />
                  <TouchableOpacity style={styles.goButton} onPress={handleStart}>
                    <Text style={styles.goText}>Go</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.startBlankButton}
                  onPress={() => setShowNameInput(true)}
                  accessibilityRole="button"
                >
                  <Text style={styles.startBlankIcon}>+</Text>
                  <Text style={styles.startBlankText}>Start Empty Workout</Text>
                </TouchableOpacity>
              )}
            </View>

            <Text style={styles.sectionLabel}>Quick Start Templates</Text>
          </View>
        )}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.templateCard}
            onPress={() => {
              startWorkout(item.name);
              // Pre-populate exercises
              const store = useWorkoutStore.getState();
              item.exercises.forEach((exName) => {
                const ex = EXERCISES.find((e) => e.name === exName);
                if (ex) store.addExerciseToWorkout(ex);
              });
              router.push('/workout/session');
            }}
            activeOpacity={0.7}
            accessibilityRole="button"
          >
            <View style={styles.templateInfo}>
              <Text style={styles.templateName}>{item.name}</Text>
              <Text style={styles.templateExercises}>
                {item.exercises.join(' · ')}
              </Text>
            </View>
            <Text style={styles.templateStart}>Start →</Text>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  container: { flex: 1, padding: 20 },
  list: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 28, fontWeight: '800', color: Colors.text, marginBottom: 20 },
  activeCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.primary + '44',
    gap: 8,
  },
  activeName: { fontSize: 20, fontWeight: '700', color: Colors.text },
  activeTime: { fontSize: 14, color: Colors.textMuted },
  activeStat: { fontSize: 14, color: Colors.textSecondary },
  resumeButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  resumeText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  quickStart: { marginBottom: 28 },
  startBlankButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: Colors.primary,
    borderRadius: 14,
    padding: 18,
  },
  startBlankIcon: { color: '#fff', fontSize: 24, fontWeight: '300', lineHeight: 24 },
  startBlankText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  nameInputRow: { flexDirection: 'row', gap: 10 },
  nameInput: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: Colors.text,
  },
  goButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  goText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  templateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
  },
  templateInfo: { flex: 1, gap: 4 },
  templateName: { fontSize: 16, fontWeight: '700', color: Colors.text },
  templateExercises: { fontSize: 12, color: Colors.textMuted, lineHeight: 18 },
  templateStart: { color: Colors.primary, fontWeight: '700', fontSize: 16 },
});
