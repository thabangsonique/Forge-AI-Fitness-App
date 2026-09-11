//1.user create workout.(POST) - DONE
//2. user fetch workout by id(GET) - DONE
//3.user fetch all created workouts. - DONE
import { fromNodeHeaders } from "better-auth/node";
import { eq } from "drizzle-orm";
import { Request, Response } from "express";
import { db } from "../db";
import { workouts } from "../db/schema";
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
    const { name, description } = req.body;

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
  } catch (error: any) {
    console.error("Server failed to fetch ALL workouts", error);

    return res.status(500).json({
      error: error.message,
    });
  }
};
