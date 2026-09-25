// ─── Auth ─────────────────────────────────────────────────────────────────────
export type UserRole = 'user' | 'admin'

export interface User {
  id: string
  email: string
  display_name: string
  role: UserRole
  is_active: boolean
  is_verified: boolean
  created_at: string
}

export interface AuthTokens {
  access_token: string
  refresh_token: string
  token_type: string
}

export interface AuthResponse {
  user: User
  access_token: string
  refresh_token: string
  token_type: string
}

// ─── Profile ──────────────────────────────────────────────────────────────────
export type FitnessLevel = 'beginner' | 'intermediate' | 'advanced'
export type FitnessGoal = 'weight_loss' | 'muscle_gain' | 'endurance' | 'flexibility' | 'general'
export type TrainingLocation = 'home' | 'gym' | 'outdoor' | 'any'
export type InteractionMode = 'visual' | 'voice' | 'both'
export type FontSizePreference = 'sm' | 'md' | 'lg' | 'xl'

export interface UserProfile {
  user_id: string
  age?: number
  gender?: string
  height_cm?: number
  weight_kg?: number
  fitness_level: FitnessLevel
  primary_goal: FitnessGoal
  workout_frequency_per_week: number
  preferred_duration_minutes: number
  preferred_exercise_types: string[]
  available_equipment: string[]
  training_location: TrainingLocation
  onboarding_completed: boolean
  preferred_language?: string
}

export interface AccessibilityProfile {
  user_id: string
  has_visual_impairment: boolean
  has_hearing_impairment: boolean
  has_mobility_limitation: boolean
  mobility_notes?: string
  preferred_interaction_mode: InteractionMode
  font_size_preference: FontSizePreference
  high_contrast_mode: boolean
  reduced_motion: boolean
  captions_enabled: boolean
  simplified_ui: boolean
  exercise_restrictions: string[]
  exercises_to_avoid: string[]
}

// ─── Exercise ─────────────────────────────────────────────────────────────────
export type ExerciseCategory = 'strength' | 'cardio' | 'flexibility' | 'balance' | 'rehabilitation'
export type Difficulty = 'beginner' | 'intermediate' | 'advanced'
export type AccessibilityCategory = 'mobility_limited' | 'visually_impaired' | 'hearing_impaired' | 'cognitive' | 'general'

export interface Exercise {
  id: string
  name: string
  description: string
  instructions: string
  muscle_groups: string[]
  category: ExerciseCategory
  difficulty: Difficulty
  equipment_needed: string[]
  duration_seconds?: number
  default_reps?: number
  default_sets?: number
  calories_estimate_per_min?: number
  accessibility_categories: AccessibilityCategory[]
  contraindications: string[]
  alternative_exercise_ids: string[]
  alternative_exercises?: Exercise[]
  video_url?: string
  image_url?: string
  supports_pose_analysis: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface ExerciseListResponse {
  total_count: number
  page: number
  page_size: number
  items: Exercise[]
}

export interface ExerciseFilters {
  category?: ExerciseCategory
  difficulty?: Difficulty
  equipment?: string
  muscle_group?: string
  accessibility_category?: AccessibilityCategory
  supports_pose_analysis?: boolean
  search?: string
  page?: number
  page_size?: number
}

// ─── Workout ──────────────────────────────────────────────────────────────────
export type SessionStatus = 'active' | 'completed' | 'abandoned'
export type AlgorithmStage = 'rule_based' | 'content_based' | 'ml_hybrid'

export interface WorkoutPlanExercise {
  exercise_id: string
  name: string
  sets: number
  reps?: number
  duration_seconds?: number
  rest_seconds: number
  instructions_summary: string
  alternatives: Exercise[]
  accessibility_notes?: string
  exercise?: Exercise
}

export interface WorkoutPlan {
  name: string
  description: string
  total_duration_minutes: number
  difficulty: Difficulty
  exercises: WorkoutPlanExercise[]
}

export interface Recommendation {
  id: string
  user_id: string
  generated_at: string
  algorithm_stage: AlgorithmStage
  confidence_score: number
  workout: WorkoutPlan
  feedback_rating?: number
  used: boolean
}

export interface WorkoutSession {
  id: string
  user_id: string
  template_id?: string
  recommendation_id?: string
  status: SessionStatus
  started_at: string
  completed_at?: string
  total_duration_seconds?: number
  total_calories_estimate?: number
  notes?: string
  difficulty_rating?: number
  exercises: SessionExercise[]
}

export interface SessionExercise {
  id: string
  session_id: string
  exercise_id: string
  exercise?: Exercise
  order_index: number
  planned_sets: number
  planned_reps?: number
  completed_sets: number
  completed_reps?: number
  weight_kg?: number
  duration_seconds?: number
  form_score?: number
  skipped: boolean
}

export interface SessionSummary {
  session: WorkoutSession
  points_earned: number
  badges_unlocked: Achievement[]
  total_exercises_completed: number
  total_sets_completed: number
  streak_updated: boolean
}

// ─── Gamification ─────────────────────────────────────────────────────────────
export type BadgeTier = 'bronze' | 'silver' | 'gold' | 'platinum'
export type TriggerType = 'workout_count' | 'streak' | 'personal_best' | 'challenge' | 'consistency'

export interface Achievement {
  id: string
  name: string
  description: string
  badge_tier: BadgeTier
  icon: string
  trigger_type: TriggerType
  trigger_value: number
  earned_at?: string
  earned: boolean
}

export interface UserGamification {
  user_id: string
  total_points: number
  current_streak: number
  longest_streak: number
  last_workout_date?: string
  weekly_points: number
  monthly_points: number
}

export interface GamificationSummary {
  total_points: number
  current_streak: number
  longest_streak: number
  badges_earned: number
  next_achievement?: Achievement
  gamification: UserGamification
}

export interface LeaderboardEntry {
  rank: number
  display_name: string
  points: number
  streak: number
  is_current_user: boolean
}

export interface Challenge {
  id: string
  name: string
  description: string
  challenge_type: 'individual' | 'community'
  target_metric: string
  target_value: number
  start_date: string
  end_date: string
  points_reward: number
  is_active: boolean
  participant_count: number
  user_progress?: number
  user_completed?: boolean
  user_joined?: boolean
}

// ─── Progress ─────────────────────────────────────────────────────────────────
export interface ProgressSummary {
  total_workouts: number
  total_minutes: number
  this_week_workouts: number
  this_month_workouts: number
  current_streak: number
  longest_streak: number
  total_points: number
  goal_progress: {
    goal_type: FitnessGoal
    current_value: number
    target_value: number
    percent: number
  }
  recent_trend: {
    direction: 'improving' | 'maintaining' | 'declining'
    metric: string
  }
}

export interface WeeklyHistory {
  week_start: string
  workout_count: number
  total_minutes: number
}

export interface PersonalRecord {
  exercise_id: string
  exercise_name: string
  record_type: 'max_reps' | 'max_weight' | 'best_form_score'
  value: number
  recorded_at: string
}

export interface ExercisePerformancePoint {
  date: string
  reps?: number
  weight_kg?: number
  form_score?: number
}

// ─── AI Coach ─────────────────────────────────────────────────────────────────
export interface CoachMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

export interface CoachConversation {
  id: string
  user_id: string
  messages: CoachMessage[]
  created_at: string
  updated_at: string
}

export interface CoachMessageResponse {
  response: string
  conversation_id: string
}

// ─── Pose ─────────────────────────────────────────────────────────────────────
export interface PoseFeedback {
  severity: 'good' | 'warning' | 'error'
  message: string
}

export interface AnalysisResult {
  repCount: number
  formScore: number
  feedback: PoseFeedback[]
  currentPhase: string
  isTracking: boolean
}

// ─── Wearable ─────────────────────────────────────────────────────────────────
export type FatigueLevel = 'NORMAL' | 'REDUCED' | 'RECOVERY'

export interface WearableDataPoint {
  id: string
  user_id: string
  provider: string
  recorded_at: string
  heart_rate_bpm?: number
  steps?: number
  active_minutes?: number
  calories?: number
  sleep_hours?: number
}

export interface FatigueAssessment {
  level: FatigueLevel
  score: number
  recommendation: string
  factors: string[]
}

// ─── Notification ─────────────────────────────────────────────────────────────
export interface Notification {
  id: string
  user_id: string
  type: string
  title: string
  body: string
  read: boolean
  data?: Record<string, unknown>
  created_at: string
}

// ─── API Responses ────────────────────────────────────────────────────────────
export interface PaginatedResponse<T> {
  total_count: number
  page: number
  page_size: number
  items: T[]
}

export interface ApiError {
  detail: string
  status_code?: number
}
