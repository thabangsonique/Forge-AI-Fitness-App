import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import type { AiThinkingLevel } from "../aiUsage/aiUsageConfig";

// OpenRouter API key - use the same variable name but from OPENROUTER_API_KEY
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY?.trim() || "";

let client: ReturnType<typeof createOpenRouter> | undefined;
let clientApiKey: string | undefined;

export const getOpenRouterClient = (apiKey: string): ReturnType<typeof createOpenRouter> => {
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is missing from environment variables.");
  }

  if (!client || clientApiKey !== apiKey) {
    client = createOpenRouter({
      apiKey,
    });
    clientApiKey = apiKey;
  }

  return client;
};

// OpenRouter has its own model naming convention.
// Examples:
// - moonshotai/kimi-k3-central (top free model)
// - deepseek/deepseek-chat (DeepSeek V3)
// - google/gemini-2.0-flash (Gemini via OpenRouter)
// - meta-llama/llama-3.1-8b-instruct
export const OPENROUTER_MODELS = {
  PRIMARY: "moonshotai/kimi-k3-central",
  FALLBACK: "deepseek/deepseek-chat",
} as const;

/**
 * OpenRouter-specific thinking/config handling.
 * Unlike Gemini, OpenRouter uses different parameters.
 */
export const getOpenrouterConfig = (model: string, thinkingLevel: AiThinkingLevel) => {
  // Most OpenRouter models accept standard parameters
  // Thinking level for Gemini 3 models doesn't apply to OpenRouter
  return {
    temperature: thinkingLevel === "low" ? 0.3 : thinkingLevel === "medium" ? 0.6 : 0.8,
    maxTokens: 2000, // Can be overridden by environment
  };
};

/**
 * Check if a model identifier is from OpenRouter.
 */
export const isOpenrouterModel = (model: string): boolean => {
  const openrouterModelPrefixes = [
    "moonshot/",
    "deepseek/",
    "google/",
    "meta-llama/",
    "anthropic/",
    "mistral/",
    "cohere/",
    "openrouter/",
  ];
  return openrouterModelPrefixes.some(prefix => model.startsWith(prefix));
};

/**
 * OpenRouter-specific error classification.
 */
export interface OpenrouterError {
  status?: number;
  message: string;
  type?: string;
  param?: string;
  code?: string;
}

export const getOpenrouterErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  if (typeof error === "object" && error !== null) {
    const err = error as Record<string, unknown>;
    return (err.message as string) || "Unknown OpenRouter API error";
  }
  return "Unknown OpenRouter API error";
};

export const getOpenrouterHttpStatus = (error: unknown): number | undefined => {
  if (typeof error !== "object" || error === null) return undefined;
  const err = error as Record<string, unknown>;
  const status = err.status;
  return typeof status === "number" ? status : undefined;
};