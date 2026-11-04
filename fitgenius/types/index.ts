// Core domain types for FitGenius

export type FitnessGoal = 'weight_loss' | 'muscle_gain' | 'endurance' | 'flexibility';
export type FitnessLevel = 'beginner' | 'intermediate' | 'advanced';
export type Equipment = 'none' | 'basic' | 'full_gym';
export type ExerciseCategory = 'strength' | 'cardio' | 'flexibility' | 'hiit';
export type Difficulty = 'beginner' | 'intermediate' | 'advanced';
export type Gender = 'male' | 'female' | 'other' | 'prefer_not_to_say';

export interface User {
  id: string;
  email: string;
  created_at: string;
}

export interface Profile {
  id: string;
  name: string;
  age: number;
  gender: Gender;
  fitness_goal: FitnessGoal;
  fitness_level: FitnessLevel;
  equipment: Equipment;
  health_conditions: string[];
  weekly_frequency: number;
  workout_duration: number; // minutes
  weight: number; // kg
  height: number; // cm
  created_at: string;
  updated_at: string;
}

export interface Exercise {
  id: string;
  name: string;
  category: ExerciseCategory;
  muscle_groups: string[];
  difficulty: Difficulty;
  equipment: string[];
  instructions: string[];
  video_url?: string;
  pose_trackable: boolean;
  created_at: string;
}

export interface Workout {
  id: string;
  user_id: string;
  name: string;
  date: string;
  duration: number; // seconds
  notes?: string;
  ai_generated: boolean;
  created_at: string;
}

export interface WorkoutSet {
  id: string;
  workout_id: string;
  exercise_id: string;
  exercise?: Exercise;
  set_number: number;
  reps?: number;
  weight?: number; // kg
  duration?: number; // seconds
  rest_time?: number; // seconds
  form_score?: number; // 0-100
  created_at: string;
}

export interface WorkoutWithSets extends Workout {
  sets: WorkoutSet[];
}

export interface NutritionLog {
  id: string;
  user_id: string;
  date: string;
  calories: number;
  protein: number; // g
  carbs: number; // g
  fats: number; // g
  water_ml: number;
  created_at: string;
}

export interface Achievement {
  id: string;
  user_id: string;
  badge_type: BadgeType;
  earned_at: string;
  created_at: string;
}

export type BadgeType =
  | 'first_workout'
  | 'streak_3'
  | 'streak_7'
  | 'streak_30'
  | 'workouts_10'
  | 'workouts_50'
  | 'workouts_100'
  | 'perfect_form'
  | 'early_bird'
  | 'night_owl';

export interface ActiveWorkoutSet {
  exercise: Exercise;
  sets: {
    set_number: number;
    reps: string;
    weight: string;
    completed: boolean;
  }[];
}

export interface WorkoutPlan {
  week: number;
  days: WorkoutDay[];
}

export interface WorkoutDay {
  day: number; // 0=Sunday, 1=Monday, etc.
  name: string;
  exercises: PlannedExercise[];
  is_rest_day: boolean;
}

export interface PlannedExercise {
  exercise_id: string;
  exercise_name: string;
  sets: number;
  reps: string; // e.g. "8-12" or "30s"
  rest_seconds: number;
  notes?: string;
}

// Pose estimation types
export interface PoseLandmark {
  x: number;
  y: number;
  z: number;
  visibility: number;
}

export interface PoseResult {
  landmarks: PoseLandmark[];
  jointAngles: JointAngles;
  formScore: number;
  repCount: number;
  feedback: string[];
}

export interface JointAngles {
  leftKnee?: number;
  rightKnee?: number;
  leftElbow?: number;
  rightElbow?: number;
  leftHip?: number;
  rightHip?: number;
  leftShoulder?: number;
  rightShoulder?: number;
}

export type PoseTrackableExercise = 'squat' | 'pushup' | 'lunge' | 'bicep_curl' | 'shoulder_press';
