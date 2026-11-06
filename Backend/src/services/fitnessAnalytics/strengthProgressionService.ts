// Backend/src/services/fitnessAnalytics/strengthProgressionService.ts
import { and, asc, eq, gte, lt, max, sql } from "drizzle-orm";
import { db } from "../../db";
import { exercises, workoutSession, workoutSessionSets } from "../../db/schema";
import {
  formatAsJohannesburgDateString,
  getAnalyticsWeekWindows,
  getJohannesburgWeekStart,
} from "./dateUtils";
import { ExerciseStrengthTrend, StrengthHistoryPoint } from "./types";

/**
 * Standard Epley formula used consistently across Forge:
 * 1RM = Weight * (1 + Reps / 30)
 */
export const estimateOneRepMax = (weight: number, reps: number): number => {
  if (reps <= 0) return 0;
  if (weight <= 0) return reps; // For unweighted/bodyweight exercises, treat reps as metric
  return Math.round(weight * (1 + reps / 30) * 10) / 10;
};

/**
 * Calculates exercise-specific strength progression using historical completed workouts.
 * Avoids the "apples-to-oranges" muscle-group grouping by tracking each unique exercise.
 */
export async function calculateExerciseStrengthProgressions(
  userId: string,
  historyWeeksCount = 8
): Promise<ExerciseStrengthTrend[]> {
  const { currentWeekStart } = getAnalyticsWeekWindows();
  const historyStart = new Date(
    currentWeekStart.getTime() - historyWeeksCount * 7 * 24 * 60 * 60 * 1000
  );

  // 1. Retrieve all completed sets for the user within the historical window
  const rows = await db
    .select({
      exerciseId: exercises.id,
      exerciseName: exercises.name,
      muscle: exercises.muscle,
      equipment: exercises.equipment,
      weight: workoutSessionSets.weight,
      reps: workoutSessionSets.reps,
      completedAt: workoutSession.completedAt,
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
        gte(workoutSession.completedAt, historyStart)
      )
    )
    .orderBy(asc(workoutSession.completedAt));

  if (rows.length === 0) {
    return [];
  }

  // 2. Group sets by exerciseId
  const setsByExercise = new Map<string, typeof rows>();
  for (const row of rows) {
    // Only count valid working sets
    if (row.reps <= 0) continue;

    const existing = setsByExercise.get(row.exerciseId) ?? [];
    existing.push(row);
    setsByExercise.set(row.exerciseId, existing);
  }

  const progressions: ExerciseStrengthTrend[] = [];

  for (const [exerciseId, exerciseSets] of setsByExercise.entries()) {
    const first = exerciseSets[0];

    // Group peak 1RM by calendar week start ("YYYY-MM-DD")
    const peakByWeek = new Map<
      string,
      { estimated1RM: number; weight: number; reps: number }
    >();

    for (const set of exerciseSets) {
      const weekStartStr = formatAsJohannesburgDateString(
        getJohannesburgWeekStart(set.completedAt)
      );

      const weight = set.weight ?? 0;
      const calculated1RM = estimateOneRepMax(weight, set.reps);

      const existingPeak = peakByWeek.get(weekStartStr);
      if (!existingPeak || calculated1RM > existingPeak.estimated1RM) {
        peakByWeek.set(weekStartStr, {
          estimated1RM: calculated1RM,
          weight,
          reps: set.reps,
        });
      }
    }

    // Sort historical data chronologically
    const history: StrengthHistoryPoint[] = Array.from(peakByWeek.entries())
      .map(([weekStart, data]) => ({
        weekStart,
        estimated1RM: data.estimated1RM,
        weight: data.weight,
        reps: data.reps,
      }))
      .sort((a, b) => a.weekStart.localeCompare(b.weekStart));

    if (history.length === 0) continue;

    // Current is the most recent recorded week
    const currentPoint = history[history.length - 1]; //in index form
    const currentEstimated1RM = currentPoint.estimated1RM;

    // Previous is the preceding recorded week (if available)
    const previousPoint =
      history.length >= 2 ? history[history.length - 2] : null;
    const previousEstimated1RM = previousPoint
      ? previousPoint.estimated1RM
      : null;

    let absoluteChange: number | null = null;
    let percentageChange: number | null = null;
    let trend: ExerciseStrengthTrend["trend"] = "insufficient_data";

    if (previousEstimated1RM !== null) {
      absoluteChange =
        Math.round((currentEstimated1RM - previousEstimated1RM) * 10) / 10;
      if (previousEstimated1RM > 0) {
        percentageChange =
          Math.round(
            ((currentEstimated1RM - previousEstimated1RM) /
              previousEstimated1RM) *
              1000
          ) / 10;
      } else {
        percentageChange = 0;
      }

      if (percentageChange >= 2.0) {
        trend = "improving";
      } else if (percentageChange <= -2.0) {
        trend = "declining";
      } else {
        trend = "stable";
      }
    }

    progressions.push({
      exerciseId,
      exerciseName: first.exerciseName,
      muscle: first.muscle,
      equipment: first.equipment,
      currentEstimated1RM,
      previousEstimated1RM,
      absoluteChange,
      percentageChange,
      trend,
      history,
    });
  }

  // Sort by highest current 1RM so major compound lifts appear first
  return progressions.sort(
    (a, b) => b.currentEstimated1RM - a.currentEstimated1RM
  );
}

/**
 * Legacy matrix helper: Generates the 7-week skeleton by muscle group.
 * Preserves exact backward-compatibility with the mobile app's MuscleStrength chart.
 */
export async function calculateMuscleStrengthMatrix(userId: string) {
  const now = new Date();
  const currentWeekMonday = getJohannesburgWeekStart(now);

  const historyStart = new Date(
    currentWeekMonday.getTime() - 6 * 7 * 24 * 60 * 60 * 1000
  );
  const historyEnd = new Date(
    currentWeekMonday.getTime() + 7 * 24 * 60 * 60 * 1000
  );

  const weekStartSql = sql<string>`to_char(date_trunc('week', ${workoutSession.completedAt} AT TIME ZONE 'Africa/johannesburg'), 'YYYY-MM-DD')`;

  const estimated1RMSql = sql<number>`
    COALESCE(${workoutSessionSets.weight}, 0) *
    (1 + (${workoutSessionSets.reps}::numeric / 30))
  `;

  const result = await db
    .select({
      weekStart: weekStartSql,
      muscle: exercises.muscle,
      best1RM: max(estimated1RMSql),
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
        gte(workoutSession.completedAt, historyStart),
        lt(workoutSession.completedAt, historyEnd)
      )
    )
    .groupBy(weekStartSql, exercises.muscle)
    .orderBy(weekStartSql);

  const weekSkeleton = Array.from({ length: 7 }, (_, index) => {
    const mondayOfWeek = new Date(
      historyStart.getTime() + index * 7 * 24 * 60 * 60 * 1000
    );
    return {
      weekStart: mondayOfWeek,
      label: `W${index + 1}`,
    };
  });

  const muscleTrained = Array.from(new Set(result.map((row) => row.muscle)));

  return muscleTrained.flatMap((muscle) =>
    weekSkeleton.map((week) => {
      const weekStartString = formatAsJohannesburgDateString(week.weekStart);
      const matchingRow = result.find(
        (row) => row.muscle === muscle && row.weekStart === weekStartString
      );

      return {
        weekStart: week.weekStart,
        weekLabel: week.label,
        muscle,
        best1RM: matchingRow?.best1RM
          ? Math.round(Number(matchingRow.best1RM) * 10) / 10
          : 0,
      };
    })
  );
}
