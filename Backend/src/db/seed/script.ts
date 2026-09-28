import "dotenv/config";
import { eq } from "drizzle-orm";
import { db } from "../index";
import {
  exercises,
  scheduledWorkouts,
  workoutExercises,
  workouts,
  workoutSession,
  workoutSessionSets,
} from "../schema";
import {
  EXERCISE_DATA_URL,
  EXERCISE_IMAGE_URL,
  EXERCISE_NAMES,
  type SourceExercise,
} from "./exercises";
import { SEED_USER_ID, WORKOUT_SEED_DATA } from "./scheduledWorkouts";
import { WORKOUT_EXERCISE_SEED_DATA } from "./workoutExercises";
import { WORKOUT_SESSION_SEED_DATA } from "./workoutSessions";

type ExerciseRow = {
  slug: string;
  name: string;
  description: string;
  muscle: string;
  equipment: string | null;
  difficulty: string;
  forceType: string | null;
  mechanics: string | null;
  category: string;
  userId: null;
};

type ScheduledWorkoutRow = {
  workoutId: string;
  userId: string;
  scheduledDate: Date;
  createdAt: Date;
};

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

function mapExercise(source: SourceExercise): ExerciseRow {
  const images = source.images ?? [];

  const imageUrl =
    images.length > 0
      ? `${EXERCISE_IMAGE_URL}/${images[0]}`
      : `${EXERCISE_IMAGE_URL}/default.jpg`;

  console.log(`Using image: ${imageUrl}`);

  return {
    slug: source.id,
    name: source.name,
    description: source.name,
    muscle: source.primaryMuscles.join(", "),
    equipment: source.equipment,
    difficulty: source.level,
    forceType: source.force,
    mechanics: source.mechanic,
    category: source.category,
    userId: null,
  };
}

function filterExercises(exerciseList: SourceExercise[]): SourceExercise[] {
  const wanted = new Set(EXERCISE_NAMES);

  return exerciseList.filter((exercise) => wanted.has(exercise.name));
}

async function resetSeedData() {
  console.log("Clearing existing seed data...");

  await db.delete(workoutSessionSets);

  await db.delete(workoutSession);

  await db.delete(workoutExercises);

  await db.delete(scheduledWorkouts);

  await db.delete(workouts).where(eq(workouts.userId, SEED_USER_ID));

  await db.delete(exercises);

  console.log("Existing seed data cleared.\n");
}

async function seedExercises() {
  try {
    const allExercises = await fetchExercises();

    const selectedExercises = filterExercises(allExercises);

    if (selectedExercises.length === 0) {
      console.warn("No matching exercises found. Check EXERCISE_NAMES.");

      return;
    }

    const rows: ExerciseRow[] = selectedExercises.map(mapExercise);

    console.log(`Inserting ${rows.length} exercises...`);

    await db.insert(exercises).values(rows);

    console.log(`Successfully seeded ${rows.length} exercises.`);
  } catch (error) {
    console.error("Error seeding exercises:", error);

    process.exit(1);
  }
}

async function seedWorkouts(): Promise<{ id: string; name: string }[]> {
  try {
    const createdWorkouts: {
      id: string;
      name: string;
    }[] = [];

    for (const template of WORKOUT_SEED_DATA) {
      const [newWorkout] = await db
        .insert(workouts)
        .values({
          name: template.name,
          description: template.description,
          userId: SEED_USER_ID,
          isTemplate: true,
        })
        .returning();

      createdWorkouts.push({
        id: newWorkout.id,
        name: newWorkout.name,
      });
    }

    console.log(
      `Created ${createdWorkouts.length} workouts for user ${SEED_USER_ID}`
    );

    return createdWorkouts;
  } catch (error) {
    console.error("Error seeding workouts:", error);

    process.exit(1);
  }
}

async function seedScheduledWorkouts(
  createdWorkouts: {
    id: string;
    name: string;
  }[]
) {
  try {
    await db
      .delete(scheduledWorkouts)
      .where(eq(scheduledWorkouts.userId, SEED_USER_ID));

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
        (createdWorkout) => createdWorkout.name === workout.name
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

      console.log(
        `Created ${scheduledEntries.length} scheduled workouts across the week.`
      );
    }

    console.log("\nScheduled workout summary:");

    scheduledEntries.forEach((entry) => {
      const createdWorkout = createdWorkouts.find(
        (workout) => workout.id === entry.workoutId
      );

      const workout = WORKOUT_SEED_DATA.find(
        (workout) => workout.name === createdWorkout?.name
      );

      const dayLabel = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][
        workout?.dayIndex ?? -1
      ];

      console.log(
        `  - ${workout?.name} scheduled for ${entry.scheduledDate.toDateString()} (${dayLabel})`
      );
    });
  } catch (error) {
    console.error("Error seeding scheduled workouts:", error);

    process.exit(1);
  }
}

async function seedWorkoutExercises(
  createdWorkouts: {
    id: string;
    name: string;
  }[]
) {
  try {
    console.log("\nSeeding workout exercises...");

    const seededExercises = await db
      .select({
        id: exercises.id,
        name: exercises.name,
      })
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

    if (rows.length > 0) {
      await db.insert(workoutExercises).values(rows);

      console.log(`Successfully seeded ${rows.length} workout exercises.`);
    } else {
      console.log("No workout exercises were inserted.");
    }
  } catch (error) {
    console.error("Error seeding workout exercises:", error);

    process.exit(1);
  }
}

async function seedWorkoutSessions(
  createdWorkouts: {
    id: string;
    name: string;
  }[]
) {
  try {
    console.log("\nSeeding workout sessions...");

    const seededExercises = await db
      .select({
        id: exercises.id,
        name: exercises.name,
      })
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
        .returning();

      sessionCount++;

      const sessionSetRows: {
        sessionId: string;
        exerciseId: string;
        setNumber: number;
        reps: number;
        weight: number;
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
          weight: setData.weight,
        });
      }

      if (sessionSetRows.length > 0) {
        await db.insert(workoutSessionSets).values(sessionSetRows);

        setCount += sessionSetRows.length;
      }
    }

    console.log(`Successfully seeded ${sessionCount} workout sessions.`);

    console.log(`Successfully seeded ${setCount} workout session sets.`);
  } catch (error) {
    console.error("Error seeding workout sessions:", error);

    process.exit(1);
  }
}

async function main() {
  try {
    console.log("Starting database seed...\n");

    await resetSeedData();

    // Stage 1: Seed exercises
    await seedExercises();

    // Stage 2: Seed workouts
    const createdWorkouts = await seedWorkouts();

    // Stage 3: Seed scheduled workouts
    await seedScheduledWorkouts(createdWorkouts);

    // Stage 4: Seed exercises belonging
    // to each workout
    await seedWorkoutExercises(createdWorkouts);

    // Stage 5: Seed completed workout
    // sessions and session sets
    await seedWorkoutSessions(createdWorkouts);

    console.log("\nAll seeds completed successfully!");
  } catch (error) {
    console.error("Fatal seed error:", error);

    process.exit(1);
  }
}

main();
