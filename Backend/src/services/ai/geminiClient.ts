import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import type { AiThinkingLevel } from "../aiUsage/aiUsageConfig";

const THINKING_LEVEL_MAP: Record<AiThinkingLevel, ThinkingLevel> = {
  low: ThinkingLevel.LOW,
  medium: ThinkingLevel.MEDIUM,
  high: ThinkingLevel.HIGH,
};

let client: GoogleGenAI | undefined;
let clientApiKey: string | undefined;

export const getGeminiClient = (apiKey: string): GoogleGenAI => {
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is missing from environment variables.");
  }

  if (!client || clientApiKey !== apiKey) {
    client = new GoogleGenAI({ apiKey });
    clientApiKey = apiKey;
  }

  return client;
};

export const isGemini3Model = (model: string): boolean =>
  /^gemini-3/i.test(model);

export const getGeminiThinkingConfig = (
  model: string,
  thinkingLevel: AiThinkingLevel
):
  | { thinkingLevel: ThinkingLevel }
  | { thinkingBudget: number }
  | undefined => {
  if (isGemini3Model(model)) {
    return { thinkingLevel: THINKING_LEVEL_MAP[thinkingLevel] };
  }

  if (/^gemini-2\.5/i.test(model)) {
    return { thinkingBudget: 0 };
  }

  return undefined;
};
