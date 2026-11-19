// OpenRouter-based coach insight service

import { count, eq } from "drizzle-orm";
import { db } from "../../db";
import { workoutSession } from "../../db/schema";
import { generateFingerPrint } from "../aiCoach/promptBuilder";
import type { AiCoachInsightResponse } from "../aiCoach/types";
import { loadAiConfig } from "../aiUsage/aiUsageConfig";
import {
  abortAiExecution,
  completeAiExecution,
  prepareAiExecution,
  savedCachedInsight,
} from "../aiUsage/usageManagerservice";
import { getFitnessContext } from "../fitnessAnalytics/fitnessAnalyticsService";

const OPENROUTER_MAX_ATTEMPTS = 3;
const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

const COACH_SYSTEM_PROMPT = `You are Forge AI Coach, a personal fitness trainer.
Analyze the user's workout history and provide detailed insights.
Format the response as JSON matching the provided schema exactly.

Required fields:
- muscleFocus: { title, explanation, neglectedMuscles[], recommendations[] }
- volume: { title, explanation, trendStatus, recommendations[] }
- strength: { title, praise, progressionAnalysis, exercisesToFocus[] }
- overall: { headline, detailedFeedback, nextMilestone, goalAlignment }`;

interface CoachInsightResponse {
  muscleFocus: {
    title: string;
    explanation: string;
    neglectedMuscles: string[];
    recommendations: string[];
  };
  volume: {
    title: string;
    explanation: string;
    trendStatus:
      | "increasing"
      | "decreasing"
      | "consistent"
      | "insufficient_data";
    recommendations: string[];
  };
  strength: {
    title: string;
    praise: string;
    progressionAnalysis: string;
    exercisesToFocus: string[];
  };
  overall: {
    headline: string;
    detailedFeedback: string;
    nextMilestone: string;
    goalAlignment: string;
  };
}

const COACH_REQUIRED_FIELDS: Record<
  string,
  Record<string, "string" | "array">
> = {
  muscleFocus: {
    title: "string",
    explanation: "string",
    neglectedMuscles: "array",
    recommendations: "array",
  },
  volume: {
    title: "string",
    explanation: "string",
    trendStatus: "string",
    recommendations: "array",
  },
  strength: {
    title: "string",
    praise: "string",
    progressionAnalysis: "string",
    exercisesToFocus: "array",
  },
  overall: {
    headline: "string",
    detailedFeedback: "string",
    nextMilestone: "string",
    goalAlignment: "string",
  },
};

const hasFieldValue = (value: unknown, kind: "string" | "array") =>
  kind === "array"
    ? Array.isArray(value)
    : typeof value === "string" && value.trim().length > 0;

const parseCoachInsight = (rawText: string): AiCoachInsightResponse => {
  let parsed: unknown;

  try {
    parsed = JSON.parse(rawText);
  } catch {
    throw new Error("OpenRouter returned a malformed coaching response.");
  }

  if (typeof parsed !== "object" || parsed === null) {
    throw new Error("OpenRouter returned an empty coaching response.");
  }

  const record = parsed as Record<string, unknown>;

  for (const [section, fields] of Object.entries(COACH_REQUIRED_FIELDS)) {
    const sectionValue = record[section];

    if (typeof sectionValue !== "object" || sectionValue === null) {
      throw new Error(
        `OpenRouter returned an incomplete coaching response (missing ${section}).`
      );
    }

    const sectionRecord = sectionValue as Record<string, unknown>;

    for (const [field, kind] of Object.entries(fields)) {
      if (!hasFieldValue(sectionRecord[field], kind)) {
        throw new Error(
          `OpenRouter returned an incomplete coaching response (missing ${section}.${field}).`
        );
      }
    }
  }

  return {
    muscleFocus: record.muscleFocus as any,
    volume: record.volume as any,
    strength: record.strength as any,
    overall: record.overall as any,
    generatedAt: new Date().toISOString(),
  };
};

const sleep = (ms: number, signal: AbortSignal): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(new Error("OpenRouter request timed out."));
      return;
    }

    const onAbort = () => {
      clearTimeout(timer);
      reject(new Error("OpenRouter request timed out."));
    };

    const timer = setTimeout(() => {
      signal.removeEventListener("abort", onAbort);
      resolve();
    }, ms);

    signal.addEventListener("abort", onAbort, { once: true });
  });
};

/**
 * Generate coach insights using OpenRouter
 */
export const generateUserCoachInsightOpenrouter = async (
  userId: string
): Promise<
  | {
      success: true;
      source: "openrouter";
      data: AiCoachInsightResponse;
    }
  | {
      success: false;
      error: string;
      failureCode?: string;
      retryAfterSeconds?: number;
    }
> => {
  console.log("[OpenRouter Coach] Starting AI request for user:", userId);

  const config = loadAiConfig();

  //fetch user training data
  const fitnessContext = await getFitnessContext(userId);

  //total users completed sessions.
  const [totalSessions] = await db
    .select({ count: count() })
    .from(workoutSession)
    .where(eq(workoutSession.userId, userId));

  if (totalSessions.count < 2) {
    return {
      success: false,
      error:
        "Log at least 2 completed workouts before generating an AI insight.",
      failureCode: "insufficient_data",
    };
  }

  //create request fingerprint
  const fingerprint = generateFingerPrint(userId, fitnessContext);

  console.log(
    "[OpenRouter Coach check] fingerprint fitness context",
    fitnessContext
  );
  //Function gives us the go-ahead as to whether proceed with new generation or not.
  const gate = await prepareAiExecution<AiCoachInsightResponse>({
    userId,
    feature: "coach_insight",
    fingerprint,
  });

  console.log("[OpenRouter Coach check] prepareAi approval", gate);

  if (!gate.shouldExecute) {
    if (gate.cachedResult) {
      return {
        success: true, //CONTINUE FROM HERE.
        source: "openrouter" as const,
        data: gate.cachedResult,
      };
    }

    return {
      success: false,
      error: gate.blockedReason || "AI generation is not available right now.",
      failureCode: gate.retryAfterSeconds ? "rate_limited" : undefined,
      retryAfterSeconds: gate.retryAfterSeconds,
    };
  }

  const reservation = gate.reservation;

  if (!reservation) {
    console.log("[OpenRouter Coach check] false reservation", reservation);
    return {
      success: false,
      error: "AI execution approved without a reservation.",
    };
  }

  const timeoutController = new AbortController();
  const timeoutId = setTimeout(() => {
    timeoutController.abort();
  }, config.requestTimeoutMs);

  const startedAt = Date.now();

  try {
    // Build the prompt
    const fitnessData = JSON.stringify(fitnessContext, null, 2);
    const systemPrompt = COACH_SYSTEM_PROMPT;
    const userPrompt = `
Analyze this user's fitness data and provide detailed coaching insights.

User's Fitness History:
${fitnessData}

Generate insights for each category: muscle focus, volume trends, strength progression, and overall summary.
`;

    const modelsToTry = Array.from(
      new Set([config.model, config.fallbackModel].filter(Boolean))
    );

    let response: any;
    let lastError: unknown;

    for (const model of modelsToTry) {
      try {
        const httpResponse = await fetch(OPENROUTER_API_URL, {
          method: "POST",
          signal: timeoutController.signal,
          headers: {
            Authorization: `Bearer ${config.apiKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "https://your-domain.com",
            "X-Title": "Forge AI Fitness App",
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt },
            ],
            temperature:
              config.thinkingLevel === "low"
                ? 0.3
                : config.thinkingLevel === "medium"
                  ? 0.6
                  : 0.8,
            max_tokens: config.maxOutputTokens,
          }),
        });

        console.log(
          `[OpenRouter Coach] Response headers received | model=${model} status=${httpResponse.status}`
        );

        const responseText = await httpResponse.text();

        console.log(
          `[OpenRouter Coach] Response body received | model=${model} characters=${responseText.length}`
        );

        let responseBody: any;

        try {
          responseBody = JSON.parse(responseText);
        } catch {
          throw new Error(
            `OpenRouter returned invalid JSON: ${responseText.slice(0, 1000)}`
          );
        }

        const providerError =
          responseBody.error ?? responseBody.choices?.[0]?.error;

        if (
          !httpResponse.ok ||
          providerError ||
          responseBody.choices?.[0]?.finish_reason === "error"
        ) {
          const errorMessage =
            providerError?.message ??
            `OpenRouter API error: ${httpResponse.status}`;

          console.error(`[OpenRouter Coach] Model failed | model=${model}`, {
            status: httpResponse.status,
            error: providerError ?? responseBody,
          });

          const error = new Error(errorMessage) as Error & {
            status?: number;
          };

          error.status = httpResponse.status;

          throw error;
        }

        response = responseBody;

        console.log(`[OpenRouter Coach] Response parsed | model=${model}`, {
          hasChoices: Boolean(response.choices?.length),
          finishReason: response.choices?.[0]?.finish_reason,
          hasContent: Boolean(response.choices?.[0]?.message?.content),
          contentLength: response.choices?.[0]?.message?.content?.length ?? 0,
        });

        break;
      } catch (error) {
        lastError = error;

        if (timeoutController.signal.aborted) {
          throw error;
        }

        console.warn(
          `[OpenRouter Coach] ${model} failed, trying fallback...`,
          error
        );
      }
    }

    if (!response || !response.choices?.[0]?.message?.content) {
      throw (
        lastError ?? new Error("OpenRouter did not return a valid response.")
      );
    }

    const rawText = response.choices[0].message.content;

    // Diagnostic log: see exactly what the AI is sending
    console.log("[OpenRouter Coach] Raw Response:", rawText);

    if (!rawText || rawText.trim().length === 0) {
      throw new Error("OpenRouter returned no coaching content.");
    }

    // Try to extract JSON if the AI returned conversational text
    let jsonText = rawText;
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonText = jsonMatch[0];
    }

    const coachingResponse = parseCoachInsight(jsonText);

    //Token usage
    const usage = response.usage;
    const inputTokens = usage?.prompt_tokens || 0;
    const outputTokens = usage?.completion_tokens || 0;
    const totalTokens = inputTokens + outputTokens;

    console.log(`[OpenRouter Coach] completed in ${Date.now() - startedAt}ms`);

    console.log("[OpenRouter Coach] Completing AI execution...");

    await completeAiExecution({
      reservationId: reservation.reservationId,
      userId,
      feature: "coach_insight",
      tokens: {
        inputTokens,
        outputTokens,
        totalTokens,
      },
    });

    console.log("[OpenRouter Coach] AI execution completed.");

    console.log("[OpenRouter Coach] Saving cached insight...");

    await savedCachedInsight(userId, fingerprint, null, coachingResponse);

    console.log("[OpenRouter Coach] Cached insight saved.");
    return {
      success: true,
      source: "openrouter",
      data: coachingResponse,
    };
  } catch (error: any) {
    const rawMessage = error.message || "Unknown error";
    const status = error.status;

    let failureCode = "generation_failed";
    let message =
      "Unable to generate AI coaching insights right now. Please try again shortly.";
    let retryAfterSeconds: number | undefined;

    if (status === 429) {
      failureCode = "quota_exceeded";
      message = "The AI has reached its usage limit. Please try again later.";
      retryAfterSeconds = 60;
    } else if (status === 503) {
      failureCode = "ai_busy";
      message =
        "The AI service is busy right now. Please try again in a moment.";
      retryAfterSeconds = 30;
    }

    const isTimeout =
      timeoutController.signal.aborted ||
      error?.name === "AbortError" ||
      /timeout|timed out|aborted/i.test(rawMessage);

    if (isTimeout) {
      failureCode = "ai_timeout";
      message = "The AI took too long to respond. Please try again.";
      retryAfterSeconds = 30;
    }

    console.error(`❌ [OpenRouter Coach Error] ${failureCode}:`, rawMessage);

    await abortAiExecution({
      reservationId: reservation.reservationId,
      userId,
      feature: "coach_insight",
      errorMessage: `${failureCode}: ${rawMessage}`,
    });

    return {
      success: false,
      failureCode,
      error: message,
      retryAfterSeconds,
    };
  } finally {
    clearTimeout(timeoutId);
  }
};
