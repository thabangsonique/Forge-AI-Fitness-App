import { ilike, or } from "drizzle-orm";
import { db } from "../../db";
import { exercises } from "../../db/schema";
import { getFitnessContext } from "../fitnessAnalytics/fitnessAnalyticsService";
import { expandMuscleAliases } from "./muscleGroups";
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
  preferredEquipment?: string[],
  excludedExerciseIds: string[] = [],
  excludedExercises: string[] = []
): Promise<ExerciseCandidates[]> => {
  if (targetMuscle.length === 0) {
    return [];
  }

  const expandedMuscles = expandMuscleAliases(targetMuscle);
  const muscleConditions = expandedMuscles.map((muscle) =>
    ilike(exercises.muscle, `${muscle}`)
  );

  const rows = await db
    .select({
      id: exercises.id,
      name: exercises.name,
      muscle: exercises.muscle,
      equipment: exercises.equipment,
      difficulty: exercises.difficulty,
      mechanics: exercises.mechanics,
      forceType: exercises.forceType,
    })
    .from(exercises)
    .where(or(...muscleConditions))
    .limit(100);

  const excludedIds = new Set(excludedExerciseIds);
  const excludedNames = new Set(
    excludedExercises.map((name) => name.trim().toLowerCase())
  );
  const eligibleRows = rows.filter(
    (row) =>
      !excludedIds.has(row.id) &&
      !excludedNames.has(row.name.trim().toLowerCase())
  );

  //TEMPORARY.
  console.log(
    "[OpenRouter Workout] Candidate muscle breakdown:",
    eligibleRows.reduce<Record<string, string[]>>((acc, candidate) => {
      const muscle = candidate.muscle.trim().toLowerCase();

      if (!acc[muscle]) {
        acc[muscle] = [];
      }

      acc[muscle].push(candidate.name);

      return acc;
    }, {})
  );

  if (preferredEquipment && preferredEquipment.length > 0) {
    const normalizeEquipment = (equipment: string) => {
      const value = equipment.trim().toLowerCase().replace(/[_-]/g, " ");
      if (["dumbbells", "free weights dumbbell"].includes(value))
        return "dumbbell";
      if (["barbells", "free weights barbell"].includes(value))
        return "barbell";
      if (["body weight", "calisthenics"].includes(value)) return "bodyweight";
      if (["cable machine", "cables"].includes(value)) return "cable";
      if (["resistance band", "resistance bands", "bands"].includes(value))
        return "band";
      return value;
    };
    const equipmentLower = new Set(preferredEquipment.map(normalizeEquipment));
    const filtered = eligibleRows.filter((row) =>
      row.equipment
        ? equipmentLower.has(normalizeEquipment(row.equipment))
        : equipmentLower.has("bodyweight")
    );
    return filtered;
  }
  return eligibleRows;
};
