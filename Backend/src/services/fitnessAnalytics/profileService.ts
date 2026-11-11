// Backend/src/services/fitnessAnalytics/profileService.ts
import { eq } from "drizzle-orm";
import { db } from "../../db";
import { profiles } from "../../db/schema";
import { UserFitnessProfile } from "./types";

export async function getUserFitnessProfile(
  userId: string
): Promise<UserFitnessProfile> {
  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.userId, userId),
  });

  return {
    gender: profile?.gender ?? "unspecified",
    goal: profile?.goal ?? "build muscle",
    experience: profile?.experience ?? "intermediate",
    weightUnit: profile?.weightUnit ?? "kg",
    workoutsPerWeekTarget: profile?.workoutsPerWeek ?? 4,
  };
}
