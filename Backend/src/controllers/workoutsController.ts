//1.user create workout.(POST) - DONE
//2. user fetch workout by id(GET) - DONE
//3.user fetch all created workouts. - DONE
import { fromNodeHeaders } from "better-auth/node";
import { and, asc, eq, gte, lte, sql } from "drizzle-orm";
import { Request, Response } from "express";
import { db } from "../db";
import {
  exercises,
  scheduledWorkouts,
  workoutExercises,
  workouts,
} from "../db/schema";
import { auth } from "../lib/auth";

//workouts grouping helper function.

//CREATING A WORKOUT
export const createWorkout = async (req: Request, res: Response) => {
  try {
    //verify if user is authenticated for the request.
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (!session || !session.user) {
      return res.status(401).json({ error: "Unauthorized- No token found" });
    }

    //if token found. grab data from the body.
    const { name, description, category, exercises, scheduledDate } = req.body;

    if (!name) {
      return res.status(400).json({ error: "Name is required" });
    }

    //create the workout.
    const [newWorkout] = await db
      .insert(workouts)
      .values({
        name,
        description: description || null,
        userId: session.user.id,
        category: category || null,
        isTemplate: false,
      })
      .returning();

    if (exercises && exercises.length > 0 && Array.isArray(exercises)) {
      const addedExercises = exercises.map((ex: any, index) => ({
        userId: session.user.id,
        workoutId: newWorkout.id,
        exerciseId: ex.exerciseId,
        restSeconds: ex.restSeconds,
        sets: ex.sets,
        reps: ex.reps,
        position: index,
      }));

      //add the exercises.
      await db.insert(workoutExercises).values(addedExercises);
    }

    if (scheduledDate) {
      const date = new Date(scheduledDate);

      if (isNaN(date.getTime())) {
        return res.status(400).json({ error: "Invalid scheduled date." });
      }

      await db.insert(scheduledWorkouts).values({
        workoutId: newWorkout.id,
        userId: session.user.id,
        scheduledDate: date,
        createdAt: new Date(),
      });
    }

    return res.status(200).json({ success: true, workout: newWorkout });
  } catch (error: any) {
    console.error("Server Failed to create workout", { error: error.message });
    return res.status(500).json({
      error: error.message,
    });
  }
};

//fetch workout by ID.
export const getWorkoutById = async (req: Request, res: Response) => {
  try {
    //check if user is authenticated.
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (!session || !session.user) {
      return res.status(401).json({ error: "Unauthorized-No token found" });
    }

    const { id } = req.params;
    //fetch the workout by ID
    const workout = await db.query.workouts.findFirst({
      where: eq(workouts.id, id as string),
    });

    if (!workout) {
      return res.status(404).json({ error: "Workout not found." });
    }

    return res.status(200).json({ success: true, workout });
  } catch (error: any) {
    console.error("Server failed to fetch workout by ID", error);

    return res.status(500).json({
      error: error.message,
    });
  }
};

//FETCH ALL THE WORKOUTS.
export const getAllWorkouts = async (req: Request, res: Response) => {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (!session || !session.user) {
      return res.status(400).json({ error: "Unauthorized- no token found" });
    }

    //fetch all the workouts.
    const allWorkouts = await db
      .select({
        // ----------------------------
        // Workout information
        // ----------------------------

        workoutId: workouts.id,
        workoutName: workouts.name,
        workoutDescription: workouts.description,

        // ----------------------------
        // Exercise information
        // ----------------------------

        exerciseId: exercises.id,
        exerciseName: exercises.name,
        exerciseDescription: exercises.description,
        muscle: exercises.muscle,
        equipment: exercises.equipment,
        difficulty: exercises.difficulty,
        forceType: exercises.forceType,
        mechanics: exercises.mechanics,
        category: exercises.category,

        // ----------------------------
        // Workout-exercise information
        // ----------------------------

        workoutExerciseId: workoutExercises.id,
        position: workoutExercises.position,
        sets: workoutExercises.sets,
        reps: workoutExercises.reps,
        restSeconds: workoutExercises.restSeconds,
      })
      .from(workouts)
      .leftJoin(workoutExercises, eq(workouts.id, workoutExercises.workoutId))
      .leftJoin(exercises, eq(workoutExercises.exerciseId, exercises.id))
      .where(eq(workouts.userId, session.user.id));

    const groupedWorkouts = allWorkouts.reduce(
      (acc, row) => {
        // --------------------------------------------------------
        // If this workout doesn't exist in the accumulator yet,
        // create it.
        // --------------------------------------------------------

        if (!acc[row.workoutId]) {
          acc[row.workoutId] = {
            id: row.workoutId,
            name: row.workoutName,
            description: row.workoutDescription,

            exercises: [],

            exerciseCount: 0,
            totalSets: 0,
          };
        }

        // --------------------------------------------------------
        // Add the current exercise to this workout
        // --------------------------------------------------------

        if (row.exerciseId) {
          acc[row.workoutId].exercises.push({
            id: row.exerciseId,
            workoutExerciseId: row.workoutExerciseId,

            name: row.exerciseName,
            description: row.exerciseDescription,
            muscle: row.muscle,
            equipment: row.equipment,
            difficulty: row.difficulty,
            forceType: row.forceType,
            mechanics: row.mechanics,
            category: row.category,

            position: row.position,
            sets: row.sets,
            reps: row.reps,
            restSeconds: row.restSeconds,
          });

          // ------------------------------------------------------
          // Increase number of exercises
          // ------------------------------------------------------

          acc[row.workoutId].exerciseCount += 1;

          // ------------------------------------------------------
          // Add this exercise's sets to the workout's total sets
          // ------------------------------------------------------

          acc[row.workoutId].totalSets += row.sets ?? 0;
        }

        // Give the accumulator back to reduce()
        return acc;
      },

      // Initial accumulator
      {} as Record<string, any>
    );

    const formattedWorkouts = Object.values(groupedWorkouts);

    return res
      .status(200)
      .json({ success: true, allWorkouts: formattedWorkouts });
  } catch (error: any) {
    console.error("Server failed to fetch ALL workouts", error);

    return res.status(500).json({
      error: error.message,
    });
  }
};

//fetch all the scheduled workouts.
export const getScheduledWorkouts = async (req: Request, res: Response) => {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (!session || !session.user) {
      return res.status(401).json({ error: "Unauthorized- no token found." });
    }

    const userId = session.user.id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    //identif sunday of the week.
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());

    //identify saturday of the week.
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 6);

    const scheduled = await db.query.scheduledWorkouts.findMany({
      where: and(
        eq(scheduledWorkouts.userId, userId),
        gte(scheduledWorkouts.scheduledDate, startOfWeek),
        lte(scheduledWorkouts.scheduledDate, endOfWeek)
      ),
      orderBy: (scheduledWorkouts, { asc }) => [
        asc(scheduledWorkouts.scheduledDate),
      ],
    });

    const formated = scheduled.map((sw) => ({
      workoutId: sw.workoutId,
      scheduledDate: sw.scheduledDate,
    }));

    return res.status(200).json({ success: true, scheduledWorkouts: formated });
  } catch (error: any) {
    console.error("Server failed to fetch scheduled workouts", error);
    return res.status(500).json({ error: error.message });
  }
};

export const getWorkoutsBySearch = async (req: Request, res: Response) => {
  try {
    const session = await auth.api.getSession();

    if (!session || !session.user) {
      return res.status(401).json({ error: "Unauthorized-no token found" });
    }

    //grab saerch name.
    const { name } = req.query;

    if (!name || typeof name !== "string") {
      return res.status(400).json({ error: "Search name is required" });
    }

    //convert name to lowercase.
    const searchTerm = name.trim().toLowerCase();

    const searchResults = await db
      .select({
        workoutId: workouts.id,
        workoutName: workouts.name,
        workoutDescription: workouts.description,

        position: workoutExercises.position,
        rest: workoutExercises.restSeconds,
        sets: workoutExercises.sets,
        reps: workoutExercises.reps,

        exerciseId: exercises.id,
        exerciseName: exercises.name,
        exerciseDescription: exercises.description,
        muscle: exercises.muscle,
        equipment: exercises.equipment,
        difficulty: exercises.difficulty,
        mechanics: exercises.mechanics,
        category: exercises.category,
      })
      .from(workouts)
      .innerJoin(workoutExercises, eq(workouts.id, workoutExercises.workoutId))
      .innerJoin(exercises, eq(workoutExercises.exerciseId, exercises.id))
      .where(
        and(
          eq(workouts.userId, session.user.id),
          sql`${workouts.name} ILIKE ${`%${searchTerm}%`}`
        )
      )
      .orderBy(asc(workouts.name), asc(workoutExercises.position));

    //group workouts, sets & exercises.
    const groupedWorkouts = searchResults.reduce(
      (acc, row) => {
        if (!acc[row.workoutId]) {
          //create the workout object.
          acc[row.workoutId] = {
            id: row.workoutId,
            name: row.workoutName,
            description: row.workoutDescription,
            exercises: [],
            exerciseCount: 0,
            totalSets: 0,
          };
        }

        //add exercises Record if workout already exists.
        acc[row.workoutId].exercises.push({
          id: row.exerciseId,
          name: row.exerciseName,
          description: row.exerciseDescription,
          muscle: row.muscle,
          equipment: row.equipment,
          difficulty: row.difficulty,
          mechanics: row.mechanics,
          category: row.category,
        });

        acc[row.workoutId].exerciseCount += 1;
        acc[row.workoutId].totalSets += row.sets;

        return acc;
      },
      {} as Record<string, any>
    );

    const formattedWorkouts = Object.values(groupedWorkouts);

    return res
      .status(200)
      .json({ success: true, searchResults: formattedWorkouts });
  } catch (error: any) {
    console.error("Error searching workouts:", error);
    return res.status(500).json({ error: error.message });
  }
};
