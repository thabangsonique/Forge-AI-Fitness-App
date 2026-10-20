//(GET) user gets workout statistics. -
//-number of workouts - DONE
//-total workout time.(sum of all workout sessions) - DONE
//-average workout duration.(calculated from the total workout time) - DONE
import { fromNodeHeaders } from "better-auth/node";
import { and, count, desc, eq, gte, inArray, lt, max, sql } from "drizzle-orm";
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

//get start of the week function.
const getJohannesburgWeekStart = (date: Date) => {
  const johhanessburgNow = new Date(date.getTime() + 2 * 60 * 60 * 1000);

  const currentDay = johhanessburgNow.getUTCDay();

  const daysSinceMonday = (currentDay + 6) % 7;

  const mondayUtc = Date.UTC(
    johhanessburgNow.getUTCFullYear(),
    johhanessburgNow.getUTCMonth(),
    johhanessburgNow.getUTCDate() - daysSinceMonday
  );

  return new Date(mondayUtc - 2 * 60 * 60 * 1000);
};

const formatAsJohannesburgDateString = (date: Date): string => {
  const johannesburgTime = new Date(date.getTime() + 2 * 60 * 60 * 1000);
  const year = johannesburgTime.getUTCFullYear();
  const month = String(johannesburgTime.getUTCMonth() + 1).padStart(2, "0");
  const day = String(johannesburgTime.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

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
      totalDuration: sql<number>`sum( ${workoutSession.durationSeconds})`,
    })
    .from(workoutSession)
    .where(eq(workoutSession.userId, userId));

  return {
    totalSessions: Number(result[0].count),
    totalDurationSeconds: Number(result[0].totalDuration) || 0,
  };
};

//fetch exercise breakdown - user to know which muscles are neglected.
const calculatedExerciseBreakdown = async (userId: string) => {
  //1 find current week days boundary.

  const now = new Date();

  //find jhb calendar date.
  const johhanessburgNow = new Date(now.getTime() - 2 * 60 * 60 * 1000);

  //find jhb day in index form
  const currentDay = johhanessburgNow.getUTCDay();
  const daysSinceMonday = (currentDay + 6) % 7;

  const mondayUtc = Date.UTC(
    johhanessburgNow.getFullYear(),
    johhanessburgNow.getUTCMonth(),
    johhanessburgNow.getUTCDate() - daysSinceMonday
  );

  const weekStart = new Date(mondayUtc - 2 * 60 * 60 * 1000);

  const nextWeekStart = new Date(
    mondayUtc + 7 * 24 * 60 * 60 * 1000 - 2 * 60 * 60 * 1000
  );

  //fetch all workoutsession sets.
  const breakdown = await db
    .select({
      muscle: exercises.muscle,
      totalSets: count(),
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
        gte(workoutSession.completedAt, weekStart),
        lt(workoutSession.completedAt, nextWeekStart)
      )
    )
    .groupBy(exercises.muscle);

  //calulate total sets.(weekly)
  const totalSets = breakdown.reduce((total, item) => {
    return total + item.totalSets;
  }, 0);

  //find each muscle sets distribution.
  const muscleDistribution = breakdown.map((item) => {
    const sets = Number(item.totalSets);

    const percentage = Number((sets / totalSets) * 100).toFixed();

    return {
      muscle: item.muscle,
      sets: item.totalSets,
      percentage,
    };
  });

  return {
    weekStart: new Date(mondayUtc).toISOString().slice(0, 10),

    weekEndExclusive: new Date(mondayUtc + 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10),

    totalSets,
    muscleDistribution,
  };
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

  if (sessionIds.length === 0) {
    return [];
  }
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
    //calculate volume for th current set.
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

  console.log("Performance metric", metric);
  return metric;
};

//fetch user profile.
const getUserProfile = async (userId: string) => {
  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.userId, userId),
  });

  return profile;
};

//calculate total weekly volume
const calculateWeeklyVolume = async (userId: string) => {
  //find current date according to jhb timezone.
  const now = new Date();

  const JohannesburgNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);

  //get the week day index version of the johhanessburgNow date.
  const dayOfWeek = JohannesburgNow.getUTCDay();
  const daySinceMonday = (dayOfWeek + 6) % 7;

  //find monday in miliseconds.
  const mondayUtc = Date.UTC(
    JohannesburgNow.getUTCFullYear(),
    JohannesburgNow.getUTCMonth(),
    JohannesburgNow.getUTCDate() - daySinceMonday //gives us date of monday
  );

  //monday as start of week arccording to jhb timezone.
  const weekStart = new Date(mondayUtc - 2 * 24 * 60 * 60 * 1000);

  const nextWeekStart = new Date(
    mondayUtc + 7 * 24 * 60 * 60 * 1000 - 2 * 60 * 60 * 1000
  );

  const localDay = sql<string>`to_char(${workoutSession.completedAt} AT TIME ZONE 'Africa/Johannesburg',
      'YYYY-MM-DD' )`;

  //fetch volumes from data.
  const dailyResults = await db
    .select({
      date: localDay,
      volume: sql<number>`coalesce(sum(${workoutSessionSets.reps} * coalesce(${workoutSessionSets.weight}, 0)), 0)`,
    })
    .from(workoutSessionSets)
    .innerJoin(
      workoutSession,
      eq(workoutSessionSets.sessionId, workoutSession.id)
    )
    .where(
      and(
        eq(workoutSession.userId, userId),
        gte(workoutSession.completedAt, weekStart),
        lt(workoutSession.completedAt, nextWeekStart)
      )
    )
    .groupBy(localDay)
    .orderBy(localDay);

  const volumeByDate = new Map<string, number>();

  for (const day of dailyResults) {
    volumeByDate.set(day.date, day.volume);
  }

  //fetch all days, accomodate days without workout session.
  const dailyVolumes = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(mondayUtc + index * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);

    return {
      date,
      volume: volumeByDate.get(date) ?? 0,
    };
  });

  //accumulator to find total volume.
  const totalVolume = dailyVolumes.reduce(
    (total, day) => total + day.volume,
    0
  );

  return {
    weekStart: dailyVolumes[0].date,
    weekEndExclusive: new Date(mondayUtc + 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10),

    totalWeeklyVolume: totalVolume,
    dailyVolumes,
  };
};

//FETCH TOTAL MUSCLE WEEKLY SETS.
const calculateWeeklyMuscleSets = async (userId: string) => {
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

  //use the current monday of the week to find the previous 7 weeks
  const historyStart = new Date(
    currentWeekStart.getTime() - 7 * 7 * 24 * 60 * 60 * 1000
  );

  const historyEnd = new Date(
    currentWeekStart.getTime() + 7 * 24 * 60 * 60 * 1000
  );
  const weekStart = sql<string>`to_char(date_trunc( 'week', ${workoutSession.completedAt} AT TIME ZONE 'Africa/johannesburg'), 'YYYY-MM-DD')`;

  const results = await db
    .select({
      weekStart,
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
    .groupBy(weekStart, exercises.muscle)
    .orderBy(weekStart);

  //return an array.
  return results.map((item) => ({
    weekStart: item.weekStart,
    muscle: item.muscle,
    sets: item.sets,
  }));
};

const calculateMuscleStrength = async (userId: string) => {
  const now = new Date();

  //monday of the current week
  const currentWeekMonday = getJohannesburgWeekStart(now);

  //find monday of 6 weeks back
  const historyStart = new Date(
    currentWeekMonday.getTime() - 6 * 7 * 24 * 60 * 60 * 1000
  );

  const historyEnd = new Date(
    currentWeekMonday.getTime() + 7 * 24 * 60 * 60 * 1000
  );

  const weekStartSql = sql<string>`to_char(date_trunc('week', ${workoutSession.completedAt} AT TIME ZONE 'Africa/johannesburg'), 'YYYY-MM-DD')`;

  const estimated1RM = sql<number>`
    COALESCE(${workoutSessionSets.weight}, 0) *
    (1 + (${workoutSessionSets.reps}::numeric / 30))
  `;

  const result = await db
    .select({
      weekStart: weekStartSql,
      muscle: exercises.muscle,
      best1RM: max(estimated1RM),
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

  //all the 7 weeks.
  const weekSkeleton = Array.from({ length: 7 }, (_, index) => {
    const mondayOfWeek = new Date(
      historyStart.getTime() + index * 7 * 24 * 60 * 60 * 1000
    );

    return {
      weekStart: mondayOfWeek,
      label: `W${index + 1}`,
    };
  });

  //array of muscles trained
  const muscleTrained = Array.from(new Set(result.map((row) => row.muscle)));

  const fullMatrix = muscleTrained.flatMap((muscle) =>
    weekSkeleton.map((week) => {
      const weekStartString = formatAsJohannesburgDateString(week.weekStart);
      const matchingRow = result.find(
        (row) => row.muscle === muscle && row.weekStart === weekStartString
      );

      return {
        weekStart: week.weekStart,
        weekLabel: week.label,
        muscle,
        best1RM: matchingRow?.best1RM
          ? Math.round(Number(matchingRow.best1RM) * 10) / 10
          : 0,
      };
    })
  );
  return fullMatrix;
};
