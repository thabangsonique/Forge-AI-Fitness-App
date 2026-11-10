import { eq } from "drizzle-orm";
import { db } from "../../db";
import { usageAiTrials, userSubscriptions } from "../../db/schema";
import { loadAiConfig } from "./aiUsageConfig";
import {
  AiFeatureType,
  SubscriptionTier,
  UserEntitlementCheck,
  UserTrialSummary,
} from "./types";
//function triggared when the user generates something with Ai
//CHECKS IF USER TRIAL EXISTS OR NEEDS A TRIAL CREATED FOR THEM
export const getOrCreateUserTrial = async (userId: string) => {
  const config = loadAiConfig();

  //check if the first time user has a trial record.(is the user already on a trial)
  const existingTrial = await db.query.usageAiTrials.findFirst({
    where: eq(usageAiTrials.userId, userId),
  });

  if (existingTrial) {
    return existingTrial; //nothing after here runs. user trial exists already
  }

  //if user trial doesnt exist already

  const startedAt = new Date();
  const trialEnds = new Date(
    startedAt.getTime() + config.trialDays * 24 * 60 * 60 * 1000
  );
  const [newTrial] = await db
    .insert(usageAiTrials)
    .values({
      userId,
      startedAt,
      trialEnds,
      workoutGenerationsUsed: 0,
      insightsUsed: 0,
    })
    .returning();

  return newTrial;
};

export const getSubscriptionTier = async (
  userId: string
): Promise<SubscriptionTier> => {
  const subscription = await db.query.userSubscriptions.findFirst({
    where: eq(userSubscriptions.userId, userId),
  });

  if (subscription && subscription.status === "active") {
    return subscription.tier as SubscriptionTier;
  }

  return "free";
};

export const getUserTrialSummary = async (
  userId: string
): Promise<UserTrialSummary> => {
  const config = loadAiConfig();
  const trial = await getOrCreateUserTrial(userId);

  const now = new Date();
  const isExpired = now > trial.trialEnds;

  //find days remaining.
  const miliSecRemaining = now.getTime() - trial.trialEnds.getTime();

  const daysRemaining = Math.ceil(miliSecRemaining / (24 * 60 * 60 * 1000));

  const insightsRemaining = config.trialMaxInsights - trial.insightsUsed;

  const workoutGenerationsRemaining =
    config.trialMaxWorkoutGenerations - trial.workoutGenerationsUsed;

  const isEligible =
    !isExpired && (workoutGenerationsRemaining > 0 || insightsRemaining > 0);

  return {
    isEligible,
    isExpired,
    daysRemaining,
    insightsUsed: trial.insightsUsed,
    insightsRemaining,
    workoutGenerations: trial.workoutGenerationsUsed,
    workoutGenerationsRemaining,
  };
};

//Checks if the user is authorized based on their trial standing to make these generations.
export const checkUserEntitlement = async (
  userId: string,
  feature: AiFeatureType
): Promise<UserEntitlementCheck> => {
  const config = loadAiConfig();

  const tier = await getSubscriptionTier(userId);

  if (tier === "premium") {
    const trialSummary = await getUserTrialSummary(userId);

    return {
      allowed: true,
      tier: "premium",
      trialSummary,
    };
  }

  //if the user is not on premium.
  const trialSummary = await getUserTrialSummary(userId);
  if (trialSummary.isEligible) {
    return {
      allowed: false,
      reason: `Your ${config.trialDays}-day free trial has expired. Upgrade to Forge Pro to continue using AI coaching.`,
      tier: "free",
      trialSummary,
    };
  }

  //Check if the user's request for generation belongs to workout or insight generation.

  if (feature === "coach_insight") {
    if (trialSummary.insightsRemaining <= 0) {
      return {
        allowed: false,
        reason: `You have used all ${config.trialMaxInsights} of your free AI coach insights. Upgrade to Forge Pro for unlimited insights.`,
        tier: "free",
        trialSummary,
      };
    }
  } else if (feature === "workout_generation") {
    if (trialSummary.workoutGenerationsRemaining <= 0) {
      return {
        allowed: false,
        reason: `You have used all ${config.trialMaxWorkoutGenerations} of your free AI workout generations. Upgrade to Forge Pro for unlimited workouts.`,
        tier: "free",
        trialSummary,
      };
    }
  }

  //Return if all checks for the user on a trial period have passed.
  return {
    allowed: true,
    tier: "free",
    trialSummary,
  };
};
