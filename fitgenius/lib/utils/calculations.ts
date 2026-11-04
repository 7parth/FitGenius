import { Profile, FitnessGoal } from '@/types';

/**
 * Calculate Basal Metabolic Rate using Mifflin-St Jeor equation
 * Returns kcal/day
 */
export function calculateBMR(
  weight: number, // kg
  height: number, // cm
  age: number,
  gender: string
): number {
  const base = 10 * weight + 6.25 * height - 5 * age;
  return gender === 'male' ? base + 5 : base - 161;
}

/**
 * Calculate Total Daily Energy Expenditure
 */
export function calculateTDEE(bmr: number, weeklyFrequency: number): number {
  // Activity multipliers
  const multipliers = {
    0: 1.2,   // Sedentary
    1: 1.375, // Light (1-2 days/week)
    2: 1.375,
    3: 1.55,  // Moderate (3-5 days/week)
    4: 1.55,
    5: 1.55,
    6: 1.725, // Heavy (6-7 days/week)
    7: 1.725,
  };
  const key = Math.min(weeklyFrequency, 7) as keyof typeof multipliers;
  return Math.round(bmr * (multipliers[key] ?? 1.55));
}

/**
 * Calculate daily calorie target based on fitness goal
 */
export function calculateCalorieTarget(tdee: number, goal: FitnessGoal): number {
  switch (goal) {
    case 'weight_loss':
      return Math.round(tdee * 0.8); // 20% deficit
    case 'muscle_gain':
      return Math.round(tdee * 1.1); // 10% surplus
    case 'endurance':
      return Math.round(tdee * 1.05);
    case 'flexibility':
      return tdee;
    default:
      return tdee;
  }
}

/**
 * Calculate macro targets in grams
 */
export function calculateMacros(
  calories: number,
  goal: FitnessGoal,
  weightKg: number
): { protein: number; carbs: number; fats: number } {
  let proteinPerKg: number;
  let fatPercent: number;

  switch (goal) {
    case 'muscle_gain':
      proteinPerKg = 2.2;
      fatPercent = 0.25;
      break;
    case 'weight_loss':
      proteinPerKg = 2.0;
      fatPercent = 0.3;
      break;
    case 'endurance':
      proteinPerKg = 1.6;
      fatPercent = 0.25;
      break;
    default:
      proteinPerKg = 1.8;
      fatPercent = 0.3;
  }

  const protein = Math.round(proteinPerKg * weightKg);
  const fats = Math.round((calories * fatPercent) / 9);
  const carbs = Math.round((calories - protein * 4 - fats * 9) / 4);

  return { protein, carbs, fats };
}

/**
 * Calculate joint angle between three points (in degrees)
 * Used for pose estimation
 */
export function calculateAngle(
  a: { x: number; y: number },
  b: { x: number; y: number }, // vertex
  c: { x: number; y: number }
): number {
  const radians =
    Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
  let angle = Math.abs(radians * (180 / Math.PI));
  if (angle > 180) angle = 360 - angle;
  return angle;
}

/**
 * Format seconds into MM:SS display string
 */
export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/**
 * Calculate workout volume (total weight lifted)
 */
export function calculateVolume(
  sets: { reps?: number; weight?: number }[]
): number {
  return sets.reduce((total, set) => {
    return total + (set.reps ?? 0) * (set.weight ?? 0);
  }, 0);
}

/**
 * Calculate estimated calories burned during workout
 * Very rough estimate: ~5-8 kcal/min for strength training
 */
export function estimateCaloriesBurned(
  durationSeconds: number,
  weightKg: number
): number {
  const minutes = durationSeconds / 60;
  const metValue = 5; // MET for general weight training
  return Math.round((metValue * weightKg * 3.5) / 200 * minutes);
}

/**
 * Get progressive overload suggestion
 * Returns suggested weight increase after 2 successful sessions at current weight
 */
export function getProgressiveOverload(
  currentWeight: number,
  fitnessLevel: string
): number {
  const increment = fitnessLevel === 'beginner' ? 0.05 : 0.025;
  return Math.round(currentWeight * (1 + increment) * 4) / 4; // round to nearest 0.25
}
