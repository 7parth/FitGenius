import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '@/store/auth';
import { useProfileStore } from '@/store/profile';
import { Colors } from '@/constants/colors';
import { FitnessGoal, FitnessLevel, Equipment, Gender } from '@/types';

const TOTAL_STEPS = 6;

interface OnboardingData {
  name: string;
  age: string;
  gender: Gender;
  fitness_goal: FitnessGoal;
  fitness_level: FitnessLevel;
  equipment: Equipment;
  health_conditions: string[];
  weekly_frequency: number;
  workout_duration: number;
  weight: string;
  height: string;
}

const GOALS: { value: FitnessGoal; label: string; icon: string; desc: string }[] = [
  { value: 'weight_loss', label: 'Lose Weight', icon: '🔥', desc: 'Burn fat and get leaner' },
  { value: 'muscle_gain', label: 'Build Muscle', icon: '💪', desc: 'Gain strength and size' },
  { value: 'endurance', label: 'Improve Endurance', icon: '🏃', desc: 'Run farther, last longer' },
  { value: 'flexibility', label: 'Get Flexible', icon: '🧘', desc: 'Mobility and recovery' },
];

const LEVELS: { value: FitnessLevel; label: string; desc: string }[] = [
  { value: 'beginner', label: 'Beginner', desc: 'New to working out' },
  { value: 'intermediate', label: 'Intermediate', desc: 'Training for 6+ months' },
  { value: 'advanced', label: 'Advanced', desc: 'Training for 2+ years' },
];

const EQUIPMENT_OPTIONS: { value: Equipment; label: string; icon: string; desc: string }[] = [
  { value: 'none', label: 'No Equipment', icon: '🏠', desc: 'Bodyweight only' },
  { value: 'basic', label: 'Basic', icon: '🥊', desc: 'Dumbbells, resistance bands' },
  { value: 'full_gym', label: 'Full Gym', icon: '🏋️', desc: 'All machines and free weights' },
];

const HEALTH_CONDITIONS = [
  'Lower back pain', 'Knee problems', 'Shoulder injury',
  'High blood pressure', 'Diabetes', 'Asthma', 'None',
];

export default function OnboardingScreen() {
  const { user } = useAuthStore();
  const { createProfile, loading } = useProfileStore();

  const [step, setStep] = useState(1);
  const [data, setData] = useState<OnboardingData>({
    name: '',
    age: '',
    gender: 'prefer_not_to_say',
    fitness_goal: 'weight_loss',
    fitness_level: 'beginner',
    equipment: 'none',
    health_conditions: ['None'],
    weekly_frequency: 3,
    workout_duration: 45,
    weight: '',
    height: '',
  });

  const update = <K extends keyof OnboardingData>(key: K, value: OnboardingData[K]) => {
    setData((prev) => ({ ...prev, [key]: value }));
  };

  const toggleHealthCondition = (condition: string) => {
    if (condition === 'None') {
      update('health_conditions', ['None']);
      return;
    }
    const current = data.health_conditions.filter((c) => c !== 'None');
    if (current.includes(condition)) {
      const next = current.filter((c) => c !== condition);
      update('health_conditions', next.length === 0 ? ['None'] : next);
    } else {
      update('health_conditions', [...current, condition]);
    }
  };

  const handleFinish = async () => {
    if (!user) return;
    const { error } = await createProfile(user.id, {
      name: data.name,
      age: parseInt(data.age) || 25,
      gender: data.gender,
      fitness_goal: data.fitness_goal,
      fitness_level: data.fitness_level,
      equipment: data.equipment,
      health_conditions: data.health_conditions,
      weekly_frequency: data.weekly_frequency,
      workout_duration: data.workout_duration,
      weight: parseFloat(data.weight) || 70,
      height: parseFloat(data.height) || 170,
    });
    if (!error) {
      router.replace('/(tabs)');
    }
  };

  const canProceed = (): boolean => {
    switch (step) {
      case 1: return data.name.trim().length >= 2;
      default: return true;
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return <StepBasicInfo data={data} update={update} />;
      case 2:
        return <StepGoal data={data} update={update} />;
      case 3:
        return <StepLevel data={data} update={update} />;
      case 4:
        return <StepEquipment data={data} update={update} />;
      case 5:
        return <StepHealthConditions data={data} toggle={toggleHealthCondition} />;
      case 6:
        return <StepSchedule data={data} update={update} />;
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      {/* Progress bar */}
      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, { width: `${(step / TOTAL_STEPS) * 100}%` }]} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.stepText}>Step {step} of {TOTAL_STEPS}</Text>
        {renderStep()}
      </ScrollView>

      <View style={styles.footer}>
        {step > 1 && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setStep((s) => s - 1)}
          >
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
        )}

        {step < TOTAL_STEPS ? (
          <TouchableOpacity
            style={[styles.nextButton, !canProceed() && styles.buttonDisabled]}
            onPress={() => setStep((s) => s + 1)}
            disabled={!canProceed()}
            accessibilityRole="button"
          >
            <Text style={styles.nextText}>Continue</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.nextButton, loading && styles.buttonDisabled]}
            onPress={handleFinish}
            disabled={loading}
            accessibilityRole="button"
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.nextText}>Let's Go! 🚀</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

function StepBasicInfo({ data, update }: { data: OnboardingData; update: any }) {
  const genders: { value: Gender; label: string }[] = [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'other', label: 'Other' },
    { value: 'prefer_not_to_say', label: 'Prefer not to say' },
  ];
  return (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Tell us about yourself</Text>
      <Text style={styles.stepSubtitle}>This helps us personalize your experience</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Your Name</Text>
        <TextInput
          style={styles.input}
          value={data.name}
          onChangeText={(v) => update('name', v)}
          placeholder="Enter your name"
          placeholderTextColor={Colors.textMuted}
          autoFocus
          accessibilityLabel="Your name"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Age</Text>
        <TextInput
          style={styles.input}
          value={data.age}
          onChangeText={(v) => update('age', v)}
          placeholder="25"
          placeholderTextColor={Colors.textMuted}
          keyboardType="number-pad"
          accessibilityLabel="Your age"
        />
      </View>

      <View style={styles.inputRow}>
        <View style={[styles.inputGroup, { flex: 1 }]}>
          <Text style={styles.label}>Weight (kg)</Text>
          <TextInput
            style={styles.input}
            value={data.weight}
            onChangeText={(v) => update('weight', v)}
            placeholder="70"
            placeholderTextColor={Colors.textMuted}
            keyboardType="decimal-pad"
            accessibilityLabel="Weight in kilograms"
          />
        </View>
        <View style={[styles.inputGroup, { flex: 1 }]}>
          <Text style={styles.label}>Height (cm)</Text>
          <TextInput
            style={styles.input}
            value={data.height}
            onChangeText={(v) => update('height', v)}
            placeholder="170"
            placeholderTextColor={Colors.textMuted}
            keyboardType="decimal-pad"
            accessibilityLabel="Height in centimeters"
          />
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Gender</Text>
        <View style={styles.chipGrid}>
          {genders.map((g) => (
            <TouchableOpacity
              key={g.value}
              style={[styles.chip, data.gender === g.value && styles.chipSelected]}
              onPress={() => update('gender', g.value)}
              accessibilityRole="radio"
              accessibilityState={{ selected: data.gender === g.value }}
            >
              <Text style={[styles.chipText, data.gender === g.value && styles.chipTextSelected]}>
                {g.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
}

function StepGoal({ data, update }: { data: OnboardingData; update: any }) {
  return (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>What's your main goal?</Text>
      <Text style={styles.stepSubtitle}>We'll build your plan around this</Text>
      <View style={styles.cardGrid}>
        {GOALS.map((g) => (
          <TouchableOpacity
            key={g.value}
            style={[styles.goalCard, data.fitness_goal === g.value && styles.goalCardSelected]}
            onPress={() => update('fitness_goal', g.value)}
            accessibilityRole="radio"
            accessibilityState={{ selected: data.fitness_goal === g.value }}
          >
            <Text style={styles.goalIcon}>{g.icon}</Text>
            <Text style={[styles.goalLabel, data.fitness_goal === g.value && styles.goalLabelSelected]}>
              {g.label}
            </Text>
            <Text style={styles.goalDesc}>{g.desc}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

function StepLevel({ data, update }: { data: OnboardingData; update: any }) {
  return (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Your fitness level</Text>
      <Text style={styles.stepSubtitle}>Be honest — we'll adjust as you progress</Text>
      <View style={styles.listOptions}>
        {LEVELS.map((l) => (
          <TouchableOpacity
            key={l.value}
            style={[styles.listOption, data.fitness_level === l.value && styles.listOptionSelected]}
            onPress={() => update('fitness_level', l.value)}
            accessibilityRole="radio"
            accessibilityState={{ selected: data.fitness_level === l.value }}
          >
            <View style={styles.listOptionContent}>
              <Text style={[styles.listOptionLabel, data.fitness_level === l.value && styles.listOptionLabelSelected]}>
                {l.label}
              </Text>
              <Text style={styles.listOptionDesc}>{l.desc}</Text>
            </View>
            {data.fitness_level === l.value && (
              <View style={styles.radioFilled} />
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

function StepEquipment({ data, update }: { data: OnboardingData; update: any }) {
  return (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Equipment available</Text>
      <Text style={styles.stepSubtitle}>We'll only suggest what you can actually do</Text>
      <View style={styles.cardGrid}>
        {EQUIPMENT_OPTIONS.map((e) => (
          <TouchableOpacity
            key={e.value}
            style={[styles.goalCard, data.equipment === e.value && styles.goalCardSelected]}
            onPress={() => update('equipment', e.value)}
            accessibilityRole="radio"
            accessibilityState={{ selected: data.equipment === e.value }}
          >
            <Text style={styles.goalIcon}>{e.icon}</Text>
            <Text style={[styles.goalLabel, data.equipment === e.value && styles.goalLabelSelected]}>
              {e.label}
            </Text>
            <Text style={styles.goalDesc}>{e.desc}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

function StepHealthConditions({ data, toggle }: { data: OnboardingData; toggle: (c: string) => void }) {
  return (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Any health conditions?</Text>
      <Text style={styles.stepSubtitle}>Select all that apply so we can modify exercises</Text>
      <View style={styles.chipGrid}>
        {HEALTH_CONDITIONS.map((condition) => {
          const selected = data.health_conditions.includes(condition);
          return (
            <TouchableOpacity
              key={condition}
              style={[styles.chip, selected && styles.chipSelected]}
              onPress={() => toggle(condition)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: selected }}
            >
              <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                {condition}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

function StepSchedule({ data, update }: { data: OnboardingData; update: any }) {
  const frequencies = [2, 3, 4, 5, 6];
  const durations = [20, 30, 45, 60, 90];

  return (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Your schedule</Text>
      <Text style={styles.stepSubtitle}>How often and how long can you train?</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Days per week</Text>
        <View style={styles.chipRow}>
          {frequencies.map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.numChip, data.weekly_frequency === f && styles.chipSelected]}
              onPress={() => update('weekly_frequency', f)}
              accessibilityRole="radio"
              accessibilityState={{ selected: data.weekly_frequency === f }}
            >
              <Text style={[styles.numChipText, data.weekly_frequency === f && styles.chipTextSelected]}>
                {f}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Session duration (minutes)</Text>
        <View style={styles.chipRow}>
          {durations.map((d) => (
            <TouchableOpacity
              key={d}
              style={[styles.numChip, data.workout_duration === d && styles.chipSelected]}
              onPress={() => update('workout_duration', d)}
              accessibilityRole="radio"
              accessibilityState={{ selected: data.workout_duration === d }}
            >
              <Text style={[styles.numChipText, data.workout_duration === d && styles.chipTextSelected]}>
                {d}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  progressContainer: {
    height: 3,
    backgroundColor: Colors.border,
    marginTop: Platform.OS === 'ios' ? 56 : 32,
  },
  progressBar: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  scroll: { flexGrow: 1, padding: 24, paddingBottom: 120 },
  stepText: { fontSize: 12, color: Colors.textMuted, marginBottom: 8, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 },
  stepContent: { gap: 20 },
  stepTitle: { fontSize: 28, fontWeight: '800', color: Colors.text, lineHeight: 34 },
  stepSubtitle: { fontSize: 15, color: Colors.textSecondary, marginTop: -12 },
  inputGroup: { gap: 8 },
  inputRow: { flexDirection: 'row', gap: 12 },
  label: { fontSize: 14, fontWeight: '600', color: Colors.textSecondary },
  input: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: Colors.text,
  },
  cardGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  goalCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    gap: 6,
  },
  goalCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: 'rgba(79, 70, 229, 0.1)',
  },
  goalIcon: { fontSize: 32 },
  goalLabel: { fontSize: 14, fontWeight: '700', color: Colors.text, textAlign: 'center' },
  goalLabelSelected: { color: Colors.primary },
  goalDesc: { fontSize: 12, color: Colors.textMuted, textAlign: 'center' },
  listOptions: { gap: 10 },
  listOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    padding: 16,
  },
  listOptionSelected: {
    borderColor: Colors.primary,
    backgroundColor: 'rgba(79, 70, 229, 0.1)',
  },
  listOptionContent: { gap: 2 },
  listOptionLabel: { fontSize: 16, fontWeight: '600', color: Colors.text },
  listOptionLabelSelected: { color: Colors.primary },
  listOptionDesc: { fontSize: 13, color: Colors.textMuted },
  radioFilled: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.primary,
  },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  chipSelected: {
    borderColor: Colors.primary,
    backgroundColor: 'rgba(79, 70, 229, 0.15)',
  },
  chipText: { fontSize: 14, color: Colors.textSecondary },
  chipTextSelected: { color: Colors.primary, fontWeight: '600' },
  chipRow: { flexDirection: 'row', gap: 10 },
  numChip: {
    width: 48,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numChipText: { fontSize: 16, fontWeight: '600', color: Colors.textSecondary },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: 12,
  },
  backButton: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'center',
  },
  backText: { color: Colors.textSecondary, fontSize: 16, fontWeight: '600' },
  nextButton: {
    flex: 1,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: { opacity: 0.5 },
  nextText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
