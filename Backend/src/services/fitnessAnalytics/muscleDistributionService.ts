// Backend/src/services/fitnessAnalytics/muscleDistributionService.ts
import { and, count, eq, gte, lt } from "drizzle-orm";
import { db } from "../../db";
import { exercises, workoutSession, workoutSessionSets } from "../../db/schema";
import {
  formatAsJohannesburgDateString,
  getAnalyticsWeekWindows,
} from "./dateUtils";
import { MuscleVolumeSummary, TrainingGap } from "./types";

/**
 * Calculates current week completed working sets per muscle,
 * true rolling 4-week historical average sets, differences, percentage changes,
 * and rule-based training gaps.
 */
export async function calculateMuscleVolumeDistribution(userId: string): Promise<{
  distribution: MuscleVolumeSummary[];
  gaps: TrainingGap[];
  totalSetsThisWeek: number;
  weekStart: string;
  weekEndExclusive: string;
}> {
  const { currentWeekStart, nextWeekStart, fourWeeksAgoStart } =
    getAnalyticsWeekWindows();

  const weekStartStr = formatAsJohannesburgDateString(currentWeekStart);
  const weekEndExclusiveStr = formatAsJohannesburgDateString(nextWeekStart);

  // 1. Current week sets per muscle group
  const currentWeekQuery = await db
    .select({
      muscle: exercises.muscle,
      setCount: count(),
    })
    .from(workoutSessionSets)
    .innerJoin(
      workoutSession,
      eq(workoutSessionSets.sessionId, workoutSession.id)
    )
    .innerJoin(exercises, eq(workoutSessionSets.exerciseId, exercises.id))
    .where(
      and(
        eq(workoutSession.userId, userId),
        gte(workoutSession.completedAt, currentWeekStart),
        lt(workoutSession.completedAt, nextWeekStart)
      )
    )
    .groupBy(exercises.muscle);

  // 2. Previous 4 completed weeks sets per muscle group [T-28 days to T)
  const previous4WeeksQuery = await db
    .select({
      muscle: exercises.muscle,
      totalSetsPast4Weeks: count(),
    })
    .from(workoutSessionSets)
    .innerJoin(
      workoutSession,
      eq(workoutSessionSets.sessionId, workoutSession.id)
    )
    .innerJoin(exercises, eq(workoutSessionSets.exerciseId, exercises.id))
    .where(
      and(
        eq(workoutSession.userId, userId),
        gte(workoutSession.completedAt, fourWeeksAgoStart),
        lt(workoutSession.completedAt, currentWeekStart)
      )
    )
    .groupBy(exercises.muscle);

  const currentMap = new Map<string, number>();
  let totalSetsThisWeek = 0;
  for (const row of currentWeekQuery) {
    const sets = Number(row.setCount);
    currentMap.set(row.muscle.toLowerCase(), sets);
    totalSetsThisWeek += sets;
  }

  const historicalMap = new Map<string, number>();
  for (const row of previous4WeeksQuery) {
    // 4 completed weeks -> average sets per week = total / 4
    const totalSets4W = Number(row.totalSetsPast4Weeks);
    const avgWeeklySets = Math.round((totalSets4W / 4) * 10) / 10;
    historicalMap.set(row.muscle.toLowerCase(), avgWeeklySets);
  }

  // Combine all active muscles seen in either current week or past 4 weeks
  const allObservedMuscles = Array.from(
    new Set([...currentMap.keys(), ...historicalMap.keys()])
  );

  const distribution: MuscleVolumeSummary[] = allObservedMuscles.map((muscle) => {
    const currentWeekSets = currentMap.get(muscle) ?? 0;
    const previousAverageSets = historicalMap.get(muscle) ?? 0;

    const setDifference =
      Math.round((currentWeekSets - previousAverageSets) * 10) / 10;

    let percentageChange = 0;
    if (previousAverageSets > 0) {
      percentageChange = Math.round(
        ((currentWeekSets - previousAverageSets) / previousAverageSets) * 100
      );
    } else if (currentWeekSets > 0) {
      percentageChange = 100;
    }

    const percentageOfTotalVolume =
      totalSetsThisWeek > 0
        ? Math.round((currentWeekSets / totalSetsThisWeek) * 100)
        : 0;

    return {
      muscle,
      currentWeekSets,
      previousAverageSets,
      setDifference,
      percentageChange,
      percentageOfTotalVolume,
    };
  });

  // Sort by highest current week volume
  distribution.sort((a, b) => b.currentWeekSets - a.currentWeekSets);

  // 3. Rule-based Gap Detection
  const gaps: TrainingGap[] = [];
  const essentialMuscles = ["chest", "back", "legs", "shoulders", "arms"];

  for (const essential of essentialMuscles) {
    const recorded = distribution.find(
      (m) => m.muscle.toLowerCase() === essential
    );

    if (!recorded || recorded.currentWeekSets === 0) {
      const priorAvg = recorded?.previousAverageSets ?? 0;
      gaps.push({
        muscle: essential,
        severity: "high",
        reason:
          priorAvg > 0
            ? `0 sets completed for ${essential} this week (prior 4-week average was ${priorAvg} sets).`
            : `0 sets completed for ${essential} this week.`,
      });
    } else if (recorded.percentageChange <= -40 && recorded.previousAverageSets >= 6) {
      gaps.push({
        muscle: essential,
        severity: "moderate",
        reason: `${essential} volume dropped by ${Math.abs(recorded.percentageChange)}% compared to your 4-week baseline.`,
      });
    } else if (recorded.percentageOfTotalVolume < 10 && totalSetsThisWeek >= 15) {
      gaps.push({
        muscle: essential,
        severity: "moderate",
        reason: `${essential} represents only ${recorded.percentageOfTotalVolume}% of total sets completed this week.`,
      });
    }
  }

  return {
    distribution,
    gaps,
    totalSetsThisWeek,
    weekStart: weekStartStr,
    weekEndExclusive: weekEndExclusiveStr,
  };
}

/**
 * Backward-compatible helper for statsController and mobile charts.
 */
export async function getExerciseBreakdownForStats(userId: string) {
  const result = await calculateMuscleVolumeDistribution(userId);

  return {
    weekStart: result.weekStart,
    weekEndExclusive: result.weekEndExclusive,
    totalSets: result.totalSetsThisWeek,
    muscleDistribution: result.distribution.map((item) => ({
      muscle: item.muscle,
      sets: item.currentWeekSets,
      percentage: item.percentageOfTotalVolume,
    })),
  };
}

