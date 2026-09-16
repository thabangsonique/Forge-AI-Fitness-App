//1.user create workout.(POST) - DONE
//2. user fetch workout by id(GET) - DONE
//3.user fetch all created workouts. - DONE
import { fromNodeHeaders } from "better-auth/node";
import { and, eq, gte, lte } from "drizzle-orm";
import { Request, Response } from "express";
import { db } from "../db";
import { scheduledWorkouts, workouts } from "../db/schema";
import { auth } from "../lib/auth";

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
    const { name, description, scheduledDate } = req.body;

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
        isTemplate: false,
      })
      .returning();

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
    const allWorkouts = await db.query.workouts.findMany({
      where: eq(workouts.userId, session.user.id),
      orderBy: (workouts, { desc }) => [desc(workouts.createdAt)],
    });

    return res.status(200).json({ success: true, allWorkouts });
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
