import { ilike, or } from "drizzle-orm";
import { db } from "../../db";
import { exercises } from "../../db/schema";
import { getFitnessContext } from "../fitnessAnalytics/fitnessAnalyticsService";
import { ExerciseCandidates, GenerateWorkoutRequest } from "./types";

const DEFAULT_BEGINNER_MUSCLES = [
  "chest",
  "lats",
  "middle back",
  "shoulders",
  "rear deltoids",
  "trapezius",
  "biceps",
  "triceps",
  "quadriceps",
  "hamstrings",
  "glutes",
  "calves",
  "abdominals",
];

export const resolveTargetMuscles = async (
  userId: string,
  request: GenerateWorkoutRequest
): Promise<string[]> => {
  if (
    request.mode === "custom" &&
    request.targetMuscles &&
    request.targetMuscles.length > 0
  ) {
    return request.targetMuscles.map((m) => m.trim().toLowerCase());
  }

  //insight driven workout generation.
  const context = await getFitnessContext(userId);

  //retrive muscles with gaps
  if (context.trainingGaps.length > 0) {
    const gapMuscles = context.trainingGaps.map((g) =>
      g.muscle.trim().toLowerCase()
    );

    return Array.from(new Set(gapMuscles));
  }

  //Alternative, finding muscles with lowest weekly volume from the database.
  if (context.muscleDistribution.length > 0) {
    const sortedSets = [...context.muscleDistribution].sort(
      (a, b) => a.currentWeekSets - b.currentWeekSets
    );
    const lowestMuscles = sortedSets
      .slice(0, 2)
      .map((m) => m.muscle.trim().toLowerCase());

    return lowestMuscles;
  }

  return DEFAULT_BEGINNER_MUSCLES;
};

//Fetch relevant exercises for the target muscle.

export const fetchExercisesCandidates = async (
  targetMuscle: string[],
  preferredEquipment: string[]
): Promise<ExerciseCandidates[]> => {
  if (targetMuscle.length === 0) {
    return [];
  }

  const muscleConditions = targetMuscle.map((muscle) =>
    ilike(exercises.muscle, `${muscle}`)
  );

  const rows = await db
    .select({
      id: exercises.id,
      name: exercises.name,
      muscle: exercises.muscle,
      equipment: exercises.equipment,
      difficulty: exercises.difficulty,
    })
    .from(exercises)
    .where(or(...muscleConditions))
    .limit(30);

  if (preferredEquipment && preferredEquipment.length > 0) {
    const equipmentLower = preferredEquipment.map((e) => e.toLowerCase());
    const filtered = rows.filter((row) =>
      row.equipment
        ? equipmentLower.includes(row.equipment.toLowerCase())
        : true
    );

    if (filtered.length >= 6) {
      return filtered;
    }
  }
  return rows;
};
