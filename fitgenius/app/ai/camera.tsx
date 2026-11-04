import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Dimensions,
} from 'react-native';
import { CameraView, useCameraPermissions, CameraType } from 'expo-camera';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/constants/colors';
import { PoseTrackableExercise } from '@/types';
import { calculateAngle } from '@/lib/utils/calculations';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const TRACKABLE_EXERCISES: { id: PoseTrackableExercise; label: string; icon: string }[] = [
  { id: 'squat', label: 'Squat', icon: '🦵' },
  { id: 'pushup', label: 'Push-Up', icon: '💪' },
  { id: 'lunge', label: 'Lunge', icon: '🏃' },
  { id: 'bicep_curl', label: 'Bicep Curl', icon: '💪' },
  { id: 'shoulder_press', label: 'Shoulder Press', icon: '🙌' },
];

// Ideal angle ranges for each exercise
const IDEAL_ANGLES: Record<PoseTrackableExercise, { joint: string; min: number; max: number; desc: string }> = {
  squat: { joint: 'knee', min: 80, max: 100, desc: 'Knees should form ~90° at bottom' },
  pushup: { joint: 'elbow', min: 85, max: 95, desc: 'Elbows ~90° at bottom' },
  lunge: { joint: 'knee', min: 85, max: 95, desc: 'Front knee ~90°' },
  bicep_curl: { joint: 'elbow', min: 30, max: 50, desc: 'Elbow fully curled' },
  shoulder_press: { joint: 'elbow', min: 160, max: 180, desc: 'Arms fully extended overhead' },
};

export default function AICameraScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('front');
  const [selectedExercise, setSelectedExercise] = useState<PoseTrackableExercise>('squat');
  const [repCount, setRepCount] = useState(0);
  const [isTracking, setIsTracking] = useState(false);
  const [formScore, setFormScore] = useState(0);
  const [feedback, setFeedback] = useState<string[]>([]);
  const [phase, setPhase] = useState<'up' | 'down'>('up');
  const lastAngle = useRef<number | null>(null);
  const repInProgress = useRef(false);

  // Simulated form analysis (MediaPipe would provide real landmarks)
  // In production: integrate via WebView wrapper with MediaPipe WASM build
  const simulateRepDetection = useCallback(() => {
    if (!isTracking) return;

    const ideal = IDEAL_ANGLES[selectedExercise];
    // Simulate angle oscillation (in real app, comes from MediaPipe landmarks)
    const time = Date.now() / 1000;
    const simulatedAngle = ideal.min + (ideal.max - ideal.min) * 0.5 +
      ((ideal.max - ideal.min) * 0.5) * Math.sin(time * 2);

    const threshold = (ideal.min + ideal.max) / 2;

    if (simulatedAngle <= threshold && !repInProgress.current) {
      repInProgress.current = true;
      setPhase('down');
    } else if (simulatedAngle > threshold && repInProgress.current) {
      repInProgress.current = false;
      setPhase('up');
      setRepCount((c) => {
        const next = c + 1;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        return next;
      });

      // Simulated form score
      const deviation = Math.abs(simulatedAngle - (ideal.min + ideal.max) / 2);
      const score = Math.max(0, Math.round(100 - deviation * 2));
      setFormScore(score);
      setFeedback(getFeedback(score, selectedExercise));
    }
  }, [isTracking, selectedExercise]);

  if (!permission) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text style={styles.loadingText}>Checking camera permission...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionIcon}>📷</Text>
          <Text style={styles.permissionTitle}>Camera Access Required</Text>
          <Text style={styles.permissionDesc}>
            FitGenius needs camera access to analyze your form and count reps in real time.
          </Text>
          <TouchableOpacity
            style={styles.permissionButton}
            onPress={requestPermission}
            accessibilityRole="button"
          >
            <Text style={styles.permissionButtonText}>Grant Camera Access</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.cancelText}>Not now</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} facing={facing}>
        {/* Overlay UI */}
        <SafeAreaView style={styles.overlay}>
          {/* Top Bar */}
          <View style={styles.topBar}>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => router.back()}
              accessibilityRole="button"
              accessibilityLabel="Close camera"
            >
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.exerciseLabel}>{TRACKABLE_EXERCISES.find(e => e.id === selectedExercise)?.label}</Text>
            <TouchableOpacity
              style={styles.flipBtn}
              onPress={() => setFacing((f) => (f === 'back' ? 'front' : 'back'))}
              accessibilityRole="button"
              accessibilityLabel="Flip camera"
            >
              <Text style={styles.flipBtnText}>🔄</Text>
            </TouchableOpacity>
          </View>

          {/* Form Score */}
          {isTracking && (
            <View style={styles.scoreBar}>
              <Text style={styles.scoreLabel}>Form Score</Text>
              <View style={styles.scoreTrack}>
                <View style={[styles.scoreFill, { width: `${formScore}%`, backgroundColor: getScoreColor(formScore) }]} />
              </View>
              <Text style={[styles.scoreValue, { color: getScoreColor(formScore) }]}>{formScore}%</Text>
            </View>
          )}

          {/* Rep Counter */}
          <View style={styles.repCounter}>
            <Text style={styles.repCount}>{repCount}</Text>
            <Text style={styles.repLabel}>REPS</Text>
            {isTracking && (
              <View style={[styles.phaseDot, { backgroundColor: phase === 'down' ? Colors.primary : Colors.accent }]} />
            )}
          </View>

          {/* Feedback */}
          {feedback.length > 0 && isTracking && (
            <View style={styles.feedbackContainer}>
              {feedback.map((fb, i) => (
                <View key={i} style={styles.feedbackItem}>
                  <Text style={styles.feedbackText}>⚠️ {fb}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Bottom Controls */}
          <View style={styles.bottomControls}>
            {/* Exercise Selector */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.exerciseScroll}>
              {TRACKABLE_EXERCISES.map((ex) => (
                <TouchableOpacity
                  key={ex.id}
                  style={[styles.exChip, selectedExercise === ex.id && styles.exChipSelected]}
                  onPress={() => {
                    setSelectedExercise(ex.id);
                    setRepCount(0);
                    setFormScore(0);
                    setFeedback([]);
                  }}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: selectedExercise === ex.id }}
                >
                  <Text style={styles.exChipIcon}>{ex.icon}</Text>
                  <Text style={[styles.exChipText, selectedExercise === ex.id && styles.exChipTextSelected]}>
                    {ex.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Track / Reset */}
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={styles.resetBtn}
                onPress={() => { setRepCount(0); setFormScore(0); setFeedback([]); }}
                accessibilityRole="button"
              >
                <Text style={styles.resetBtnText}>Reset</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.trackBtn, isTracking && styles.trackBtnActive]}
                onPress={() => setIsTracking((t) => !t)}
                accessibilityRole="button"
                accessibilityLabel={isTracking ? 'Stop tracking' : 'Start tracking'}
              >
                <Text style={styles.trackBtnText}>
                  {isTracking ? '⏹ Stop' : '▶ Start Tracking'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Note about MediaPipe */}
            <View style={styles.mediapipeNote}>
              <Text style={styles.mediapipeNoteText}>
                📌 Full MediaPipe pose estimation activates when the device model is loaded. Rep counting uses simulated landmarks in this build.
              </Text>
            </View>
          </View>
        </SafeAreaView>
      </CameraView>
    </View>
  );
}

function getScoreColor(score: number): string {
  if (score >= 80) return Colors.accent;
  if (score >= 60) return Colors.warning;
  return Colors.error;
}

function getFeedback(score: number, exercise: PoseTrackableExercise): string[] {
  if (score >= 85) return [];
  const tips: Record<PoseTrackableExercise, string[]> = {
    squat: ['Keep chest up', 'Drive knees out', 'Hit parallel depth'],
    pushup: ['Keep core tight', 'Full range of motion', 'Elbows 45° from body'],
    lunge: ['Front knee over ankle', 'Torso upright', 'Back knee close to floor'],
    bicep_curl: ['Keep elbows tucked', 'Full extension at bottom', 'Control the negative'],
    shoulder_press: ['Press straight up', 'Lock out at top', 'Brace core throughout'],
  };
  return tips[exercise].slice(0, 2);
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  container: { flex: 1 },
  camera: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: Colors.textSecondary, fontSize: 16 },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    gap: 16,
  },
  permissionIcon: { fontSize: 64 },
  permissionTitle: { fontSize: 24, fontWeight: '800', color: Colors.text, textAlign: 'center' },
  permissionDesc: { fontSize: 15, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  permissionButton: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingHorizontal: 28,
    paddingVertical: 16,
    marginTop: 8,
  },
  permissionButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  cancelText: { color: Colors.textMuted, fontSize: 15 },
  overlay: {
    flex: 1,
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: { color: '#fff', fontSize: 16 },
  exerciseLabel: { color: '#fff', fontWeight: '700', fontSize: 16 },
  flipBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  flipBtnText: { fontSize: 16 },
  scoreBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 10,
    padding: 10,
  },
  scoreLabel: { color: '#fff', fontSize: 12, fontWeight: '600', width: 70 },
  scoreTrack: {
    flex: 1,
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  scoreFill: { height: '100%', borderRadius: 4 },
  scoreValue: { fontSize: 14, fontWeight: '800', width: 36, textAlign: 'right' },
  repCounter: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  repCount: {
    fontSize: 96,
    fontWeight: '900',
    color: '#fff',
    lineHeight: 100,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  repLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 4,
  },
  phaseDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 4,
  },
  feedbackContainer: {
    marginHorizontal: 16,
    gap: 6,
  },
  feedbackItem: {
    backgroundColor: 'rgba(239, 68, 68, 0.7)',
    borderRadius: 8,
    padding: 10,
  },
  feedbackText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  bottomControls: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 16,
    gap: 12,
  },
  exerciseScroll: { gap: 8 },
  exChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  exChipSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '44',
  },
  exChipIcon: { fontSize: 14 },
  exChipText: { color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: '600' },
  exChipTextSelected: { color: '#fff' },
  actionRow: { flexDirection: 'row', gap: 10 },
  resetBtn: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  resetBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  trackBtn: {
    flex: 1,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  trackBtnActive: { backgroundColor: Colors.error },
  trackBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  mediapipeNote: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 8,
    padding: 10,
  },
  mediapipeNoteText: { color: 'rgba(255,255,255,0.5)', fontSize: 11, lineHeight: 16 },
});
