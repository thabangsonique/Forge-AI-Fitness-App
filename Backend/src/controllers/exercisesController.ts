//1.(GET) user able to look up get all or search exercise with filter. when creating a workout. - DONE
//2. user fetch exercise by Id - DONE
//3. generate instructions from AI(GET) - TO-DO

import { fromNodeHeaders } from "better-auth/node";
import { eq } from "drizzle-orm";
import { Request, Response } from "express";
import { db } from "../db";
import { exercises } from "../db/schema";
import { auth } from "../lib/auth";

//USER GET ALL EXERCISES.
export const getExercises = async (req: Request, res: Response) => {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (!session || !session.user) {
      return res.status(401).json({ error: "Unauthorized - no token found." });
    }

    //fetch all exercises.
    const allExercises = await db.query.exercises.findMany({
      where: eq(exercises.userId, session.user.id),
    });

    return res.status(200).json({ success: true, allExercises });
  } catch (error: any) {
    console.error("Error fetching all exercises", error);
    return res.status(500).json({ error: error.message });
  }
};

//FETCH EXERCISE BY ID.
export const getExerciseById = async (req: Request, res: Response) => {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (!session || !session.user) {
      return res.status(401).json({ error: "Unauthorized - no token found." });
    }

    const { id } = req.params;
    //fetch exercise.
    const exercise = await db.query.exercises.findFirst({
      where: eq(exercises.id, id as string),
    });

    if (!exercise) {
      return res.status(404).json({ error: "Exercise not found" });
    }

    return res.status(200).json({ success: true, exercise });
  } catch (error: any) {
    console.error("Error fetching exercise", error);
    return res.status(500).json({ error: error.message });
  }
};
