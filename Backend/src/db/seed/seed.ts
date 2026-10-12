import "dotenv/config";

import { eq, inArray } from "drizzle-orm";
import { db } from "../index";
import {
  exercises,
  scheduledWorkouts,
  workoutExercises,
  workouts,
  workoutSession,
  workoutSessionSets,
} from "../schema";
import { systemExerciseAdditions } from "../seed/system-exercises.seed";
import { SYSTEM_WORKOUT_EXERCISE_SEED_DATA } from "../seed/system-workout-exercises.seed";
import {
  EXERCISE_DATA_URL,
  EXERCISE_IMAGE_URL,
  EXERCISE_NAMES,
  type SourceExercise,
} from "./exercises";
import { SEED_USER_ID, WORKOUT_SEED_DATA } from "./scheduledWorkouts";
import { WORKOUT_EXERCISE_SEED_DATA } from "./workoutExercises";
import { WORKOUT_SESSION_SEED_DATA } from "./workoutSessions";

type ExerciseInsertRow = {
  id?: string;
  slug: string;
  name: string;
  description: string;
  muscle: string;
  equipment: string | null;
  difficulty: string;
  forceType: string | null;
  mechanics: string | null;
  category: string;
  userId: string | null;
};

type ScheduledWorkoutRow = {
  workoutId: string;
  userId: string;
  scheduledDate: Date;
  createdAt: Date;
};

const SYSTEM_WORKOUTS = [
  {
    id: "0d36c361-8b91-45b4-9f84-771567ce59e6",
    userId: null,
    name: "Core",
    description: "Complete Core Workout",
    workoutType: "system",
    isTemplate: true,
    category: "Core Build",
    image:
      "https://ik.imagekit.io/gf8pptsye/Forge%20workouts/ChatGPT%20Image%20Sep%2028,%202026,%2006_58_01%20PM.png",
  },
  {
    id: "39b48734-7494-48f2-953a-9aeb20b17374",
    userId: null,
    name: "Full Body",
    description: "Full Body Workout",
    workoutType: "system",
    isTemplate: true,
    category: "Muscle Build",
    image:
      "https://ik.imagekit.io/gf8pptsye/Forge%20workouts/ChatGPT%20Image%20Sep%2028,%202026,%2006_55_11%20PM.png",
  },
  {
    id: "654f61dc-51b8-4492-8ffa-f84919dcee8a",
    userId: null,
    name: "Push Starter",
    description: "Chest, shoulders & triceps",
    workoutType: "system",
    isTemplate: true,
    category: "Muscle Build",
    image:
      "https://ik.imagekit.io/gf8pptsye/Forge%20workouts/Max_a_____Push_Workout___D.png",
  },
  {
    id: "6c60aea8-5f5d-4059-94dd-e8b5497f9448",
    userId: null,
    name: "Shoulder Starter",
    description: "Delts & Traps",
    workoutType: "system",
    isTemplate: true,
    category: "Muscle Build",
    image: "https://ik.imagekit.io/gf8pptsye/Forge%20workouts/shoulder.png",
  },
  {
    id: "99dd058b-dd68-44d5-b094-cacf23478469",
    userId: null,
    name: "Arms Starter",
    description: "Biceps & Triceps",
    workoutType: "system",
    isTemplate: true,
    category: "Muscle Build",
    image: "https://ik.imagekit.io/gf8pptsye/Forge%20workouts/arm.png",
  },
  {
    id: "9a475487-798e-4e35-92d0-2cf148705e3b",
    userId: null,
    name: "Pull Starter",
    description: "Back & Biceps",
    workoutType: "system",
    isTemplate: true,
    category: "Muscle Build",
    image: "https://ik.imagekit.io/gf8pptsye/Forge%20workouts/pull.png",
  },
  {
    id: "fe2243b8-8c5d-432c-86df-2f7ea2966f06",
    userId: null,
    name: "Legs Starter",
    description: "Quads, hamstrings & calves",
    workoutType: "system",
    isTemplate: true,
    category: "Legs",
    image:
      "https://ik.imagekit.io/gf8pptsye/Forge%20workouts/legs-1.png?updatedAt=1790610878879",
  },
] as const;

async function fetchExercises(): Promise<SourceExercise[]> {
  console.log("Fetching exercises from:", EXERCISE_DATA_URL);
  const response = await fetch(EXERCISE_DATA_URL);
  if (!response.ok) {
    throw new Error(
      `Failed to fetch exercises: ${response.status} ${response.statusText}`
    );
  }
  const data = (await response.json()) as SourceExercise[];
  console.log(`Fetched ${data.length} exercises from source`);
  return data;
}

function mapExercise(source: SourceExercise): ExerciseInsertRow {
  const images = source.images ?? [];
  const imageUrl =
    images.length > 0
      ? `${EXERCISE_IMAGE_URL}/${images[0]}`
      : `${EXERCISE_IMAGE_URL}/default.jpg`;

  // The current exercises schema has no image column, so imageUrl is intentionally
  // not inserted. Keep this calculation only if you use it for logging/debugging.
  void imageUrl;

  return {
    slug: source.id,
    name: source.name,
    description: source.name,
    muscle: source.primaryMuscles.join(", "),
    equipment: source.equipment ?? null,
    difficulty: source.level,
    forceType: source.force ?? null,
    mechanics: source.mechanic ?? null,
    category: source.category,
    userId: null,
  };
}

function filterExercises(exerciseList: SourceExercise[]): SourceExercise[] {
  const wanted = new Set(EXERCISE_NAMES);
  return exerciseList.filter((exercise) => wanted.has(exercise.name));
}

/**
 * Only clears mock data belonging to SEED_USER_ID. Unlike the original reset,
 * this does not delete every user's sessions, associations, or exercise catalogue.
 */
async function resetSeedData() {
  console.log("Clearing existing mock seed data for the seed user...");

  const seedSessions = await db
    .select({ id: workoutSession.id })
    .from(workoutSession)
    .where(eq(workoutSession.userId, SEED_USER_ID));

  if (seedSessions.length > 0) {
    await db.delete(workoutSessionSets).where(
      inArray(
        workoutSessionSets.sessionId,
        seedSessions.map((session) => session.id)
      )
    );
  }

  await db
    .delete(workoutSession)
    .where(eq(workoutSession.userId, SEED_USER_ID));
  await db
    .delete(workoutExercises)
    .where(eq(workoutExercises.userId, SEED_USER_ID));
  await db
    .delete(scheduledWorkouts)
    .where(eq(scheduledWorkouts.userId, SEED_USER_ID));
  await db.delete(workouts).where(eq(workouts.userId, SEED_USER_ID));

  console.log(
    "Seed user's mock data cleared. System workouts and other users' data are preserved.\n"
  );
}

async function seedExercises() {
  console.log("\nSeeding exercise catalogue...");
  const allExercises = await fetchExercises();
  const selectedExercises = filterExercises(allExercises);
  const sourceRows: ExerciseInsertRow[] = selectedExercises.map(mapExercise);
  const extraRows: ExerciseInsertRow[] = systemExerciseAdditions.map(
    (exercise) => ({ ...exercise })
  );
  const rows = [...sourceRows, ...extraRows];

  if (rows.length === 0) {
    console.warn(
      "No matching exercises found. Check EXERCISE_NAMES and the exercise source."
    );
    return;
  }

  // Slug is globally unique in the supplied schema. Conflict-ignore makes reruns safe.
  await db.insert(exercises).values(rows).onConflictDoNothing();
  console.log(
    `Processed ${rows.length} exercise seed rows (existing rows were left intact).`
  );
}

async function seedSystemWorkouts() {
  console.log("\nSeeding the seven system workout templates...");
  for (const template of SYSTEM_WORKOUTS) {
    await db
      .insert(workouts)
      .values(template)
      .onConflictDoUpdate({
        target: workouts.id,
        set: {
          userId: template.userId,
          name: template.name,
          description: template.description,
          workoutType: template.workoutType,
          isTemplate: template.isTemplate,
          category: template.category,
          image: template.image,
          updatedAt: new Date(),
        },
      });
  }
  console.log(`Upserted ${SYSTEM_WORKOUTS.length} system workout templates.`);
}

async function seedWorkouts(): Promise<{ id: string; name: string }[]> {
  const createdWorkouts: { id: string; name: string }[] = [];
  for (const template of WORKOUT_SEED_DATA) {
    const [newWorkout] = await db
      .insert(workouts)
      .values({
        name: template.name,
        description: template.description,
        userId: SEED_USER_ID,
        workoutType: "user",
        isTemplate: true,
      })
      .returning({ id: workouts.id, name: workouts.name });

    createdWorkouts.push(newWorkout);
  }
  console.log(
    `Created ${createdWorkouts.length} mock workouts for seed user ${SEED_USER_ID}.`
  );
  return createdWorkouts;
}

async function seedScheduledWorkouts(
  createdWorkouts: { id: string; name: string }[]
) {
  console.log("\nSeeding scheduled mock workouts...");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());
  const weekDates: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const dayDate = new Date(startOfWeek);
    dayDate.setDate(startOfWeek.getDate() + i);
    weekDates.push(dayDate);
  }

  const scheduledEntries: ScheduledWorkoutRow[] = [];
  for (const workout of WORKOUT_SEED_DATA) {
    const matchingWorkout = createdWorkouts.find(
      (item) => item.name === workout.name
    );
    if (!matchingWorkout) {
      console.warn(
        `Could not find workout "${workout.name}" — skipping scheduled entry.`
      );
      continue;
    }
    const scheduledDate = weekDates[workout.dayIndex];
    if (!scheduledDate) {
      console.warn(`Invalid dayIndex for "${workout.name}" — skipping.`);
      continue;
    }
    scheduledEntries.push({
      workoutId: matchingWorkout.id,
      userId: SEED_USER_ID,
      scheduledDate,
      createdAt: new Date(),
    });
  }

  if (scheduledEntries.length > 0) {
    await db.insert(scheduledWorkouts).values(scheduledEntries);
  }
  console.log(`Created ${scheduledEntries.length} scheduled mock workouts.`);
}

async function seedWorkoutExercises(
  createdWorkouts: { id: string; name: string }[]
) {
  console.log("\nSeeding mock user's workout exercises...");
  const seededExercises = await db
    .select({ id: exercises.id, name: exercises.name })
    .from(exercises);
  const exerciseMap = new Map(
    seededExercises.map((exercise) => [exercise.name, exercise.id])
  );
  const rows: {
    userId: string;
    workoutId: string;
    exerciseId: string;
    position: number;
    restSeconds: number;
    sets: number;
    reps: number;
  }[] = [];

  for (const workoutData of WORKOUT_EXERCISE_SEED_DATA) {
    const matchingWorkout = createdWorkouts.find(
      (workout) => workout.name === workoutData.workoutName
    );
    if (!matchingWorkout) {
      console.warn(
        `Could not find workout "${workoutData.workoutName}" — skipping.`
      );
      continue;
    }
    for (const exerciseData of workoutData.exercises) {
      const exerciseId = exerciseMap.get(exerciseData.exerciseName);
      if (!exerciseId) {
        console.warn(
          `Could not find exercise "${exerciseData.exerciseName}" — skipping.`
        );
        continue;
      }
      rows.push({
        userId: SEED_USER_ID,
        workoutId: matchingWorkout.id,
        exerciseId,
        position: exerciseData.position,
        restSeconds: exerciseData.restSeconds,
        sets: exerciseData.sets,
        reps: exerciseData.reps,
      });
    }
  }

  if (rows.length > 0) await db.insert(workoutExercises).values(rows);
  console.log(
    `Inserted ${rows.length} mock-user workout exercise associations.`
  );
}

async function seedSystemWorkoutExercises() {
  console.log("\nSeeding system workout exercise prescriptions...");
  const systemWorkoutIds = SYSTEM_WORKOUTS.map((workout) => workout.id);

  // Replace only links belonging to these seven system templates.
  await db
    .delete(workoutExercises)
    .where(inArray(workoutExercises.workoutId, systemWorkoutIds));

  const seededExercises = await db
    .select({ id: exercises.id, name: exercises.name })
    .from(exercises);
  const exerciseMap = new Map(
    seededExercises.map((exercise) => [exercise.name, exercise.id])
  );
  const rows: {
    userId: null;
    workoutId: string;
    exerciseId: string;
    position: number;
    restSeconds: number;
    sets: number;
    reps: number;
  }[] = [];

  for (const item of SYSTEM_WORKOUT_EXERCISE_SEED_DATA) {
    const exerciseId = exerciseMap.get(item.exerciseName);
    if (!exerciseId) {
      console.warn(
        `Missing exercise "${item.exerciseName}" for ${item.workoutName}; association skipped.`
      );
      continue;
    }
    rows.push({
      userId: null,
      workoutId: item.workoutId,
      exerciseId,
      position: item.position,
      restSeconds: item.restSeconds,
      sets: item.sets,
      reps: item.reps,
    });
  }

  if (rows.length > 0) await db.insert(workoutExercises).values(rows);
  console.log(`Inserted ${rows.length} associations across system templates.`);
}

async function seedWorkoutSessions(
  createdWorkouts: { id: string; name: string }[]
) {
  console.log("\nSeeding mock workout sessions...");
  const seededExercises = await db
    .select({ id: exercises.id, name: exercises.name })
    .from(exercises);
  const exerciseMap = new Map(
    seededExercises.map((exercise) => [exercise.name, exercise.id])
  );
  let sessionCount = 0;
  let setCount = 0;

  for (const sessionData of WORKOUT_SESSION_SEED_DATA) {
    const matchingWorkout = createdWorkouts.find(
      (workout) => workout.name === sessionData.workoutName
    );
    if (!matchingWorkout) {
      console.warn(
        `Could not find workout "${sessionData.workoutName}" — skipping session.`
      );
      continue;
    }

    const [newSession] = await db
      .insert(workoutSession)
      .values({
        userId: SEED_USER_ID,
        workoutId: matchingWorkout.id,
        startedtAt: sessionData.startedAt,
        completedAt: sessionData.completedAt,
        durationSeconds: sessionData.durationSeconds,
      })
      .returning({ id: workoutSession.id });
    sessionCount++;

    const sessionSetRows: {
      sessionId: string;
      exerciseId: string;
      setNumber: number;
      reps: number;
      weight: number | null;
    }[] = [];

    for (const setData of sessionData.sets) {
      const exerciseId = exerciseMap.get(setData.exerciseName);
      if (!exerciseId) {
        console.warn(
          `Could not find exercise "${setData.exerciseName}" — skipping session set.`
        );
        continue;
      }
      sessionSetRows.push({
        sessionId: newSession.id,
        exerciseId,
        setNumber: setData.setNumber,
        reps: setData.reps,
        weight: setData.weight ?? null,
      });
    }

    if (sessionSetRows.length > 0) {
      await db.insert(workoutSessionSets).values(sessionSetRows);
      setCount += sessionSetRows.length;
    }
  }

  console.log(
    `Successfully seeded ${sessionCount} mock workout sessions and ${setCount} sets.`
  );
}

async function main() {
  try {
    console.log("Starting Forge database seed...\n");
    await resetSeedData();
    await seedExercises();
    await seedSystemWorkouts();
    const createdWorkouts = await seedWorkouts();
    await seedScheduledWorkouts(createdWorkouts);
    await seedWorkoutExercises(createdWorkouts);
    await seedSystemWorkoutExercises();
    await seedWorkoutSessions(createdWorkouts);
    console.log("\nAll seed operations completed successfully!");
  } catch (error) {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  }
}

void main();
