//(GET) user gets workout statistics. -
//-number of workouts
//-total workout time.(sum of all workout sessions)
//-average workout duration.(calculated from the total workout time)
import { fromNodeHeaders } from "better-auth/node";
import { count, eq, sql } from "drizzle-orm";
import { Request, Response } from "express";
import { db } from "../db";
import {
  exercises,
  workouts,
  workoutSession,
  workoutSessionSets,
} from "../db/schema";
import { auth } from "../lib/auth";

export const getUserStats = async (req: Request, res: Response) => {
  try {
    //check user authentication
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (!session || !session.user) {
      return res.status(401).json({ error: "Unauthorized - no token found." });
    }

    const userId = session.user.id;

    //all data to be returned in these fields.
    const [totalWorkout, completedSession] = await Promise.all([
      calculateTotalWorkouts(userId),
      calculateCompletedSessions(userId),
    ]);
  } catch (error: any) {
    console.error("Error fetching stats", error);
    return res.status(500).json({ error: error.message });
  }
};

//FUNCTIONS.
//calculate total workouts uerser created.
const calculateTotalWorkouts = async (userId: string) => {
  const result = await db
    .select({ count: count() })
    .from(workouts)
    .where(eq(workouts.userId, userId));

  //return only the count number. from row.
  return Number(result[0].count);
};

//fetch workout sessions the user completed.
const calculateCompletedSessions = async (userId: string) => {
  const result = await db
    .select({
      count: count(),
      totalDuration: sql<number>`sum ${workoutSession.durationSeconds}`,
    })
    .from(workoutSession)
    .where(eq(workoutSession.userId, userId));

  return {
    totalSessions: Number(result[0].count),
    totalDurationSeconds: Number(result[0].count) || 0,
  };
};

//fetch exercise breakdown - user to know which muscles are neglected.
const calculatedExerciseBreakdown = async (userId: string) => {
  //fetch all workoutsession sets.
  const breakdown = await db
    .select({
      muscle: exercises.muscle,
      exerciseName: exercises.name,
      count: count(),
    })
    .from(workoutSessionSets)
    .innerJoin(
      workoutSession,
      eq(workoutSessionSets.sessionId, workoutSession.id)
    )
    .innerJoin(exercises, eq(workoutSessionSets.exerciseId, exercises.id))
    .where(eq(workoutSession.userId, userId))
    .groupBy(exercises.muscle, exercises.name);

  return breakdown;
};
