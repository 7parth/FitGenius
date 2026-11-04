import { create } from 'zustand';
import { ActiveWorkoutSet, Workout, WorkoutWithSets, Exercise } from '@/types';
import { supabase } from '@/lib/supabase';

interface WorkoutState {
  // Active workout session state
  activeWorkout: {
    id: string | null;
    name: string;
    startTime: Date | null;
    exercises: ActiveWorkoutSet[];
    currentExerciseIndex: number;
    currentSetIndex: number;
    isResting: boolean;
    restTimeRemaining: number;
  };

  // History
  workouts: WorkoutWithSets[];
  loadingHistory: boolean;

  // Actions
  startWorkout: (name: string) => void;
  addExerciseToWorkout: (exercise: Exercise, sets?: number) => void;
  removeExerciseFromWorkout: (exerciseIndex: number) => void;
  updateSet: (
    exerciseIndex: number,
    setIndex: number,
    field: 'reps' | 'weight',
    value: string
  ) => void;
  completeSet: (exerciseIndex: number, setIndex: number) => void;
  startRest: (seconds: number) => void;
  tickRest: () => void;
  finishWorkout: (userId: string) => Promise<{ workoutId?: string; error?: string }>;
  discardWorkout: () => void;

  fetchWorkoutHistory: (userId: string) => Promise<void>;
}

const initialActiveWorkout = {
  id: null,
  name: '',
  startTime: null,
  exercises: [],
  currentExerciseIndex: 0,
  currentSetIndex: 0,
  isResting: false,
  restTimeRemaining: 0,
};

export const useWorkoutStore = create<WorkoutState>((set, get) => ({
  activeWorkout: initialActiveWorkout,
  workouts: [],
  loadingHistory: false,

  startWorkout: (name) => {
    set({
      activeWorkout: {
        ...initialActiveWorkout,
        name,
        startTime: new Date(),
      },
    });
  },

  addExerciseToWorkout: (exercise, sets = 3) => {
    const { activeWorkout } = get();
    const newExercise: ActiveWorkoutSet = {
      exercise,
      sets: Array.from({ length: sets }, (_, i) => ({
        set_number: i + 1,
        reps: '',
        weight: '',
        completed: false,
      })),
    };
    set({
      activeWorkout: {
        ...activeWorkout,
        exercises: [...activeWorkout.exercises, newExercise],
      },
    });
  },

  removeExerciseFromWorkout: (exerciseIndex) => {
    const { activeWorkout } = get();
    const exercises = activeWorkout.exercises.filter((_, i) => i !== exerciseIndex);
    set({ activeWorkout: { ...activeWorkout, exercises } });
  },

  updateSet: (exerciseIndex, setIndex, field, value) => {
    const { activeWorkout } = get();
    const exercises = [...activeWorkout.exercises];
    exercises[exerciseIndex] = {
      ...exercises[exerciseIndex],
      sets: exercises[exerciseIndex].sets.map((s, i) =>
        i === setIndex ? { ...s, [field]: value } : s
      ),
    };
    set({ activeWorkout: { ...activeWorkout, exercises } });
  },

  completeSet: (exerciseIndex, setIndex) => {
    const { activeWorkout } = get();
    const exercises = [...activeWorkout.exercises];
    exercises[exerciseIndex] = {
      ...exercises[exerciseIndex],
      sets: exercises[exerciseIndex].sets.map((s, i) =>
        i === setIndex ? { ...s, completed: true } : s
      ),
    };
    set({ activeWorkout: { ...activeWorkout, exercises } });
  },

  startRest: (seconds) => {
    const { activeWorkout } = get();
    set({ activeWorkout: { ...activeWorkout, isResting: true, restTimeRemaining: seconds } });
  },

  tickRest: () => {
    const { activeWorkout } = get();
    const remaining = activeWorkout.restTimeRemaining - 1;
    set({
      activeWorkout: {
        ...activeWorkout,
        restTimeRemaining: Math.max(0, remaining),
        isResting: remaining > 0,
      },
    });
  },

  finishWorkout: async (userId) => {
    const { activeWorkout } = get();
    if (!activeWorkout.startTime) return { error: 'No active workout' };

    const durationSeconds = Math.round(
      (Date.now() - activeWorkout.startTime.getTime()) / 1000
    );

    try {
      // Insert workout record
      const { data: workout, error: workoutError } = await supabase
        .from('workouts')
        .insert({
          user_id: userId,
          name: activeWorkout.name || 'Workout',
          date: activeWorkout.startTime.toISOString(),
          duration: durationSeconds,
          ai_generated: false,
        })
        .select()
        .single();

      if (workoutError) return { error: workoutError.message };

      // Insert all sets
      const setsToInsert = activeWorkout.exercises.flatMap((exGroup) =>
        exGroup.sets
          .filter((s) => s.completed)
          .map((s) => ({
            workout_id: workout.id,
            exercise_id: exGroup.exercise.id,
            set_number: s.set_number,
            reps: parseInt(s.reps) || null,
            weight: parseFloat(s.weight) || null,
          }))
      );

      if (setsToInsert.length > 0) {
        const { error: setsError } = await supabase
          .from('workout_sets')
          .insert(setsToInsert);
        if (setsError) console.error('Error saving sets:', setsError);
      }

      // Reset active workout
      set({ activeWorkout: initialActiveWorkout });

      return { workoutId: workout.id };
    } catch (err) {
      return { error: 'Failed to save workout.' };
    }
  },

  discardWorkout: () => {
    set({ activeWorkout: initialActiveWorkout });
  },

  fetchWorkoutHistory: async (userId) => {
    set({ loadingHistory: true });
    try {
      const { data, error } = await supabase
        .from('workouts')
        .select(`
          *,
          sets:workout_sets(
            *,
            exercise:exercises(*)
          )
        `)
        .eq('user_id', userId)
        .order('date', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching workouts:', error);
        return;
      }

      set({ workouts: (data as WorkoutWithSets[]) ?? [] });
    } finally {
      set({ loadingHistory: false });
    }
  },
}));
