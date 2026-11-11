// Backend/src/services/fitnessAnalytics/types.ts

// 1. User profile basics
export type UserFitnessProfile = {
  gender: string;
  goal: string;
  experience: string;
  weightUnit: string;
  workoutsPerWeekTarget: number;
};

// 2. Training volume summary with true 4-week historical comparisons
export type MuscleVolumeSummary = {
  muscle: string;
  currentWeekSets: number;
  previousAverageSets: number; // Real average of prior 4 completed weeks
  setDifference: number; // currentWeekSets - previousAverageSets
  percentageChange: number; // % change vs 4-week average
  percentageOfTotalVolume: number; // % of total sets performed this week
};

// 3. Weekly volume trend (overall workload)
export type VolumeTrend = {
  currentWeeklyVolumeKg: number;
  previousWeeklyVolumeKg: number;
  percentageChange: number;
  status: "increasing" | "decreasing" | "stable";
};

// 4. Historical point for exercise strength progression
export type StrengthHistoryPoint = {
  weekStart: string; // "YYYY-MM-DD"
  estimated1RM: number;
  reps: number;
  weight: number;
};

// 5. Exercise-specific strength progression
export type ExerciseStrengthTrend = {
  exerciseId: string;
  exerciseName: string;
  muscle: string;
  equipment: string | null;
  currentEstimated1RM: number;
  previousEstimated1RM: number | null; // Null if user has no prior history on this exercise
  absoluteChange: number | null; // Null if no prior comparable measurement
  percentageChange: number | null; // Null if no prior comparable measurement
  trend: "improving" | "stable" | "declining" | "insufficient_data";
  history: StrengthHistoryPoint[];
};

// 6. Training gaps detected by rule-based analysis
export type TrainingGap = {
  muscle: string;
  severity: "high" | "moderate" | "balanced";
  reason: string;
};

export interface PersonalRecord {
  exerciseName: string;
  currentPR: number;
  metricType: string;
}

// 7. Master "One-Page Lab Report" consumed by Gemini
export type FitnessContext = {
  profile: UserFitnessProfile;
  volume: VolumeTrend;
  muscleDistribution: MuscleVolumeSummary[];
  topStrengthTrends: ExerciseStrengthTrend[];
  recentMilestones: string[];
  trainingGaps: TrainingGap[];
  personalRecords: PersonalRecord[];
};
