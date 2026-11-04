import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { EXERCISES } from '@/constants/exercises';
import { useWorkoutStore } from '@/store/workout';
import { Colors } from '@/constants/colors';

const DIFFICULTY_COLORS = {
  beginner: Colors.accent,
  intermediate: Colors.warning,
  advanced: Colors.error,
};

const MUSCLE_COLORS: Record<string, string> = {
  chest: Colors.chest,
  back: Colors.back,
  legs: Colors.legs,
  shoulders: Colors.shoulders,
  arms: Colors.arms,
  core: Colors.core,
  cardio: Colors.cardio,
};

export default function ExerciseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const exercise = EXERCISES.find((e) => e.id === id);
  const { addExerciseToWorkout, activeWorkout, startWorkout } = useWorkoutStore();
  const [added, setAdded] = useState(false);

  if (!exercise) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.notFound}>
          <Text style={styles.notFoundText}>Exercise not found.</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.back}>← Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const handleAddToWorkout = () => {
    if (!activeWorkout.startTime) {
      startWorkout('Workout');
    }
    addExerciseToWorkout(exercise);
    setAdded(true);
  };

  const getMuscleColor = (muscle: string) => {
    for (const [key, color] of Object.entries(MUSCLE_COLORS)) {
      if (muscle.toLowerCase().includes(key)) return color;
    }
    return Colors.primary;
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
        </View>

        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <Text style={styles.heroEmoji}>🏋️</Text>
          </View>
          <Text style={styles.name}>{exercise.name}</Text>
          <View style={styles.heroMeta}>
            <View
              style={[
                styles.diffBadge,
                { backgroundColor: DIFFICULTY_COLORS[exercise.difficulty] + '22' },
              ]}
            >
              <Text style={[styles.diffText, { color: DIFFICULTY_COLORS[exercise.difficulty] }]}>
                {exercise.difficulty}
              </Text>
            </View>
            <Text style={styles.category}>{exercise.category}</Text>
            {exercise.pose_trackable && (
              <View style={styles.aiTag}>
                <Text style={styles.aiTagText}>🤖 AI Trackable</Text>
              </View>
            )}
          </View>
        </View>

        {/* Muscle Groups */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Muscle Groups</Text>
          <View style={styles.muscleGrid}>
            {exercise.muscle_groups.map((m) => (
              <View
                key={m}
                style={[styles.muscleChip, { backgroundColor: getMuscleColor(m) + '22', borderColor: getMuscleColor(m) + '55' }]}
              >
                <Text style={[styles.muscleChipText, { color: getMuscleColor(m) }]}>
                  {m}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Equipment */}
        {exercise.equipment.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Equipment Needed</Text>
            <View style={styles.equipmentRow}>
              {exercise.equipment.map((e) => (
                <View key={e} style={styles.equipChip}>
                  <Text style={styles.equipText}>{e}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Instructions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How to Do It</Text>
          <View style={styles.instructions}>
            {exercise.instructions.map((step, i) => (
              <View key={i} style={styles.step}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>{i + 1}</Text>
                </View>
                <Text style={styles.stepText}>{step}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* AI Pose Estimation */}
        {exercise.pose_trackable && (
          <View style={styles.aiSection}>
            <Text style={styles.aiSectionTitle}>🤖 AI Form Analysis Available</Text>
            <Text style={styles.aiSectionDesc}>
              Use the AI camera to get real-time form feedback, rep counting, and a form score while performing this exercise.
            </Text>
            <TouchableOpacity
              style={styles.aiButton}
              onPress={() => router.push('/ai/camera')}
              accessibilityRole="button"
            >
              <Text style={styles.aiButtonText}>Open AI Camera</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Bottom CTA */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.addButton, added && styles.addButtonAdded]}
          onPress={handleAddToWorkout}
          disabled={added}
          accessibilityRole="button"
          accessibilityLabel={added ? 'Added to workout' : 'Add to workout'}
        >
          <Text style={styles.addButtonText}>
            {added ? '✓ Added to Workout' : '+ Add to Workout'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 20, paddingBottom: 100 },
  notFound: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  notFoundText: { color: Colors.textSecondary, fontSize: 16 },
  back: { color: Colors.primary, fontSize: 16 },
  header: { marginBottom: 16 },
  backBtn: { alignSelf: 'flex-start' },
  backText: { color: Colors.primary, fontSize: 16 },
  hero: { alignItems: 'center', marginBottom: 28, gap: 10 },
  heroIcon: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  heroEmoji: { fontSize: 36 },
  name: { fontSize: 26, fontWeight: '800', color: Colors.text, textAlign: 'center' },
  heroMeta: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8 },
  diffBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  diffText: { fontSize: 13, fontWeight: '700', textTransform: 'capitalize' },
  category: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: Colors.surface,
    borderRadius: 10,
    fontSize: 13,
    color: Colors.textSecondary,
    textTransform: 'capitalize',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  aiTag: {
    backgroundColor: 'rgba(79, 70, 229, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  aiTagText: { fontSize: 13, color: Colors.primary, fontWeight: '600' },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: 12 },
  muscleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  muscleChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  muscleChipText: { fontSize: 13, fontWeight: '600', textTransform: 'capitalize' },
  equipmentRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  equipChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: Colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  equipText: { fontSize: 13, color: Colors.textSecondary, textTransform: 'capitalize' },
  instructions: { gap: 12 },
  step: { flexDirection: 'row', gap: 14, alignItems: 'flex-start' },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 1,
  },
  stepNumberText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  stepText: { flex: 1, fontSize: 15, color: Colors.text, lineHeight: 22 },
  aiSection: {
    backgroundColor: 'rgba(79, 70, 229, 0.08)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.primary + '44',
    gap: 10,
  },
  aiSectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.text },
  aiSectionDesc: { fontSize: 14, color: Colors.textSecondary, lineHeight: 20 },
  aiButton: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
  },
  aiButtonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: 36,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  addButton: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
  },
  addButtonAdded: { backgroundColor: Colors.accent },
  addButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
