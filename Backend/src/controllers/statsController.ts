// Backend/src/controllers/statsController.ts
import { fromNodeHeaders } from "better-auth/node";
import { and, count, desc, eq, gte, inArray, lt, sql } from "drizzle-orm";
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
import { getExerciseBreakdownForStats } from "../services/fitnessAnalytics/muscleDistributionService";
import { calculateMuscleStrengthMatrix } from "../services/fitnessAnalytics/strengthProgressionService";
import { calculateVolumeAnalytics } from "../services/fitnessAnalytics/volumeService";

/**
 * Controller: Handles the HTTP endpoint GET /api/stats.
 * Gathers user analytics for the mobile charts and dashboards.
 */
export const getUserStats = async (req: Request, res: Response) => {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (!session || !session.user) {
      return res.status(401).json({ error: "Unauthorized - no token found." });
    }

    const userId = session.user.id;

    const [
      totalWorkout,
      exerciseBreakedown,
      completedSession,
      recentActivity,
      peformanceMatrics,
      totalWeeklyVolume,
      userProfile,
      weeklyMuscleSets,
      muscleStrength,
    ] = await Promise.all([
      calculateTotalWorkouts(userId),
      calculatedExerciseBreakdown(userId),
      calculateCompletedSessions(userId),
      getRecentAcivity(userId),
      calculatePerformanceMetrics(userId),
      calculateWeeklyVolume(userId),
      getUserProfile(userId),
      calculateWeeklyMuscleSets(userId),
      calculateMuscleStrength(userId),
    ]);

    const stats = {
      overview: {
        totalWorkout,
        completedSession,
        userProfile,
      },
      exerciseBreakedown,
      recentActivity,
      peformanceMatrics,
      totalWeeklyVolume,
      weeklyMuscleSets,
      muscleStrength,
    };

    return res.status(200).json({ success: true, stats });
  } catch (error: any) {
    console.error("Error fetching stats", error);
    return res.status(500).json({ error: error.message });
  }
};

// -------------------------------------------------------------
// Database Calculations & Service Delegations
// -------------------------------------------------------------

export const calculateTotalWorkouts = async (userId: string) => {
  const result = await db
    .select({ count: count() })
    .from(workouts)
    .where(eq(workouts.userId, userId));

  return Number(result[0].count);
};

export const calculateCompletedSessions = async (userId: string) => {
  const result = await db
    .select({
      count: count(),
      totalDuration: sql<number>`sum(${workoutSession.durationSeconds})`,
    })
    .from(workoutSession)
    .where(eq(workoutSession.userId, userId));

  return {
    totalSessions: Number(result[0].count),
    totalDurationSeconds: Number(result[0].totalDuration) || 0,
  };
};

export const calculatedExerciseBreakdown = async (userId: string) => {
  return getExerciseBreakdownForStats(userId);
};

export const getRecentAcivity = async (userId: string) => {
  const recent = await db
    .select({
      id: workoutSession.id,
      workoutId: workoutSession.workoutId,
      workoutName: workouts.name,
      completedAt: workoutSession.completedAt,
      durationSeconds: workoutSession.durationSeconds,
    })
    .from(workoutSession)
    .innerJoin(workouts, eq(workoutSession.workoutId, workouts.id))
    .where(eq(workoutSession.userId, userId))
    .orderBy(desc(workoutSession.completedAt))
    .limit(10);

  const sessionIds = recent.map((session) => session.id);
  if (sessionIds.length === 0) {
    return [];
  }

  const sets = await db
    .select({
      sessionId: workoutSessionSets.sessionId,
      reps: workoutSessionSets.reps,
      weight: workoutSessionSets.weight,
    })
    .from(workoutSessionSets)
    .where(inArray(workoutSessionSets.sessionId, sessionIds));

  const volumeBySessionId = new Map<string, number>();
  for (const set of sets) {
    const volume = (set.reps || 0) * (set.weight ?? 0);
    const existing = volumeBySessionId.get(set.sessionId) || 0;
    volumeBySessionId.set(set.sessionId, existing + volume);
  }

  return recent.map((session) => ({
    ...session,
    totalVolume: volumeBySessionId.get(session.id) ?? 0,
    totalTimeMinutes: Math.round(session.durationSeconds / 60),
  }));
};

export const calculatePerformanceMetrics = async (userId: string) => {
  return db
    .select({
      muscle: exercises.muscle,
      totalVolume: sql<number>`sum(${workoutSessionSets.reps} * coalesce(${workoutSessionSets.weight}, 0))`,
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
};

export const getUserProfile = async (userId: string) => {
  return db.query.profiles.findFirst({
    where: eq(profiles.userId, userId),
  });
};

export const calculateWeeklyVolume = async (userId: string) => {
  return calculateVolumeAnalytics(userId);
};

export const calculateWeeklyMuscleSets = async (userId: string) => {
  const now = new Date();
  const JohannesburgNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);
  const currentDay = JohannesburgNow.getUTCDay();
  const daysSinceMonday = (currentDay + 6) % 7;

  const mondayUtc = Date.UTC(
    JohannesburgNow.getFullYear(),
    JohannesburgNow.getMonth(),
    JohannesburgNow.getDate() - daysSinceMonday
  );

  const currentWeekStart = new Date(mondayUtc - 2 * 60 * 60 * 1000);
  const historyStart = new Date(
    currentWeekStart.getTime() - 7 * 7 * 24 * 60 * 60 * 1000
  );
  const historyEnd = new Date(
    currentWeekStart.getTime() + 7 * 24 * 60 * 60 * 1000
  );

  const weekStartSql = sql<string>`to_char(date_trunc('week', ${workoutSession.completedAt} AT TIME ZONE 'Africa/johannesburg'), 'YYYY-MM-DD')`;

  const results = await db
    .select({
      weekStart: weekStartSql,
      muscle: exercises.muscle,
      sets: count(),
    })
    .from(workoutSessionSets)
    .innerJoin(
      workoutSession,
      eq(workoutSessionSets.sessionId, workoutSession.id)
    )
    .innerJoin(exercises, eq(workoutSessionSets.exerciseId, exercises.id))
    .where(
      and(
        eq(workoutSession.userId, userId),
        gte(workoutSession.completedAt, historyStart),
        lt(workoutSession.completedAt, historyEnd)
      )
    )
    .groupBy(weekStartSql, exercises.muscle)
    .orderBy(weekStartSql);

  return results.map((item) => ({
    weekStart: item.weekStart,
    muscle: item.muscle,
    sets: item.sets,
  }));
};

export const calculateMuscleStrength = async (userId: string) => {
  return calculateMuscleStrengthMatrix(userId);
};
