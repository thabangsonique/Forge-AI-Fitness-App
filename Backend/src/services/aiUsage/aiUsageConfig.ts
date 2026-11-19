import { DEFAULT_FORGE_BUSINESS_LIMITS } from "./types";

export const AI_THINKING_LEVELS = ["low", "medium", "high"] as const;
export type AiThinkingLevel = (typeof AI_THINKING_LEVELS)[number];

// AI Provider types
export type AiProvider = "gemini" | "openrouter";

export interface AiConfig {
  aiEnabled: boolean;
  provider: AiProvider;
  apiKey: string;

  //rules from google/openrouter
  maxRequestsPerMinute: number;
  maxRequestsPerDay: number;
  maxInputTokensPerMinute: number;
  maxInputTokensPerRequest: number;
  model: string;
  // Fallback model used when the primary model is temporarily overloaded.
  fallbackModel: string;
  // Hard per-request timeout so AI calls can never hang forever.
  requestTimeoutMs: number;
  // AI 3 reasoning depth (for Gemini only).
  thinkingLevel: AiThinkingLevel;
  // Upper bound on generated text so a looping response cannot run forever.
  maxOutputTokens: number;
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

//function to convert value to number
const parseStrictPositiveInt = (
  value: string | undefined
): number | undefined => {
  if (!value) return undefined;

  const parsed = parseInt(value.trim(), 10);
  if (isNaN(parsed) || parsed <= 0) return undefined;
  return parsed;
};

// format env variables for neat and safe env values access.
export const loadAiConfig = (): AiConfig => {
  const errors: string[] = [];

  // Check if the kill switch is on or off.
  const isEnabled = process.env.AI_ENABLED?.trim() === "true";

  // Determine which provider to use (default to openrouter for free tier support)
  const provider = process.env.AI_PROVIDER?.trim().toLowerCase() as AiProvider || "openrouter";

  // API key comes from different env vars depending on provider
  const geminiApiKey = process.env.GEMINI_API_KEY?.trim() || "";
  const openrouterApiKey = process.env.OPENROUTER_API_KEY?.trim() || "";

  // Select the appropriate API key based on provider
  const apiKey = provider === "gemini" ? geminiApiKey : openrouterApiKey;

  if (isEnabled && !apiKey) {
    errors.push(
      provider === "gemini"
        ? "GEMINI_API_KEY is missing from environment variables."
        : "OPENROUTER_API_KEY is missing from environment variables."
    );
  }

  // Model selection based on provider
  let model: string;
  let fallbackModel: string;

  if (provider === "openrouter") {
    // OpenRouter free tier: Kimi K3 is #1 ranked free model
    // DeepSeek V3 is also excellent and completely free
    model = process.env.OPENROUTER_MODEL?.trim() || "moonshotai/kimi-k3-central";
    fallbackModel = process.env.OPENROUTER_FALLBACK_MODEL?.trim() || "deepseek/deepseek-chat";
  } else {
    // Gemini models
    model = process.env.GEMINI_MODEL?.trim() || "gemini-3.6-flash";
    fallbackModel = process.env.GEMINI_FALLBACK_MODEL?.trim() || "gemini-3.5-flash";
  }

  // Abort a stalled request after this many milliseconds.
  // 30s keeps the mobile UI responsive when AI is unavailable.
  const requestTimeoutMs =
    parseStrictPositiveInt(process.env.AI_REQUEST_TIMEOUT_MS) || 30_000;

  // Thinking level for Gemini 3 models only
  const rawThinkingLevel = process.env.GEMINI_THINKING_LEVEL?.trim().toLowerCase();
  const thinkingLevel: AiThinkingLevel = AI_THINKING_LEVELS.includes(
    rawThinkingLevel as AiThinkingLevel
  )
    ? (rawThinkingLevel as AiThinkingLevel)
    : "low";

  // Use provider-specific max output tokens (or openrouter specific)
  const maxOutputTokens =
    parseStrictPositiveInt(process.env.OPENROUTER_MAX_OUTPUT_TOKENS) ||
    parseStrictPositiveInt(process.env.GEMINI_MAX_OUTPUT_TOKENS) || 1500;

  // Rate limits - use generic env vars or provider-specific ones
  const maxRequestsPerMinute = parseStrictPositiveInt(
    process.env.AI_MAX_REQUESTS_PER_MINUTE ||
    process.env.OPENROUTER_MAX_REQUESTS_PER_MINUTE ||
    process.env.GEMINI_MAX_REQUESTS_PER_MINUTE
  );

  if (isEnabled && !maxRequestsPerMinute) {
    errors.push("AI_MAX_REQUESTS_PER_MINUTE must be a valid number greater than 0.");
  }

  const maxRequestsPerDay = parseStrictPositiveInt(
    process.env.AI_MAX_REQUESTS_PER_DAY ||
    process.env.OPENROUTER_MAX_REQUESTS_PER_DAY ||
    process.env.GEMINI_MAX_REQUESTS_PER_DAY
  );

  if (isEnabled && !maxRequestsPerDay) {
    errors.push("AI_MAX_REQUESTS_PER_DAY must be a valid number greater than 0.");
  }

  const maxInputTokensPerMinute = parseStrictPositiveInt(
    process.env.AI_MAX_INPUT_TOKENS_PER_MINUTE ||
    process.env.OPENROUTER_MAX_INPUT_TOKENS_PER_MINUTE ||
    process.env.GEMINI_MAX_INPUT_TOKENS_PER_MINUTE
  );

  if (isEnabled && !maxInputTokensPerMinute) {
    errors.push("AI_MAX_INPUT_TOKENS_PER_MINUTE must be a valid number greater than 0.");
  }

  //FORGE RESTRICTIONS
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
    provider,
    apiKey,
    model,
    fallbackModel,
    requestTimeoutMs,
    thinkingLevel,
    maxOutputTokens,
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