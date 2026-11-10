import { and, eq, lt, sql } from "drizzle-orm";
import { db } from "../../db";
import { aiUsageEvents, usageAiTrials } from "../../db/schema";
import { recordDailyQuotaUsage } from "./aiQuotaService";
import { loadAiConfig } from "./aiUsageConfig";
import {
  AiFeatureType,
  FinalizeReservationParams,
  ReleaseReservationParams,
  SubscriptionTier,
  UsageReservation,
} from "./types";

export const createUsageReservation = async (
  userId: string,
  feature: AiFeatureType,
  tier: SubscriptionTier
): Promise<UsageReservation> => {
  const config = loadAiConfig();

  //if user is on the free trial
  if (tier === "free") {
    if (feature === "coach_insight") {
      const updated = await db
        .update(usageAiTrials)
        .set({
          insightsUsed: sql`${usageAiTrials.insightsUsed} + 1`,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(usageAiTrials.userId, userId),
            lt(usageAiTrials.insightsUsed, config.trialMaxInsights)
          )
        )
        .returning();

      //If no rules were updated, the user has reached their trial limit.
      if (updated.length === 0) {
        throw new Error(
          `Your trial limit of ${config.trialMaxInsights} AI insights has been reached.`
        );
      }
    } else if (feature === "workout_generation") {
      const updated = await db
        .update(usageAiTrials)
        .set({
          workoutGenerationsUsed: sql`${usageAiTrials.workoutGenerationsUsed} + 1`,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(usageAiTrials.userId, userId),
            lt(
              usageAiTrials.workoutGenerationsUsed,
              config.trialMaxWorkoutGenerations
            )
          )
        )
        .returning();

      if (updated.length === 0) {
        throw new Error(
          `Your trial limit of ${config.trialMaxWorkoutGenerations} AI Workout generations has been reached.`
        );
      }
    }
  }

  //Record the AI generation event to track inflight requests.
  const [pendingEvent] = await db
    .insert(aiUsageEvents)
    .values({
      userId,
      feature,
      model: config.model,
      inputTokens: 0,
      outputTokens: 0,
      estimatedCostUsd: 0,
    })
    .returning({
      id: aiUsageEvents.id,
      createdAt: aiUsageEvents.createdAt,
    });

  return {
    reservationId: pendingEvent.id,
    userId,
    feature,
    model: config.model,
    reservedAt: pendingEvent.createdAt,
  };
};

//Function triggered after Google Gemini has a successful response. - track total token usage.
export const finalizeReservationParams = async (
  params: FinalizeReservationParams
): Promise<void> => {
  const { feature, tokens, reservationId } = params;

  await db
    .update(aiUsageEvents)
    .set({
      status: "success",
      inputTokens: tokens.inputTokens,
      outputTokens: tokens.outputTokens,
    })
    .where(eq(aiUsageEvents.id, reservationId));

  await recordDailyQuotaUsage(feature, tokens.inputTokens, tokens.outputTokens);
};

//Release tokens back to user upon Gemini failure.
export const releaseReservation = async (
  params: ReleaseReservationParams
): Promise<void> => {
  const { userId, feature, reservationId, errorMessage } = params;

  await db
    .update(aiUsageEvents)
    .set({
      status: "failed",
      errorMessage: errorMessage.slice(0, 500),
    })
    .where(eq(aiUsageEvents.id, reservationId));

  await db
    .update(usageAiTrials)
    .set({
      insightsUsed:
        feature === "coach_insight"
          ? sql`GREATEST (0, ${usageAiTrials.insightsUsed} -1)`
          : usageAiTrials.insightsUsed,
      workoutGenerationsUsed:
        feature === "workout_generation"
          ? sql`GREATEST (0, ${usageAiTrials.workoutGenerationsUsed} - 1)`
          : usageAiTrials.workoutGenerationsUsed,
      updatedAt: new Date(),
    })
    .where(eq(usageAiTrials.userId, userId));
};
