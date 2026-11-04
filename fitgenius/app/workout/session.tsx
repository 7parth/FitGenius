import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useWorkoutStore } from '@/store/workout';
import { useAuthStore } from '@/store/auth';
import { EXERCISES } from '@/constants/exercises';
import { Colors } from '@/constants/colors';
import { formatDuration, estimateCaloriesBurned } from '@/lib/utils/calculations';

export default function WorkoutSessionScreen() {
  const {
    activeWorkout,
    addExerciseToWorkout,
    updateSet,
    completeSet,
    startRest,
    tickRest,
    finishWorkout,
    discardWorkout,
  } = useWorkoutStore();
  const { user } = useAuthStore();

  const [elapsed, setElapsed] = useState(0);
  const [saving, setSaving] = useState(false);
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const restTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Elapsed timer
  useEffect(() => {
    if (!activeWorkout.startTime) return;
    timerRef.current = setInterval(() => {
      const secs = Math.round((Date.now() - activeWorkout.startTime!.getTime()) / 1000);
      setElapsed(secs);
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [activeWorkout.startTime]);

  // Rest timer
  useEffect(() => {
    if (activeWorkout.isResting) {
      restTimerRef.current = setInterval(() => tickRest(), 1000);
    } else {
      if (restTimerRef.current) clearInterval(restTimerRef.current);
    }
    return () => { if (restTimerRef.current) clearInterval(restTimerRef.current); };
  }, [activeWorkout.isResting]);

  const handleCompleteSet = (exIdx: number, setIdx: number) => {
    completeSet(exIdx, setIdx);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Start 60s rest timer
    startRest(60);
  };

  const handleFinish = async () => {
    Alert.alert('Finish Workout', 'Save and finish this workout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Finish',
        onPress: async () => {
          if (!user) return;
          setSaving(true);
          const { error } = await finishWorkout(user.id);
          setSaving(false);
          if (error) {
            Alert.alert('Error', error);
          } else {
            router.back();
          }
        },
      },
    ]);
  };

  const handleDiscard = () => {
    Alert.alert('Discard Workout', 'Are you sure? All progress will be lost.', [
      { text: 'Keep Going', style: 'cancel' },
      {
        text: 'Discard',
        style: 'destructive',
        onPress: () => {
          discardWorkout();
          router.back();
        },
      },
    ]);
  };

  const totalSetsCompleted = activeWorkout.exercises.reduce(
    (sum, ex) => sum + ex.sets.filter((s) => s.completed).length, 0
  );
  const calories = estimateCaloriesBurned(elapsed, 75); // rough default

  if (!activeWorkout.startTime) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No active workout.</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.back}>← Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* Rest Timer Banner */}
      {activeWorkout.isResting && (
        <View style={styles.restBanner}>
          <Text style={styles.restBannerText}>
            😮‍💨 Rest: {formatDuration(activeWorkout.restTimeRemaining)}
          </Text>
          <TouchableOpacity onPress={() => useWorkoutStore.setState((s) => ({
            activeWorkout: { ...s.activeWorkout, isResting: false, restTimeRemaining: 0 }
          }))}>
            <Text style={styles.skipRest}>Skip</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.workoutName}>{activeWorkout.name}</Text>
          <Text style={styles.timerText}>{formatDuration(elapsed)}</Text>
        </View>
        <View style={styles.headerStats}>
          <Text style={styles.headerStat}>{totalSetsCompleted} sets</Text>
          <Text style={styles.headerStat}>~{calories} kcal</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Exercise List */}
        {activeWorkout.exercises.length === 0 ? (
          <View style={styles.emptyExercises}>
            <Text style={styles.emptyExercisesText}>
              No exercises added yet. Add your first exercise below.
            </Text>
          </View>
        ) : (
          activeWorkout.exercises.map((exGroup, exIdx) => (
            <View key={exIdx} style={styles.exerciseBlock}>
              <View style={styles.exerciseHeader}>
                <Text style={styles.exerciseName}>{exGroup.exercise.name}</Text>
                {exGroup.exercise.pose_trackable && (
                  <TouchableOpacity
                    onPress={() => router.push('/ai/camera')}
                    style={styles.aiBtn}
                    accessibilityRole="button"
                  >
                    <Text style={styles.aiBtnText}>🤖</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Set Headers */}
              <View style={styles.setHeader}>
                <Text style={[styles.setHeaderText, { width: 32 }]}>Set</Text>
                <Text style={[styles.setHeaderText, { flex: 1 }]}>Reps</Text>
                <Text style={[styles.setHeaderText, { flex: 1 }]}>Weight (kg)</Text>
                <Text style={[styles.setHeaderText, { width: 44 }]}>✓</Text>
              </View>

              {exGroup.sets.map((set, setIdx) => (
                <View key={setIdx} style={[styles.setRow, set.completed && styles.setRowDone]}>
                  <Text style={styles.setNum}>{set.set_number}</Text>
                  <TextInput
                    style={styles.setInput}
                    value={set.reps}
                    onChangeText={(v) => updateSet(exIdx, setIdx, 'reps', v)}
                    placeholder="12"
                    placeholderTextColor={Colors.textMuted}
                    keyboardType="number-pad"
                    editable={!set.completed}
                    accessibilityLabel={`Set ${set.set_number} reps`}
                  />
                  <TextInput
                    style={styles.setInput}
                    value={set.weight}
                    onChangeText={(v) => updateSet(exIdx, setIdx, 'weight', v)}
                    placeholder="0"
                    placeholderTextColor={Colors.textMuted}
                    keyboardType="decimal-pad"
                    editable={!set.completed}
                    accessibilityLabel={`Set ${set.set_number} weight`}
                  />
                  <TouchableOpacity
                    style={[styles.checkBtn, set.completed && styles.checkBtnDone]}
                    onPress={() => !set.completed && handleCompleteSet(exIdx, setIdx)}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: set.completed }}
                  >
                    <Text style={styles.checkBtnText}>{set.completed ? '✓' : '○'}</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          ))
        )}

        {/* Add Exercise Button */}
        <TouchableOpacity
          style={styles.addExerciseBtn}
          onPress={() => setShowExercisePicker(true)}
          accessibilityRole="button"
        >
          <Text style={styles.addExerciseText}>+ Add Exercise</Text>
        </TouchableOpacity>

        {/* Exercise Picker (inline) */}
        {showExercisePicker && (
          <View style={styles.picker}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>Pick an Exercise</Text>
              <TouchableOpacity onPress={() => setShowExercisePicker(false)}>
                <Text style={styles.pickerClose}>✕</Text>
              </TouchableOpacity>
            </View>
            {EXERCISES.map((ex) => (
              <TouchableOpacity
                key={ex.id}
                style={styles.pickerItem}
                onPress={() => {
                  addExerciseToWorkout(ex);
                  setShowExercisePicker(false);
                }}
                accessibilityRole="button"
              >
                <Text style={styles.pickerItemName}>{ex.name}</Text>
                <Text style={styles.pickerItemMeta}>{ex.category} · {ex.difficulty}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Footer Actions */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.discardBtn} onPress={handleDiscard}>
          <Text style={styles.discardText}>Discard</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.finishBtn, saving && styles.buttonDisabled]}
          onPress={handleFinish}
          disabled={saving}
          accessibilityRole="button"
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.finishText}>Finish Workout</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  emptyText: { color: Colors.textSecondary, fontSize: 16 },
  back: { color: Colors.primary, fontSize: 16 },
  restBanner: {
    backgroundColor: Colors.warning + '22',
    borderBottomWidth: 1,
    borderBottomColor: Colors.warning + '44',
    paddingHorizontal: 20,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  restBannerText: { fontSize: 15, fontWeight: '700', color: Colors.warning },
  skipRest: { color: Colors.primary, fontWeight: '600', fontSize: 14 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  workoutName: { fontSize: 18, fontWeight: '800', color: Colors.text },
  timerText: { fontSize: 28, fontWeight: '300', color: Colors.primary, fontVariant: ['tabular-nums'] },
  headerStats: { alignItems: 'flex-end', gap: 4 },
  headerStat: { fontSize: 13, color: Colors.textSecondary },
  content: { padding: 16, paddingBottom: 120, gap: 16 },
  emptyExercises: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 24,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  emptyExercisesText: { color: Colors.textSecondary, fontSize: 14, textAlign: 'center' },
  exerciseBlock: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 10,
  },
  exerciseHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  exerciseName: { fontSize: 16, fontWeight: '700', color: Colors.text, flex: 1 },
  aiBtn: {
    backgroundColor: 'rgba(79, 70, 229, 0.15)',
    borderRadius: 8,
    padding: 6,
  },
  aiBtnText: { fontSize: 16 },
  setHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  setHeaderText: { fontSize: 11, color: Colors.textMuted, fontWeight: '700', textTransform: 'uppercase', textAlign: 'center' },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 10,
    padding: 8,
  },
  setRowDone: { opacity: 0.6 },
  setNum: { width: 32, textAlign: 'center', fontSize: 15, fontWeight: '700', color: Colors.textSecondary },
  setInput: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: 8,
    padding: 8,
    fontSize: 16,
    color: Colors.text,
    textAlign: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  checkBtn: {
    width: 44,
    height: 36,
    borderRadius: 8,
    backgroundColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkBtnDone: { backgroundColor: Colors.accent },
  checkBtnText: { fontSize: 16, color: Colors.text, fontWeight: '700' },
  addExerciseBtn: {
    borderWidth: 1,
    borderColor: Colors.primary + '66',
    borderRadius: 12,
    borderStyle: 'dashed',
    padding: 16,
    alignItems: 'center',
  },
  addExerciseText: { color: Colors.primary, fontWeight: '700', fontSize: 15 },
  picker: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  pickerTitle: { fontSize: 16, fontWeight: '700', color: Colors.text },
  pickerClose: { fontSize: 18, color: Colors.textMuted },
  pickerItem: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 2,
  },
  pickerItemName: { fontSize: 15, fontWeight: '600', color: Colors.text },
  pickerItemMeta: { fontSize: 12, color: Colors.textMuted, textTransform: 'capitalize' },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: 16,
    paddingBottom: 32,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: 10,
  },
  discardBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.error + '66',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  discardText: { color: Colors.error, fontWeight: '700', fontSize: 15 },
  finishBtn: {
    flex: 2,
    backgroundColor: Colors.accent,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.6 },
  finishText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
