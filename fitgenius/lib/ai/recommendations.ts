import { Profile, WorkoutPlan, WorkoutDay, PlannedExercise, FitnessGoal } from '@/types';
import { EXERCISES } from '@/constants/exercises';

/**
 * Phase 1: Rule-based recommendation engine
 * Generates a weekly workout plan based on user profile
 */
export function generateWorkoutPlan(profile: Profile): WorkoutPlan {
  const { fitness_goal, fitness_level, equipment, weekly_frequency } = profile;

  const exercises = getFilteredExercises(equipment);
  const days = buildWeekSchedule(
    fitness_goal,
    fitness_level,
    weekly_frequency,
    exercises
  );

  return {
    week: 1,
    days,
  };
}

function getFilteredExercises(equipment: string) {
  return EXERCISES.filter((ex) => {
    if (equipment === 'none') {
      return ex.equipment.length === 0 || ex.equipment.every(e => e === 'yoga mat');
    }
    if (equipment === 'basic') {
      const allowed = ['dumbbells', 'dumbbell', 'bench', 'pull-up bar', 'yoga mat', ''];
      return ex.equipment.every(e => allowed.includes(e));
    }
    return true; // full_gym: all exercises available
  });
}

function buildWeekSchedule(
  goal: FitnessGoal,
  level: string,
  frequency: number,
  exercises: typeof EXERCISES
): WorkoutDay[] {
  const days: WorkoutDay[] = [];
  const allDays = [0, 1, 2, 3, 4, 5, 6]; // Sun-Sat
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  // Determine workout days based on frequency
  let workoutDayIndices: number[];
  switch (frequency) {
    case 2:
      workoutDayIndices = [1, 4]; // Mon, Thu
      break;
    case 3:
      workoutDayIndices = [1, 3, 5]; // Mon, Wed, Fri
      break;
    case 4:
      workoutDayIndices = [1, 2, 4, 5]; // Mon, Tue, Thu, Fri
      break;
    case 5:
      workoutDayIndices = [1, 2, 3, 4, 5]; // Mon-Fri
      break;
    case 6:
      workoutDayIndices = [1, 2, 3, 4, 5, 6]; // Mon-Sat
      break;
    default:
      workoutDayIndices = [1, 4]; // Default to 2 days
  }

  for (const dayIndex of allDays) {
    const isWorkoutDay = workoutDayIndices.includes(dayIndex);

    if (!isWorkoutDay) {
      days.push({
        day: dayIndex,
        name: dayNames[dayIndex],
        exercises: [],
        is_rest_day: true,
      });
      continue;
    }

    const workoutExercises = selectExercisesForDay(
      goal,
      level,
      dayIndex,
      workoutDayIndices,
      exercises
    );

    days.push({
      day: dayIndex,
      name: dayNames[dayIndex],
      exercises: workoutExercises,
      is_rest_day: false,
    });
  }

  return days;
}

function selectExercisesForDay(
  goal: FitnessGoal,
  level: string,
  dayIndex: number,
  workoutDays: number[],
  exercises: typeof EXERCISES
): PlannedExercise[] {
  const dayPosition = workoutDays.indexOf(dayIndex);
  const isFullBody = workoutDays.length <= 3;

  let selectedExercises: typeof EXERCISES;

  if (isFullBody) {
    // Full body: mix of push, pull, legs
    selectedExercises = [
      ...exercises.filter(e => e.muscle_groups.some(m => ['chest', 'triceps', 'shoulders'].includes(m))).slice(0, 1),
      ...exercises.filter(e => e.muscle_groups.some(m => ['lats', 'biceps', 'rear delts'].includes(m))).slice(0, 1),
      ...exercises.filter(e => e.muscle_groups.some(m => ['quadriceps', 'hamstrings', 'glutes'].includes(m))).slice(0, 1),
      ...exercises.filter(e => e.muscle_groups.includes('core')).slice(0, 1),
    ].filter(Boolean);
  } else {
    // Upper/lower split
    const isUpperDay = dayPosition % 2 === 0;
    if (isUpperDay) {
      selectedExercises = exercises.filter(
        e => e.muscle_groups.some(m => ['chest', 'lats', 'biceps', 'triceps', 'shoulders'].includes(m))
      ).slice(0, 5);
    } else {
      selectedExercises = exercises.filter(
        e => e.muscle_groups.some(m => ['quadriceps', 'hamstrings', 'glutes', 'calves', 'core'].includes(m))
      ).slice(0, 5);
    }
  }

  // Add cardio if goal is weight_loss or endurance
  if ((goal === 'weight_loss' || goal === 'endurance') && exercises.some(e => e.category === 'cardio')) {
    const cardioEx = exercises.find(e => e.category === 'cardio');
    if (cardioEx) selectedExercises.push(cardioEx);
  }

  return selectedExercises.map(ex => ({
    exercise_id: ex.id,
    exercise_name: ex.name,
    sets: getSetsForLevel(level, goal),
    reps: getRepsForGoal(goal, ex.category),
    rest_seconds: getRestForGoal(goal, ex.category),
  }));
}

function getSetsForLevel(level: string, goal: FitnessGoal): number {
  if (level === 'beginner') return 3;
  if (goal === 'muscle_gain') return 4;
  return 3;
}

function getRepsForGoal(goal: FitnessGoal, category: string): string {
  if (category === 'cardio') return '20 min';
  switch (goal) {
    case 'weight_loss': return '12-15';
    case 'muscle_gain': return '8-12';
    case 'endurance': return '15-20';
    case 'flexibility': return '10-12';
    default: return '10-12';
  }
}

function getRestForGoal(goal: FitnessGoal, category: string): number {
  if (category === 'cardio') return 0;
  switch (goal) {
    case 'weight_loss': return 45;
    case 'muscle_gain': return 90;
    case 'endurance': return 30;
    default: return 60;
  }
}

/**
 * Generate progressive overload suggestions for the next week
 */
export function getProgressionSuggestions(
  profile: Profile,
  recentWorkouts: { exercise_id: string; weight?: number; reps?: number }[]
): string[] {
  const suggestions: string[] = [];

  if (profile.fitness_level === 'beginner') {
    suggestions.push('Focus on perfecting your form before increasing weight.');
  }

  const exerciseGroups = recentWorkouts.reduce<Record<string, typeof recentWorkouts>>(
    (acc, set) => {
      if (!acc[set.exercise_id]) acc[set.exercise_id] = [];
      acc[set.exercise_id].push(set);
      return acc;
    },
    {}
  );

  for (const [exerciseId, sets] of Object.entries(exerciseGroups)) {
    if (sets.length >= 2) {
      const avgWeight = sets.reduce((s, x) => s + (x.weight ?? 0), 0) / sets.length;
      if (avgWeight > 0) {
        const exercise = EXERCISES.find(e => e.id === exerciseId);
        const increase = profile.fitness_level === 'beginner' ? 5 : 2.5;
        suggestions.push(
          `${exercise?.name ?? 'Exercise'}: Try increasing weight by ${increase}kg next session.`
        );
      }
    }
  }

  return suggestions;
}
