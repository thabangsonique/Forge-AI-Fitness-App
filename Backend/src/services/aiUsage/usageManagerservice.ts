import { and, desc, eq, lt } from "drizzle-orm";
import { db } from "../../db";
import { aiInsights, aiUsageEvents } from "../../db/schema";
import { checkGlobalAiQuota } from "./aiQuotaService";
import { loadAiConfig } from "./aiUsageConfig";
import { checkUserEntitlement } from "./subscriptionService";
import {
  AiFeatureType,
  CachedAiResult,
  FinalizeReservationParams,
  ReleaseReservationParams,
  SubscriptionTier,
  UsageReservation,
} from "./types";
import {
  createUsageReservation,
  finalizeReservationParams,
  releaseReservation,
} from "./usageReservationService";

export interface PrepareAiExecutionResult<T = unknown> {
  shouldExecute: boolean;
  reservation?: UsageReservation;
  tier?: SubscriptionTier;
  cachedResult?: T; //takes any  shape
  blockedReason?: string;
  retryAfterSeconds?: number;
}

export const getCachedInsight = async <T = unknown>(
  userId: string,
  fingerprint: string
): Promise<CachedAiResult<T>> => {
  const existing = await db.query.aiInsights.findFirst({
    where: and(
      eq(aiInsights.userId, userId),
      eq(aiInsights.fingerprint, fingerprint)
    ),
    orderBy: [desc(aiInsights.generatedAt)],
  });

  if (existing) {
    return {
      hit: true,
      data: existing.data as T,
      generatedAt: existing.generatedAt,
    };
  }

  return {
    hit: false,
  };
};

// Refund and fail reservations that were abandoned (for example, the server
// restarted while a Gemini request was still in flight). Without this, those
// requests stay "pending" forever and permanently consume a trial credit.
export const reconcileStaleReservations = async (
  maxAgeMinutes = 2
): Promise<number> => {
  const cutoff = new Date(Date.now() - maxAgeMinutes * 60 * 1000);

  const staleEvents = await db
    .select({
      id: aiUsageEvents.id,
      userId: aiUsageEvents.userId,
      feature: aiUsageEvents.feature,
    })
    .from(aiUsageEvents)
    .where(
      and(
        eq(aiUsageEvents.status, "pending"),
        lt(aiUsageEvents.createdAt, cutoff)
      )
    );

  for (const event of staleEvents) {
    await releaseReservation({
      reservationId: event.id,
      userId: event.userId,
      feature: event.feature as AiFeatureType,
      errorMessage: "Stale pending AI request automatically reconciled.",
    });
  }

  if (staleEvents.length > 0) {
    console.log(
      `[AI Usage] Reconciled ${staleEvents.length} stale pending request(s).`
    );
  }

  return staleEvents.length;
};

//save generated insight inside cached table
export const savedCachedInsight = async (
  userId: string,
  fingerprint: string,
  lastWorkoutSessionId: string | null,
  data: unknown
): Promise<void> => {
  await db.insert(aiInsights).values({
    userId,
    fingerprint,
    lastWorkoutSessionId: lastWorkoutSessionId || undefined,
    data: data as any,
  });
};

//First prepare the AI execution.
export const prepareAiExecution = async <T = unknown>(params: {
  userId: string;
  feature: AiFeatureType;
  fingerprint?: string;
}): Promise<PrepareAiExecutionResult<T>> => {
  const { userId, feature, fingerprint } = params;

  const config = loadAiConfig();

  if (!config.aiEnabled) {
    return {
      shouldExecute: false,
      blockedReason:
        "AI coaching features are temporarily paused for maintenance. Please check back later.",
    };
  }

  if (fingerprint) {
    const cached = await getCachedInsight<T>(userId, fingerprint);

    if (cached.hit) {
      return {
        shouldExecute: false,
        cachedResult: cached.data,
      };
    }
  }

  //check if user is entited
  const entitlement = await checkUserEntitlement(userId, feature);
  if (!entitlement.allowed) {
    return {
      shouldExecute: false,
      blockedReason: entitlement.reason,
      tier: entitlement.tier,
    };
  }

  //Check applications pending as far as workout generation is concerned.
  const quota = await checkGlobalAiQuota(userId);
  if (!quota.allowed) {
    return {
      shouldExecute: false,
      blockedReason: quota.reason,
      retryAfterSeconds: quota.retryAfterSeconds,
      tier: entitlement.tier,
    };
  }

  //After all checks passes, create request reservation.
  try {
    const reservation = await createUsageReservation(
      userId,
      feature,
      entitlement.tier
    );

    return {
      shouldExecute: true,
      reservation,
      tier: entitlement.tier,
    };
  } catch (error: any) {
    return {
      shouldExecute: false,
      blockedReason: error.message || "Failed to reserve AI usage slot.",
      tier: entitlement.tier,
    };
  }
};

export async function completeAiExecution(
  params: FinalizeReservationParams
): Promise<void> {
  await finalizeReservationParams(params);
}

export async function abortAiExecution(
  params: ReleaseReservationParams
): Promise<void> {
  await releaseReservation(params);
}
