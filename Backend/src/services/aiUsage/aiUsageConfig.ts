import { DEFAULT_FORGE_BUSINESS_LIMITS } from "./types";

export interface AiConfig {
  aiEnabled: boolean;
  apiKey: string;

  //rules from google
  maxRequestsPerMinute: number;
  maxRequestsPerDay: number;
  maxInputTokensPerMinute: number;
  maxInputTokensPerRequest: number;
  model: string;
  // Forge Safety Buffer:
  globalDailyRequestCap: number;
  // Forge Business Usage Limits (Per User):
  userCooldownSeconds: number;
  trialDays: number;
  trialMaxInsights: number;
  trialMaxWorkoutGenerations: number;
  // Health and validation status:
  isValid: boolean;
  validationErrors: string[];
}

//function to convert value to njumbetr
const parseStrictPositiveInt = (
  value: string | undefined
): number | undefined => {
  if (!value) {
    return undefined;
  }

  const parsed = parseInt(value.trim(), 10);
  if (isNaN(parsed) || parsed <= 0) return undefined;
  return parsed;
};

// format env variables for neat and safe env values access.
export const loadAiConfig = (): AiConfig => {
  const errors: string[] = [];

  //check if the kill switch is on or off.
  const isEnabled = process.env.AI_ENABLED?.trim() === "true";

  const apiKey = process.env.GEMINI_API_KEY?.trim() || "";

  if (isEnabled && !apiKey) {
    errors.push("GEMINI_API_KEY is missing from environment variables.");
  }

  const model = process.env.GEMINI_MODEL?.trim() || "gemini-2.5-flash";

  const maxRequestsPerMinute = parseStrictPositiveInt(
    process.env.GEMINI_MAX_REQUESTS_PER_MINUTE
  );

  if (isEnabled && !maxRequestsPerMinute) {
    errors.push(
      "GEMINI_MAX_REQUESTS_PER_MINUTE must be a valid number greater than 0."
    );
  }

  const maxRequestsPerDay = parseStrictPositiveInt(
    process.env.GEMINI_MAX_REQUESTS_PER_DAY
  );

  if (isEnabled && !maxRequestsPerDay) {
    errors.push(
      "GEMINI_MAX_REQUESTS_PER_DAY must be a valid number greater than 0."
    );
  }

  const maxInputTokensPerMinute = parseStrictPositiveInt(
    process.env.GEMINI_MAX_INPUT_TOKENS_PER_MINUTE
  );

  if (isEnabled && !maxInputTokensPerMinute) {
    errors.push(
      "GEMINI_MAX_INPUT_TOKENS_PER_MINUTE must be a valid number greater than 0."
    );
  }

  //FORGE RESITRICTIONS
  const globalDailyRequestCap =
    parseStrictPositiveInt(process.env.AI_GLOBAL_DAILY_REQUEST_CAP) ||
    maxRequestsPerDay ||
    50;

  const maxInputTokensPerRequest =
    parseStrictPositiveInt(process.env.AI_MAX_INPUT_TOKENS_PER_REQUEST) || 4000;

  const trialDays =
    parseStrictPositiveInt(process.env.FORGE_TRIAL_DAYS) ||
    DEFAULT_FORGE_BUSINESS_LIMITS.TRIAL_DAYS;

  //max insights generated per user on trial.
  const trialMaxInsights =
    parseStrictPositiveInt(process.env.FORGE_TRIAL_MAX_INSIGHTS) || 3;

  //max workout generations per user on trial.
  const trialMaxWorkoutGenerations =
    parseStrictPositiveInt(process.env.FORGE_TRIAL_MAX_WORKOUT_GENERATIONS) ||
    2;

  //seconds between user generations
  const userCooldownSeconds =
    parseStrictPositiveInt(process.env.FORGE_USER_COOLDOWN_SECONDS) || 10;

  const isValid = errors.length === 0;

  const finalAiEnabled = isEnabled && isValid;

  if (errors.length > 0 && isEnabled) {
    console.warn(
      "⚠️ [AI Config Warning] AI features disabled due to configuration errors:\n",
      errors.join("\n")
    );
  }

  return {
    aiEnabled: finalAiEnabled,
    apiKey,
    model,
    maxRequestsPerMinute: maxRequestsPerMinute || 0,
    maxRequestsPerDay: maxRequestsPerDay || 0,
    maxInputTokensPerMinute: maxInputTokensPerMinute || 0,
    maxInputTokensPerRequest,
    globalDailyRequestCap,
    userCooldownSeconds,
    trialDays,
    trialMaxInsights,
    trialMaxWorkoutGenerations,
    isValid,
    validationErrors: errors,
  };
};
