// Backend/src/services/fitnessAnalytics/fitnessAnalyticsService.ts
import { calculateMuscleVolumeDistribution } from "./muscleDistributionService";
import {
  calculatePersonalRecords,
  extractRecentMilestones,
} from "./personalRecordsService";
import { getUserFitnessProfile } from "./profileService";
import { calculateExerciseStrengthProgressions } from "./strengthProgressionService";
import { FitnessContext } from "./types";
import { calculateVolumeAnalytics } from "./volumeService";

/**
 * Orchestrator for the Fitness Analytics Engine.
 * Gathers profile, volume trends, muscle distribution with 4-week historical averages,
 * exercise-specific strength progressions, and verified PR milestones into a single
 * deterministic, hallucination-free FitnessContext for the AI engines.
 */
export async function getFitnessContext(
  userId: string
): Promise<FitnessContext> {
  const [
    profile,
    muscleAnalytics,
    volumeAnalytics,
    strengthProgressions,
    personalRecords,
  ] = await Promise.all([
    getUserFitnessProfile(userId),
    calculateMuscleVolumeDistribution(userId),
    calculateVolumeAnalytics(userId),
    calculateExerciseStrengthProgressions(userId, 8),
    calculatePersonalRecords(userId),
  ]);

  const recentMilestones = extractRecentMilestones(personalRecords, 14);

  return {
    profile,
    volume: volumeAnalytics.volumeTrend,
    muscleDistribution: muscleAnalytics.distribution,
    topStrengthTrends: strengthProgressions.slice(0, 5),
    recentMilestones,
    trainingGaps: muscleAnalytics.gaps,
    personalRecords: personalRecords,
  };
}
