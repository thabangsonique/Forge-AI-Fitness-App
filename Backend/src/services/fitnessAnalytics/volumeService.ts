// Backend/src/services/fitnessAnalytics/volumeService.ts
import { and, eq, gte, inArray, lt, sql } from "drizzle-orm";
import { db } from "../../db";
import { workoutSession, workoutSessionSets } from "../../db/schema";
import {
  formatAsJohannesburgDateString,
  getAnalyticsWeekWindows,
} from "./dateUtils";
import { VolumeTrend } from "./types";

/**
 * Calculates total volume (weight * reps) for the current week vs prior week,
 * and builds daily breakdown for charts.
 */
export async function calculateVolumeAnalytics(userId: string) {
  const { currentWeekStart, nextWeekStart, previousWeekStart } =
    getAnalyticsWeekWindows();

  const localDaySql = sql<string>`to_char(${workoutSession.completedAt} AT TIME ZONE 'Africa/Johannesburg', 'YYYY-MM-DD')`;

  // 1. Current week daily volume query
  const currentWeekDaily = await db
    .select({
      date: localDaySql,
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
        gte(workoutSession.completedAt, currentWeekStart),
        lt(workoutSession.completedAt, nextWeekStart)
      )
    )
    .groupBy(localDaySql)
    .orderBy(localDaySql);

  const currentVolumeMap = new Map<string, number>();
  for (const day of currentWeekDaily) {
    currentVolumeMap.set(day.date, Number(day.volume));
  }

  // 7-day skeleton for current week
  const dailyVolumes = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(currentWeekStart.getTime() + index * 24 * 60 * 60 * 1000);
    const dateStr = formatAsJohannesburgDateString(date);
    return {
      date: dateStr,
      volume: currentVolumeMap.get(dateStr) ?? 0,
    };
  });

  const currentWeeklyVolume = dailyVolumes.reduce(
    (sum, day) => sum + day.volume,
    0
  );

  // 2. Previous week total volume query
  const previousWeekResult = await db
    .select({
      totalVolume: sql<number>`coalesce(sum(${workoutSessionSets.reps} * coalesce(${workoutSessionSets.weight}, 0)), 0)`,
    })
    .from(workoutSessionSets)
    .innerJoin(
      workoutSession,
      eq(workoutSessionSets.sessionId, workoutSession.id)
    )
    .where(
      and(
        eq(workoutSession.userId, userId),
        gte(workoutSession.completedAt, previousWeekStart),
        lt(workoutSession.completedAt, currentWeekStart)
      )
    );

  const previousWeeklyVolume = Number(previousWeekResult[0]?.totalVolume ?? 0);

  let percentageChange = 0;
  if (previousWeeklyVolume > 0) {
    percentageChange = Math.round(
      ((currentWeeklyVolume - previousWeeklyVolume) / previousWeeklyVolume) * 100
    );
  } else if (currentWeeklyVolume > 0) {
    percentageChange = 100;
  }

  let status: VolumeTrend["status"] = "stable";
  if (percentageChange >= 5) {
    status = "increasing";
  } else if (percentageChange <= -5) {
    status = "decreasing";
  }

  const volumeTrend: VolumeTrend = {
    currentWeeklyVolumeKg: Math.round(currentWeeklyVolume),
    previousWeeklyVolumeKg: Math.round(previousWeeklyVolume),
    percentageChange,
    status,
  };

  return {
    volumeTrend,
    weekStart: dailyVolumes[0].date,
    weekEndExclusive: formatAsJohannesburgDateString(nextWeekStart),
    totalWeeklyVolume: currentWeeklyVolume,
    dailyVolumes,
  };
}

