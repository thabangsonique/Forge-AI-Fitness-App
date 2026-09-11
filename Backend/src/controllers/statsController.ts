//(GET) user gets workout statistics. -
//-number of workouts - DONE
//-total workout time.(sum of all workout sessions) - DONE
//-average workout duration.(calculated from the total workout time) - DONE
import { fromNodeHeaders } from "better-auth/node";
import { count, desc, eq, inArray, sql } from "drizzle-orm";
import { Request, Response } from "express";
import { db } from "../db";
import {
  exercises,
  profiles,
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
    const [
      totalWorkout,
      completedSession,
      recentActivity,
      peformanceMatrics,
      userProfile,
    ] = await Promise.all([
      calculateTotalWorkouts(userId),
      calculateCompletedSessions(userId),
      getRecentAcivity(userId),
      calculatePerformanceMetrics(userId),
      getUserProfile(userId),
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

//recent user activity. - the recent workout.
const getRecentAcivity = async (userId: string) => {
  //fetch the from the workout table.
  const recent = await db
    .select({
      id: workoutSession.id,
      workoutId: workoutSession.workoutId,
      workoutName: workouts.name, //from join table
      completedAt: workoutSession.completedAt,
      durationSeconds: workoutSession.durationSeconds,
    })
    .from(workoutSession)
    .innerJoin(workouts, eq(workoutSession.workoutId, workouts.id))
    .where(eq(workoutSession.userId, userId))
    .orderBy(desc(workoutSession.completedAt))
    .limit(10);

  //find volumes for the sets using the session ids.
  const sessionIds = recent.map((session) => session.id);

  //find sets for the sessions.
  const sets = await db
    .select({
      sessionId: workoutSessionSets.id,
      reps: workoutSessionSets.reps,
      weight: workoutSessionSets.weight,
    })
    .from(workoutSessionSets)
    .where(inArray(workoutSessionSets.sessionId, sessionIds));

  const volumeBySessionId = new Map<string, number>();

  for (const set of sets) {
    const volume = set.reps * (set.weight ?? 0);

    const existing = volumeBySessionId.get(set.sessionId) || 0;

    volumeBySessionId.set(set.sessionId, existing + volume);
  }

  //return structured data.
  const recentWithStats = recent.map((session) => ({
    ...session,
    totalVolume: volumeBySessionId.get(session.id),
    totalTimeMinutes: Math.round(session.durationSeconds / 60),
  }));

  return recentWithStats;
};

//fetch performance matrics for the graph display peformance.
const calculatePerformanceMetrics = async (userId: string) => {
  const metric = await db
    .select({
      muscle: exercises.muscle,
      maxWeight: sql<number>`max(${workoutSessionSets.weight})`,
      avgWeight: sql<number>`avg(${workoutSessionSets.weight})`,
      maxReps: sql<number>`max(${workoutSessionSets.reps})`,
      totalVolume: sql<number>`sum(${workoutSessionSets.reps} * coalesce(${workoutSessionSets.weight}, 0))`,
      totalSets: count(),
    })
    .from(workoutSessionSets)
    .innerJoin(exercises, eq(workoutSessionSets.exerciseId, exercises.id))
    .innerJoin(
      workoutSession,
      eq(workoutSessionSets.sessionId, workoutSession.id)
    )
    .where(eq(workoutSession.userId, userId))
    .groupBy(exercises.muscle)
    .orderBy(
      desc(
        sql`sum(${workoutSessionSets.reps} * coalesce(${workoutSessionSets.weight}, 0))`
      )
    );

  return metric;
};

//fetch user profile.
const getUserProfile = async (userId: string) => {
  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.userId, userId),
  });

  return profile;
};
