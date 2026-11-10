import { count, desc, eq, gte, sql } from "drizzle-orm";
import { db } from "../../db";
import { aiGlobalUsageDaily, aiUsageEvents } from "../../db/schema";
import { formatAsJohannesburgDateString } from "../fitnessAnalytics/dateUtils";
import { loadAiConfig } from "./aiUsageConfig";
import { AiFeatureType, QuotaCheckResult } from "./types";

export const checkGlobalAiQuota = async (
  userId: string
): Promise<QuotaCheckResult> => {
  const config = loadAiConfig();
  const now = new Date();

  if (!config.aiEnabled) {
    return {
      allowed: false,
      reason:
        "AI coaching features are temporarily paused for maintenance. Please check back later.",
      currentDailyRequests: 0,
      maxDailyRequests: config.globalDailyRequestCap,
    };
  }

  //Prevent user from mash generating AIs or double clicking.

  const [mostRecentUserEvent] = await db
    .select({ createdAt: aiUsageEvents.createdAt })
    .from(aiUsageEvents)
    .where(eq(aiUsageEvents.userId, userId))
    .orderBy(desc(aiUsageEvents.createdAt))
    .limit(1);

  if (mostRecentUserEvent) {
    const msSinceLastRequest =
      now.getTime() - mostRecentUserEvent.createdAt.getTime();

    const cooldownMS = config.userCooldownSeconds * 1000;
    if (msSinceLastRequest < cooldownMS) {
      const waitSeconds = Math.ceil((cooldownMS - msSinceLastRequest) / 1000);

      return {
        allowed: false,
        reason: `Please wait ${waitSeconds} second${waitSeconds > 1 ? "s" : ""} before making another AI request.`,
        currentDailyRequests: 0,
        maxDailyRequests: config.globalDailyRequestCap,
        retryAfterSeconds: waitSeconds,
      };
    }
  }

  const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);

  const [recentMinuteRequests] = await db
    .select({
      count: count(),
    })
    .from(aiUsageEvents)
    .where(gte(aiUsageEvents.createdAt, oneMinuteAgo));

  //fetch current request per minute globally
  const currentRPM = Number(recentMinuteRequests?.count || 0);

  if (currentRPM >= config.maxRequestsPerMinute) {
    return {
      allowed: false,
      reason:
        "Forge AI is experiencing high traffic right now. Please retry in a few moments.",
      currentDailyRequests: 0,
      maxDailyRequests: config.globalDailyRequestCap,
      retryAfterSeconds: 15,
    };
  }

  // check for Global Daily Requests Cap.
  const todayString = formatAsJohannesburgDateString(now);

  const todayUsage = await db.query.aiGlobalUsageDaily.findFirst({
    where: eq(aiGlobalUsageDaily.date, todayString),
  });

  const currentDailyRequests = todayUsage?.totalRequests || 0;

  if (currentDailyRequests >= config.globalDailyRequestCap) {
    return {
      allowed: false,
      reason:
        "The daily AI generation limit for Forge has been reached for today. New generations will reopen at midnight.",
      currentDailyRequests,
      maxDailyRequests: config.globalDailyRequestCap,
    };
  }

  return {
    allowed: true,
    currentDailyRequests,
    maxDailyRequests: config.globalDailyRequestCap,
  };
};

//log completed and track AI usage.
export const recordDailyQuotaUsage = async (
  feature: AiFeatureType,
  inputTokens: number,
  outputTokens: number
): Promise<void> => {
  const todayString = formatAsJohannesburgDateString(new Date());

  await db
    .insert(aiGlobalUsageDaily)
    .values({
      date: todayString,
      totalRequests: 1,
      insightRequests: feature === "coach_insight" ? 1 : 0,
      workoutRequests: feature === "workout_generation" ? 1 : 0,
      inputTokens,
      outputTokens,
      estimatedCostUsd: 0, //free tier
    })
    .onConflictDoUpdate({
      target: aiGlobalUsageDaily.date,
      set: {
        totalRequests: sql`${aiGlobalUsageDaily.totalRequests} + 1`,

        insightRequests:
          feature === "coach_insight"
            ? sql`${aiGlobalUsageDaily.insightRequests} + 1`
            : aiGlobalUsageDaily.insightRequests,
        workoutRequests:
          feature === "workout_generation"
            ? sql`${aiGlobalUsageDaily.workoutRequests} + 1`
            : aiGlobalUsageDaily.workoutRequests,
        inputTokens: sql`${aiGlobalUsageDaily.inputTokens} + ${inputTokens}`,
        outputTokens: sql`${aiGlobalUsageDaily.outputTokens} + ${outputTokens}`,
        updatedAt: new Date(),
      },
    });
};
