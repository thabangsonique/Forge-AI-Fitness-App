//logic limits for free trial users. - defines paremeters for user's free tier
export const DEFAULT_FORGE_BUSINESS_LIMITS = {
  TRIAL_DAYS: 7,
  TRIAL_MAX_INSIGHT: 3,
  TRIAL_MAX_WORKOUT_GENERATION: 3,
  USER_COOLDOWN_SECONDS: 10,
} as const;

export type AiFeatureType = "coach_insight" | "workout_generation";
//subscription tier types amd reservation status.
export type SubscriptionTier = "free" | "premium";

export type ReservationStatus = "pending" | "success" | "failed";

//user standing with the trial. -tell user their standing with remaining insights and workout generation
export interface UserTrialSummary {
  isEligible: boolean;
  isExpired: boolean;
  daysRemaining: number;
  insightsUsed: number;
  insightsRemaining: number;
  workoutGenerations: number;
  workoutGenerationsRemaining: number;
}

//check if user is authorized to make the request and why based on the trial status
export interface UserEntitlementCheck {
  allowed: boolean;
  reason?: string;
  tier: SubscriptionTier;
  trialSummary: UserTrialSummary;
}

//forge's capacity
export interface QuotaCheckResult {
  allowed: boolean;
  reason?: string;
  currentDailyRequests: number;
  maxDailyRequests: number;
  retryAfterSeconds?: number;
}

//TRACKING AI USAGE
//record of the request made by the user(pending mode)
export interface UsageReservation {
  reservationId: string; // The UUID of the pending row in aiUsageEvents
  userId: string;
  feature: AiFeatureType;
  model: string;
  reservedAt: Date;
}

//tokens used by the user's generations
export interface GeminiUsageMetadata {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}

//update pending request
export interface FinalizeReservationParams {
  reservationId: string;
  userId: string;
  feature: AiFeatureType;
  tokens: GeminiUsageMetadata;
}

//when ai request fails.
export interface ReleaseReservationParams {
  reservationId: string;
  userId: string;
  feature: AiFeatureType;
  errorMessage: string;
}

//re-use data if already exists
export interface CachedAiResult<T = unknown> {
  hit: boolean;
  data?: T;
  generatedAt?: Date;
}
