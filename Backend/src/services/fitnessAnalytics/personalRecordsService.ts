// Backend/src/services/fitnessAnalytics/personalRecordsService.ts
import { asc, eq } from "drizzle-orm";
import { db } from "../../db";
import { exercises, workoutSession, workoutSessionSets } from "../../db/schema";
import type {
  ExerciseSetRow,
  PersonalRecord,
  PersonalRecordHero,
  PRMoment,
} from "../../types/personalRecords";
import { estimateOneRepMax } from "./strengthProgressionService";

export const isBodyweightExercise = (equipment: string | null): boolean => {
  return equipment?.toLowerCase() === "bodyweight";
};

export const getPerformanceValue = (
  weight: number,
  reps: number,
  bodyweight: boolean
): number => {
  if (bodyweight) {
    return reps;
  }
  return estimateOneRepMax(weight, reps);
};

export const findPRHistory = (
  sets: ExerciseSetRow[],
  bodyweight: boolean
): PRMoment[] => {
  let runningBest = -Infinity;
  const prHistory: PRMoment[] = [];

  for (const set of sets) {
    const weight = set.weight ?? 0;
    const value = getPerformanceValue(weight, set.reps, bodyweight);

    if (value > runningBest) {
      runningBest = value;
      prHistory.push({
        value,
        weight,
        reps: set.reps,
        date: set.completedAt,
      });
    }
  }

  return prHistory;
};

export const buildRecordForExercise = (
  exerciseId: string,
  sets: ExerciseSetRow[]
): PersonalRecord | null => {
  const first = sets[0];
  if (!first) return null;

  const bodyweight = isBodyweightExercise(first.equipment);
  const prHistory = findPRHistory(sets, bodyweight);
  const currentPR = prHistory[prHistory.length - 1];

  if (!currentPR) return null;

  const previousPR = prHistory[prHistory.length - 2] ?? null;
  const delta =
    previousPR !== null
      ? Math.round((currentPR.value - previousPR.value) * 10) / 10
      : null;

  return {
    exerciseId,
    exerciseName: first.exerciseName,
    muscle: first.muscle,
    metricType: bodyweight ? "reps" : "estimated1RM",
    currentPR: currentPR.value,
    prWeight: currentPR.weight,
    prReps: currentPR.reps,
    prDate: currentPR.date,
    previousPR: previousPR?.value ?? null,
    delta,
    prHistory,
  };
};

export async function getAllSetsForUser(
  userId: string
): Promise<ExerciseSetRow[]> {
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
    .where(eq(workoutSession.userId, userId))
    .orderBy(asc(workoutSession.completedAt));

  return rows;
}

export async function calculatePersonalRecords(
  userId: string
): Promise<PersonalRecord[]> {
  const rows = await getAllSetsForUser(userId);
  const grouped = new Map<string, ExerciseSetRow[]>();

  for (const row of rows) {
    const existing = grouped.get(row.exerciseId) ?? [];
    existing.push(row);
    grouped.set(row.exerciseId, existing);
  }

  const records: PersonalRecord[] = [];
  for (const [exerciseId, sets] of grouped.entries()) {
    const record = buildRecordForExercise(exerciseId, sets);
    if (record !== null) {
      records.push(record);
    }
  }

  return records;
}

export function buildHeroStats(records: PersonalRecord[]): PersonalRecordHero {
  const totalPRs = records.length;
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const last30Days = records.filter(
    (record) => new Date(record.prDate) >= thirtyDaysAgo
  ).length;

  const strongest = records
    .filter((record) => record.metricType === "estimated1RM")
    .reduce<PersonalRecord | null>((best, record) => {
      if (best === null || record.currentPR > best.currentPR) {
        return record;
      }
      return best;
    }, null);

  return {
    totalPRs,
    last30Days,
    strongest,
  };
}

export function extractRecentMilestones(
  records: PersonalRecord[],
  daysWindow = 14
): string[] {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - daysWindow);

  return records
    .filter((r) => r.prDate && new Date(r.prDate) >= cutoff)
    .map((r) => {
      const unit = r.metricType === "reps" ? "reps" : "kg";
      return `New PR: ${r.exerciseName} - ${r.currentPR} ${unit}`;
    });
}

