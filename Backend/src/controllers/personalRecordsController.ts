import { fromNodeHeaders } from "better-auth/node";
import { asc, eq } from "drizzle-orm";
import { Request, Response } from "express";
import { db } from "../db";
import { exercises, workoutSession, workoutSessionSets } from "../db/schema";
import { auth } from "../lib/auth";
import type {
  ExerciseSetRow,
  PersonalRecord,
  PRMoment,
} from "../types/personalRecords";

const getAllSetsForUSer = async (userId: string): Promise<ExerciseSetRow[]> => {
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
};

//group rows by exercise ID.
const groupSetsByExercise = (
  rows: ExerciseSetRow[]
): Map<string, ExerciseSetRow[]> => {
  const grouped = new Map<string, ExerciseSetRow[]>();

  for (const row of rows) {
    const existing = grouped.get(row.exerciseId) ?? [];
    existing.push(row);
    grouped.set(row.exerciseId, existing);
  }

  return grouped;
};

//check function for bodyweight exercise.
const isBodyweightExercise = (equipment: string | null): boolean => {
  return equipment === "bodyweight";
};

//1RM for each exercise
const estimateOneRepMax = (weight: number, reps: number): number => {
  return Math.round(weight * (1 + reps / 30) * 10) / 10;
};

const getPerformanceValue = (
  weight: number,
  reps: number,
  isBodyweightExercise: boolean
): number => {
  if (isBodyweightExercise) {
    return reps;
  }

  return estimateOneRepMax(weight, reps);
};

//find the best latest 1RM performance.
const findPRHistory = (
  sets: ExerciseSetRow[],
  isBodyweightExercise: boolean
): PRMoment[] => {
  let runningBest = -Infinity;
  const prHistory: PRMoment[] = [];

  for (const set of sets) {
    const weight = set.weight ?? 0;
    const value = getPerformanceValue(weight, set.reps, isBodyweightExercise);

    if (value > runningBest) {
      runningBest = value;
      prHistory.push({
        value, //1RM
        weight,
        reps: set.reps,
        date: set.completedAt,
      });
    }
  }

  return prHistory;
};

const buildRecordForExercise = (
  exerciseId: string,
  sets: ExerciseSetRow[]
): PersonalRecord | null => {
  const first = sets[0];

  if (!first) {
    return null;
  }

  const bodyWeight = isBodyweightExercise(first.equipment);
  const prHistory = findPRHistory(sets, bodyWeight);
  const currentPR = prHistory[prHistory.length - 1];

  if (!currentPR) {
    return null;
  }

  const previousPR = prHistory[prHistory.length - 2] ?? null;
  const delta =
    previousPR !== null
      ? Math.round((currentPR.value - previousPR.value) * 10) / 10
      : null;

  return {
    exerciseId,
    exerciseName: first.exerciseName,
    muscle: first.muscle,
    metricType: bodyWeight ? "reps" : "estimated1RM",
    currentPR: currentPR.value,
    prWeight: currentPR.weight,
    prReps: currentPR.reps,
    prDate: currentPR.date,
    previousPR: previousPR?.value ?? null,
    delta,
    prHistory,
  };
};

//function returns an array of records for all the exercises.
const calculatePersonalRecord = async (
  userId: string
): Promise<PersonalRecord[]> => {
  const rows = await getAllSetsForUSer(userId);
  const grouped = groupSetsByExercise(rows);
  const records: PersonalRecord[] = [];

  for (const [exerciseId, sets] of grouped) {
    const record = buildRecordForExercise(exerciseId, sets);
    if (record !== null) {
      records.push(record);
    }
  }

  return records;
};

const buildHeroStats = (records: PersonalRecord[]) => {
  const totalPRs = records.length;

  // Use a rolling 30-day window.
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const last30Days = records.filter(
    (record) => record.prDate >= thirtyDaysAgo
  ).length;

  // This finds the largest estimated 1RM number.
  // It does not compare strength fairly across exercises.
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
};

//official controller function.
export const getPersonalRecords = async (req: Request, res: Response) => {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (!session) {
      return res.status(401).json({ message: "Unauthorized- no token found." });
    }

    const userId = session.user.id;
    const records = await calculatePersonalRecord(userId);
    const hero = buildHeroStats(records);

    return res.status(200).json({
      success: true,
      hero,
      records,
    });
  } catch (error) {
    console.error("Error fetching personal records:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to calculate personal records.",
    });
  }
};
