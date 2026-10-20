import { asc, eq } from "drizzle-orm";
import { db } from "../db";
import { exercises, workoutSession, workoutSessionSets } from "../db/schema";

type ExerciseSetRow = {
  exerciseId: string;
  exerciseName: string;
  muscle: string;
  equipment: string | null;
  weight: number | null;
  reps: number;
  completedAt: Date;
};

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
